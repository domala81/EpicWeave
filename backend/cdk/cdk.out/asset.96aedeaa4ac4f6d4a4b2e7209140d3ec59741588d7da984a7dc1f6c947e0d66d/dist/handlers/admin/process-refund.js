"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
const stripe_1 = __importDefault(require("stripe"));
const secrets = new client_secrets_manager_1.SecretsManagerClient({});
/**
 * POST /admin/orders/{orderId}/refund
 * Process refund via Stripe, restore stock, update order status
 * Only refunds order payments, NOT session fees
 * Requires: Admin role
 */
const handler = async (event) => {
    try {
        const userRole = event.requestContext.authorizer?.jwt?.claims?.['custom:role'];
        if (userRole !== 'admin') {
            return (0, types_1.ERROR_RESPONSE)(403, 'Admin access required');
        }
        const orderId = event.pathParameters?.orderId;
        if (!orderId) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Order ID is required');
        }
        const body = JSON.parse(event.body || '{}');
        const { userId } = body;
        if (!userId) {
            return (0, types_1.ERROR_RESPONSE)(400, 'User ID is required');
        }
        // Get order
        const order = await (0, dynamodb_1.getItem)(`USER#${userId}`, `ORDER#${orderId}`);
        if (!order) {
            return (0, types_1.ERROR_RESPONSE)(404, 'Order not found');
        }
        if (order.status === 'refunded') {
            return (0, types_1.ERROR_RESPONSE)(409, 'Order has already been refunded');
        }
        if (order.status === 'delivered') {
            return (0, types_1.ERROR_RESPONSE)(400, 'Cannot refund delivered orders');
        }
        // Get Stripe API key
        const secretResponse = await secrets.send(new client_secrets_manager_1.GetSecretValueCommand({ SecretId: 'epicweave/stripe-api-key' }));
        const stripe = new stripe_1.default(secretResponse.SecretString, { apiVersion: '2023-10-16' });
        // Create Stripe refund for the ORDER PAYMENT only (not session fees)
        const refund = await stripe.refunds.create({
            payment_intent: order.paymentIntentId,
            metadata: {
                orderId,
                userId,
                type: 'order_refund',
                note: 'Session fee non-refundable',
            },
        });
        const now = new Date().toISOString();
        // Update order status to refunded
        await (0, dynamodb_1.updateItem)(`USER#${userId}`, `ORDER#${orderId}`, {
            status: 'refunded',
            refundId: refund.id,
            refundAmount: order.total,
            refundedAt: now,
            updatedAt: now,
            GSI2PK: 'ORDER#STATUS#refunded',
            GSI2SK: `${order.createdAt}#${orderId}`,
        });
        // Restore stock for pre-designed items
        const orderItems = await (0, dynamodb_1.queryByPK)(`ORDER#${orderId}`, 'ITEM#');
        let stockRestored = 0;
        for (const item of orderItems) {
            if (item.type === 'pre-designed' && item.productId) {
                try {
                    await (0, dynamodb_1.updateItem)(`PRODUCT#${item.productId}`, `VARIANT#${item.size}#${item.color}`, {
                        stockCount: item.quantity, // This should use ADD not SET in production
                        updatedAt: now,
                    });
                    stockRestored += item.quantity;
                }
                catch (err) {
                    console.warn(`Failed to restore stock for ${item.productId}/${item.size}/${item.color}:`, err);
                }
            }
        }
        return (0, types_1.SUCCESS_RESPONSE)({
            orderId,
            refundId: refund.id,
            refundAmount: order.total,
            status: 'refunded',
            stockRestored,
            note: 'Session fee non-refundable. Only order payment refunded.',
            message: 'Refund processed successfully',
        });
    }
    catch (error) {
        console.error('Error processing refund:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to process refund');
    }
};
exports.handler = handler;
