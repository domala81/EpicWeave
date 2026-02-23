import { APIGatewayProxyHandler } from 'aws-lambda';
import { queryByPK } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

/**
 * GET /orders
 * Get order history for the authenticated user
 * Requires: Cognito authentication
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return ERROR_RESPONSE(401, 'Unauthorized');
    }

    const items = await queryByPK(`USER#${userId}`, 'ORDER#');

    const orders = items.map((item: any) => ({
      orderId: item.orderId,
      status: item.status,
      subtotal: item.subtotal,
      tax: item.tax,
      shippingCost: item.shippingCost,
      total: item.total,
      itemCount: item.itemCount,
      trackingNumber: item.trackingNumber || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    // Sort by date descending
    orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return SUCCESS_RESPONSE({ orders, count: orders.length });
  } catch (error) {
    console.error('Error getting orders:', error);
    return ERROR_RESPONSE(500, 'Failed to get orders');
  }
};
