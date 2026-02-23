import { APIGatewayProxyHandler } from 'aws-lambda';
import { queryByPK } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

/**
 * GET /cart
 * Get all cart items for the authenticated user
 * Requires: Cognito authentication
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return ERROR_RESPONSE(401, 'Unauthorized');
    }

    const items = await queryByPK(`USER#${userId}`, 'CART#ITEM#');

    const cartItems = items.map((item: any) => ({
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

    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity, 0
    );

    return SUCCESS_RESPONSE({
      items: cartItems,
      itemCount: cartItems.length,
      subtotal: Math.round(subtotal * 100) / 100,
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    return ERROR_RESPONSE(500, 'Failed to get cart');
  }
};
