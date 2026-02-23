"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
const constants_1 = require("../../utils/constants");
/**
 * POST /cart/items
 * Add item to cart (pre-designed or custom)
 * Requires: Cognito authentication
 */
const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
        if (!userId) {
            return (0, types_1.ERROR_RESPONSE)(401, 'Unauthorized');
        }
        const body = JSON.parse(event.body || '{}');
        const { productId, sessionId, type, size, color, quantity = 1, printPlacement, designImageUrl, unitPrice } = body;
        // Validate required fields
        if (!type || !['pre-designed', 'custom'].includes(type)) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Type must be "pre-designed" or "custom"');
        }
        if (!size || !(0, constants_1.isValidSize)(size)) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Invalid size');
        }
        if (!color || !(0, constants_1.isValidColor)(color)) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Invalid color');
        }
        const now = new Date().toISOString();
        if (type === 'pre-designed') {
            if (!productId) {
                return (0, types_1.ERROR_RESPONSE)(400, 'Product ID is required for pre-designed items');
            }
            // Check product exists and variant is in stock
            const variant = await (0, dynamodb_1.getItem)(`PRODUCT#${productId}`, `VARIANT#${size}#${color}`);
            if (!variant) {
                return (0, types_1.ERROR_RESPONSE)(404, 'Product variant not found');
            }
            if (variant.stockCount <= 0) {
                return (0, types_1.ERROR_RESPONSE)(409, 'This product variant is out of stock');
            }
            // Check if same item already in cart - increment quantity
            const existingItems = await (0, dynamodb_1.queryByPK)(`USER#${userId}`, 'CART#ITEM#');
            const existing = existingItems.find((i) => i.productId === productId && i.size === size && i.color === color);
            if (existing) {
                await (0, dynamodb_1.updateItem)(`USER#${userId}`, existing.SK, {
                    quantity: existing.quantity + quantity,
                    updatedAt: now,
                });
                return (0, types_1.SUCCESS_RESPONSE)({
                    message: 'Cart item quantity updated',
                    itemId: existing.itemId,
                    quantity: existing.quantity + quantity,
                });
            }
            // Get product metadata for name/price
            const product = await (0, dynamodb_1.getItem)(`PRODUCT#${productId}`, 'METADATA');
            const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await (0, dynamodb_1.putItem)({
                PK: `USER#${userId}`,
                SK: `CART#ITEM#${itemId}`,
                itemId,
                userId,
                productId,
                type: 'pre-designed',
                name: product?.name || 'Unknown Product',
                size,
                color,
                quantity,
                unitPrice: product?.basePrice || 0,
                imageUrl: product?.imageUrl || '',
                createdAt: now,
                updatedAt: now,
            });
            return (0, types_1.SUCCESS_RESPONSE)({ message: 'Item added to cart', itemId });
        }
        // Custom design
        if (type === 'custom') {
            if (!sessionId) {
                return (0, types_1.ERROR_RESPONSE)(400, 'Session ID is required for custom items');
            }
            if (!unitPrice || typeof unitPrice !== 'number') {
                return (0, types_1.ERROR_RESPONSE)(400, 'Unit price is required for custom items');
            }
            const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await (0, dynamodb_1.putItem)({
                PK: `USER#${userId}`,
                SK: `CART#ITEM#${itemId}`,
                itemId,
                userId,
                sessionId,
                type: 'custom',
                name: 'Custom Design T-Shirt',
                size,
                color,
                quantity: 1,
                unitPrice,
                printPlacement: printPlacement || 'front',
                designImageUrl: designImageUrl || '',
                createdAt: now,
                updatedAt: now,
            });
            // Update session status to completed
            await (0, dynamodb_1.updateItem)(`USER#${userId}`, `SESSION#${sessionId}`, {
                status: 'completed',
                updatedAt: now,
            });
            return (0, types_1.SUCCESS_RESPONSE)({ message: 'Custom design added to cart', itemId });
        }
        return (0, types_1.ERROR_RESPONSE)(400, 'Invalid request');
    }
    catch (error) {
        console.error('Error adding to cart:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to add item to cart');
    }
};
exports.handler = handler;
