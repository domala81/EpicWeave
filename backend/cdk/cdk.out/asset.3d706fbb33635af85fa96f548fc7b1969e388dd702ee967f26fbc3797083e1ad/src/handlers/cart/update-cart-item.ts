import { APIGatewayProxyHandler } from 'aws-lambda';
import { getItem, updateItem, deleteItem } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

/**
 * PATCH /cart/items/{itemId}
 * Update cart item quantity
 * Requires: Cognito authentication
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return ERROR_RESPONSE(401, 'Unauthorized');
    }

    const itemId = event.pathParameters?.itemId;
    if (!itemId) {
      return ERROR_RESPONSE(400, 'Item ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const { quantity } = body;

    if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
      return ERROR_RESPONSE(400, 'Quantity must be a non-negative number');
    }

    const sk = `CART#ITEM#${itemId}`;
    const item = await getItem(`USER#${userId}`, sk);

    if (!item) {
      return ERROR_RESPONSE(404, 'Cart item not found');
    }

    // Custom items can only have quantity of 1
    if (item.type === 'custom' && quantity > 1) {
      return ERROR_RESPONSE(400, 'Custom design items can only have quantity of 1');
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      await deleteItem(`USER#${userId}`, sk);
      return SUCCESS_RESPONSE({ message: 'Item removed from cart', itemId });
    }

    // Check stock for pre-designed items
    if (item.type === 'pre-designed' && item.productId) {
      const variant = await getItem(`PRODUCT#${item.productId}`, `VARIANT#${item.size}#${item.color}`);
      if (variant && quantity > variant.stockCount) {
        return ERROR_RESPONSE(409, `Only ${variant.stockCount} units available`);
      }
    }

    await updateItem(`USER#${userId}`, sk, {
      quantity,
      updatedAt: new Date().toISOString(),
    });

    return SUCCESS_RESPONSE({
      message: 'Cart item updated',
      itemId,
      quantity,
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return ERROR_RESPONSE(500, 'Failed to update cart item');
  }
};
