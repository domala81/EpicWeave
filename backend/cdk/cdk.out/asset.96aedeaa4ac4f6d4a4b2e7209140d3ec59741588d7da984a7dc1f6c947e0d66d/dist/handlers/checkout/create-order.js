"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_ssm_1 = require("@aws-sdk/client-ssm");
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
const stripe_1 = __importDefault(require("stripe"));
const client = new client_dynamodb_1.DynamoDBClient({});
const ddb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const ssm = new client_ssm_1.SSMClient({});
const secrets = new client_secrets_manager_1.SecretsManagerClient({});
const TABLE_NAME = process.env.TABLE_NAME;
/**
 * POST /orders
 * Create order with Stripe payment, stock validation, and DynamoDB TransactWriteItems
 * Requires: Cognito authentication
 */
const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
        if (!userId) {
            return (0, types_1.ERROR_RESPONSE)(401, 'Unauthorized');
        }
        const body = JSON.parse(event.body || '{}');
        const { shippingAddress, paymentMethodId } = body;
        // 1. Validate shipping address (US only)
        if (!shippingAddress || !isValidUSAddress(shippingAddress)) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Valid US shipping address is required');
        }
        if (shippingAddress.country !== 'US') {
            return (0, types_1.ERROR_RESPONSE)(400, 'Shipping is available for US addresses only');
        }
        if (!paymentMethodId) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Payment method is required');
        }
        // 2. Get cart items
        const cartItems = await (0, dynamodb_1.queryByPK)(`USER#${userId}`, 'CART#ITEM#');
        if (cartItems.length === 0) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Cart is empty');
        }
        // 3. Validate stock for all pre-designed items
        const stockChecks = [];
        for (const item of cartItems) {
            if (item.type === 'pre-designed' && item.productId) {
                const variant = await (0, dynamodb_1.getItem)(`PRODUCT#${item.productId}`, `VARIANT#${item.size}#${item.color}`);
                if (!variant || variant.stockCount < item.quantity) {
                    return (0, types_1.ERROR_RESPONSE)(409, `Insufficient stock for ${item.name} (${item.size}/${item.color})`);
                }
                stockChecks.push({
                    productId: item.productId,
                    size: item.size,
                    color: item.color,
                    currentStock: variant.stockCount,
                    requestedQty: item.quantity,
                });
            }
        }
        // 4. Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        // Read shipping rate from Parameter Store
        let shippingBase = 5.99;
        try {
            const param = await ssm.send(new client_ssm_1.GetParameterCommand({ Name: '/EpicWeave/shipping/flat-rate-base' }));
            shippingBase = parseFloat(param.Parameter?.Value || '5.99');
        }
        catch { /* use default */ }
        // Additional $2 per extra item
        const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const shippingCost = Math.round((shippingBase + Math.max(0, itemCount - 1) * 2) * 100) / 100;
        const taxRate = 0.0; // No sales tax for now (can be configured per state)
        const tax = Math.round(subtotal * taxRate * 100) / 100;
        const total = Math.round((subtotal + shippingCost + tax) * 100) / 100;
        // 5. Process Stripe payment
        const secretResponse = await secrets.send(new client_secrets_manager_1.GetSecretValueCommand({ SecretId: 'epicweave/stripe-api-key' }));
        const stripeKey = secretResponse.SecretString;
        const stripe = new stripe_1.default(stripeKey, { apiVersion: '2023-10-16' });
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100),
            currency: 'usd',
            payment_method: paymentMethodId,
            confirm: true,
            automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
            metadata: {
                type: 'order_payment',
                userId,
                itemCount: String(itemCount),
            },
        });
        if (paymentIntent.status !== 'succeeded') {
            return (0, types_1.ERROR_RESPONSE)(402, 'Payment failed. Please try again.');
        }
        // 6. Create order via DynamoDB TransactWriteItems (atomic operation)
        const orderId = `ORD${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const now = new Date().toISOString();
        const transactItems = [];
        // Order metadata
        transactItems.push({
            Put: {
                TableName: TABLE_NAME,
                Item: {
                    PK: `USER#${userId}`,
                    SK: `ORDER#${orderId}`,
                    orderId,
                    userId,
                    status: 'paid',
                    subtotal,
                    tax,
                    shippingCost,
                    total,
                    shippingAddress,
                    paymentIntentId: paymentIntent.id,
                    itemCount,
                    createdAt: now,
                    updatedAt: now,
                    // GSI2 for admin order queries by status
                    GSI2PK: 'ORDER#STATUS#paid',
                    GSI2SK: `${now}#${orderId}`,
                },
            },
        });
        // Order items
        for (const item of cartItems) {
            transactItems.push({
                Put: {
                    TableName: TABLE_NAME,
                    Item: {
                        PK: `ORDER#${orderId}`,
                        SK: `ITEM#${item.itemId}`,
                        orderId,
                        itemId: item.itemId,
                        productId: item.productId || null,
                        sessionId: item.sessionId || null,
                        type: item.type,
                        name: item.name,
                        size: item.size,
                        color: item.color,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        lineTotal: Math.round(item.unitPrice * item.quantity * 100) / 100,
                        printPlacement: item.printPlacement || null,
                        designImageUrl: item.designImageUrl || null,
                        imageUrl: item.imageUrl || null,
                        createdAt: now,
                    },
                },
            });
        }
        // Payment record
        transactItems.push({
            Put: {
                TableName: TABLE_NAME,
                Item: {
                    PK: `USER#${userId}`,
                    SK: `PAYMENT#${paymentIntent.id}`,
                    paymentId: paymentIntent.id,
                    userId,
                    orderId,
                    type: 'order_payment',
                    amount: total,
                    currency: 'usd',
                    status: 'succeeded',
                    createdAt: now,
                },
            },
        });
        // Stock decrements for pre-designed items
        for (const check of stockChecks) {
            transactItems.push({
                Update: {
                    TableName: TABLE_NAME,
                    Key: {
                        PK: `PRODUCT#${check.productId}`,
                        SK: `VARIANT#${check.size}#${check.color}`,
                    },
                    UpdateExpression: 'SET stockCount = stockCount - :qty, updatedAt = :now',
                    ExpressionAttributeValues: {
                        ':qty': check.requestedQty,
                        ':now': now,
                    },
                    ConditionExpression: 'stockCount >= :qty',
                },
            });
        }
        // Cart clear (delete all cart items)
        for (const item of cartItems) {
            transactItems.push({
                Delete: {
                    TableName: TABLE_NAME,
                    Key: {
                        PK: `USER#${userId}`,
                        SK: `CART#ITEM#${item.itemId}`,
                    },
                },
            });
        }
        // Execute atomic transaction
        await ddb.send(new lib_dynamodb_1.TransactWriteCommand({ TransactItems: transactItems }));
        return (0, types_1.SUCCESS_RESPONSE)({
            orderId,
            status: 'paid',
            subtotal,
            tax,
            shippingCost,
            total,
            itemCount,
            paymentIntentId: paymentIntent.id,
            message: 'Order placed successfully!',
        });
    }
    catch (error) {
        console.error('Error creating order:', error);
        // Handle transaction conflicts (stock changed)
        if (error.name === 'TransactionCanceledException') {
            return (0, types_1.ERROR_RESPONSE)(409, 'Stock changed during checkout. Please review your cart and try again.');
        }
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to create order');
    }
};
exports.handler = handler;
function isValidUSAddress(addr) {
    return !!(addr.street && addr.street.trim().length > 0 &&
        addr.city && addr.city.trim().length > 0 &&
        addr.state && addr.state.trim().length === 2 &&
        addr.zipCode && /^\d{5}(-\d{4})?$/.test(addr.zipCode) &&
        addr.country === 'US');
}
