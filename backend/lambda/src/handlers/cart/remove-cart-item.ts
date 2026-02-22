import { APIGatewayProxyHandler } from 'aws-lambda';
import { getItem, deleteItem } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

/**
 * DELETE /cart/items/{itemId}
 * Remove item from cart
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

    const sk = `CART#ITEM#${itemId}`;
    const item = await getItem(`USER#${userId}`, sk);

    if (!item) {
      return ERROR_RESPONSE(404, 'Cart item not found');
    }

    await deleteItem(`USER#${userId}`, sk);

    return SUCCESS_RESPONSE({ message: 'Item removed from cart', itemId });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return ERROR_RESPONSE(500, 'Failed to remove cart item');
  }
};
