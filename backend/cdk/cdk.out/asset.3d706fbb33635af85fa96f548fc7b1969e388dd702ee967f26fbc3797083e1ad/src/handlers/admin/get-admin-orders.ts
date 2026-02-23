import { APIGatewayProxyHandler } from 'aws-lambda';
import { queryGSI2 } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

const VALID_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'refunded'];

/**
 * GET /admin/orders?status=
 * Get all orders, optionally filtered by status using GSI2
 * Requires: Admin role
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userRole = event.requestContext.authorizer?.jwt?.claims?.['custom:role'];
    if (userRole !== 'admin') {
      return ERROR_RESPONSE(403, 'Admin access required');
    }

    const { status } = event.queryStringParameters || {};

    let orders: any[] = [];

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return ERROR_RESPONSE(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      orders = await queryGSI2(`ORDER#STATUS#${status}`);
    } else {
      // Query all statuses
      for (const s of VALID_STATUSES) {
        const statusOrders = await queryGSI2(`ORDER#STATUS#${s}`);
        orders.push(...statusOrders);
      }
    }

    const formattedOrders = orders.map((o: any) => ({
      orderId: o.orderId,
      userId: o.userId,
      status: o.status,
      total: o.total,
      itemCount: o.itemCount,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      trackingNumber: o.trackingNumber || null,
    }));

    // Sort by date descending
    formattedOrders.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return SUCCESS_RESPONSE({
      orders: formattedOrders,
      count: formattedOrders.length,
      filter: status || 'all',
    });
  } catch (error) {
    console.error('Error getting admin orders:', error);
    return ERROR_RESPONSE(500, 'Failed to get orders');
  }
};
