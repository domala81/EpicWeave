import { APIGatewayProxyHandler } from 'aws-lambda';
import { getItem, queryByPK } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

/**
 * GET /orders/{orderId}
 * Get order details with items
 * Requires: Cognito authentication
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return ERROR_RESPONSE(401, 'Unauthorized');
    }

    const orderId = event.pathParameters?.orderId;
    if (!orderId) {
      return ERROR_RESPONSE(400, 'Order ID is required');
    }

    const order = await getItem(`USER#${userId}`, `ORDER#${orderId}`);
    if (!order) {
      return ERROR_RESPONSE(404, 'Order not found');
    }

    const orderItems = await queryByPK(`ORDER#${orderId}`, 'ITEM#');

    const items = orderItems.map((item: any) => ({
      itemId: item.itemId,
      productId: item.productId,
      sessionId: item.sessionId,
      type: item.type,
      name: item.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      printPlacement: item.printPlacement,
      designImageUrl: item.designImageUrl,
      imageUrl: item.imageUrl,
    }));

    return SUCCESS_RESPONSE({
      order: {
        orderId: order.orderId,
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        shippingCost: order.shippingCost,
        total: order.total,
        itemCount: order.itemCount,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber || null,
        paymentIntentId: order.paymentIntentId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items,
      },
    });
  } catch (error) {
    console.error('Error getting order detail:', error);
    return ERROR_RESPONSE(500, 'Failed to get order details');
  }
};
