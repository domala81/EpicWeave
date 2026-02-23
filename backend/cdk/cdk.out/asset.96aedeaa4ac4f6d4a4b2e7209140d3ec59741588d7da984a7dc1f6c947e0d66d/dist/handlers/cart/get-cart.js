"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
/**
 * GET /cart
 * Get all cart items for the authenticated user
 * Requires: Cognito authentication
 */
const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
        if (!userId) {
            return (0, types_1.ERROR_RESPONSE)(401, 'Unauthorized');
        }
        const items = await (0, dynamodb_1.queryByPK)(`USER#${userId}`, 'CART#ITEM#');
        const cartItems = items.map((item) => ({
            itemId: item.itemId,
            productId: item.productId || null,
            sessionId: item.sessionId || null,
            type: item.type,
            name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            printPlacement: item.printPlacement || null,
            designImageUrl: item.designImageUrl || null,
            imageUrl: item.imageUrl || null,
        }));
        const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        return (0, types_1.SUCCESS_RESPONSE)({
            items: cartItems,
            itemCount: cartItems.length,
            subtotal: Math.round(subtotal * 100) / 100,
        });
    }
    catch (error) {
        console.error('Error getting cart:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to get cart');
    }
};
exports.handler = handler;
