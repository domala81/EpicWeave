"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
/**
 * PATCH /cart/items/{itemId}
 * Update cart item quantity
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
        const body = JSON.parse(event.body || '{}');
        const { quantity } = body;
        if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Quantity must be a non-negative number');
        }
        const sk = `CART#ITEM#${itemId}`;
        const item = await (0, dynamodb_1.getItem)(`USER#${userId}`, sk);
        if (!item) {
            return (0, types_1.ERROR_RESPONSE)(404, 'Cart item not found');
        }
        // Custom items can only have quantity of 1
        if (item.type === 'custom' && quantity > 1) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Custom design items can only have quantity of 1');
        }
        // If quantity is 0, remove the item
        if (quantity === 0) {
            await (0, dynamodb_1.deleteItem)(`USER#${userId}`, sk);
            return (0, types_1.SUCCESS_RESPONSE)({ message: 'Item removed from cart', itemId });
        }
        // Check stock for pre-designed items
        if (item.type === 'pre-designed' && item.productId) {
            const variant = await (0, dynamodb_1.getItem)(`PRODUCT#${item.productId}`, `VARIANT#${item.size}#${item.color}`);
            if (variant && quantity > variant.stockCount) {
                return (0, types_1.ERROR_RESPONSE)(409, `Only ${variant.stockCount} units available`);
            }
        }
        await (0, dynamodb_1.updateItem)(`USER#${userId}`, sk, {
            quantity,
            updatedAt: new Date().toISOString(),
        });
        return (0, types_1.SUCCESS_RESPONSE)({
            message: 'Cart item updated',
            itemId,
            quantity,
        });
    }
    catch (error) {
        console.error('Error updating cart item:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to update cart item');
    }
};
exports.handler = handler;
