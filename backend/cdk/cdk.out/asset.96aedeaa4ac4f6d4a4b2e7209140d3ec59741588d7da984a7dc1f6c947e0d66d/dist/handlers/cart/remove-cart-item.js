"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
/**
 * DELETE /cart/items/{itemId}
 * Remove item from cart
 * Requires: Cognito authentication
 */
const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
        if (!userId) {
            return (0, types_1.ERROR_RESPONSE)(401, 'Unauthorized');
        }
        const itemId = event.pathParameters?.itemId;
        if (!itemId) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Item ID is required');
        }
        const sk = `CART#ITEM#${itemId}`;
        const item = await (0, dynamodb_1.getItem)(`USER#${userId}`, sk);
        if (!item) {
            return (0, types_1.ERROR_RESPONSE)(404, 'Cart item not found');
        }
        await (0, dynamodb_1.deleteItem)(`USER#${userId}`, sk);
        return (0, types_1.SUCCESS_RESPONSE)({ message: 'Item removed from cart', itemId });
    }
    catch (error) {
        console.error('Error removing cart item:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to remove cart item');
    }
};
exports.handler = handler;
