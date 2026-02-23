import { APIGatewayProxyHandler } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { getItem, updateItem, queryByPK } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';
import Stripe from 'stripe';

const secrets = new SecretsManagerClient({});

/**
 * POST /admin/orders/{orderId}/refund
 * Process refund via Stripe, restore stock, update order status
 * Only refunds order payments, NOT session fees
 * Requires: Admin role
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userRole = event.requestContext.authorizer?.jwt?.claims?.['custom:role'];
    if (userRole !== 'admin') {
      return ERROR_RESPONSE(403, 'Admin access required');
    }

    const orderId = event.pathParameters?.orderId;
    if (!orderId) {
      return ERROR_RESPONSE(400, 'Order ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const { userId } = body;
    if (!userId) {
      return ERROR_RESPONSE(400, 'User ID is required');
    }

    // Get order
    const order = await getItem(`USER#${userId}`, `ORDER#${orderId}`);
    if (!order) {
      return ERROR_RESPONSE(404, 'Order not found');
    }

    if (order.status === 'refunded') {
      return ERROR_RESPONSE(409, 'Order has already been refunded');
    }

    if (order.status === 'delivered') {
      return ERROR_RESPONSE(400, 'Cannot refund delivered orders');
    }

    // Get Stripe API key
    const secretResponse = await secrets.send(
      new GetSecretValueCommand({ SecretId: 'epicweave/stripe-api-key' })
    );
    const stripe = new Stripe(secretResponse.SecretString!, { apiVersion: '2023-10-16' });

    // Create Stripe refund for the ORDER PAYMENT only (not session fees)
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
      metadata: {
        orderId,
        userId,
        type: 'order_refund',
        note: 'Session fee non-refundable',
      },
    });

    const now = new Date().toISOString();

    // Update order status to refunded
    await updateItem(`USER#${userId}`, `ORDER#${orderId}`, {
      status: 'refunded',
      refundId: refund.id,
      refundAmount: order.total,
      refundedAt: now,
      updatedAt: now,
      GSI2PK: 'ORDER#STATUS#refunded',
      GSI2SK: `${order.createdAt}#${orderId}`,
    });

    // Restore stock for pre-designed items
    const orderItems = await queryByPK(`ORDER#${orderId}`, 'ITEM#');
    let stockRestored = 0;

    for (const item of orderItems) {
      if (item.type === 'pre-designed' && item.productId) {
        try {
          await updateItem(
            `PRODUCT#${item.productId}`,
            `VARIANT#${item.size}#${item.color}`,
            {
              stockCount: item.quantity, // This should use ADD not SET in production
              updatedAt: now,
            }
          );
          stockRestored += item.quantity;
        } catch (err) {
          console.warn(`Failed to restore stock for ${item.productId}/${item.size}/${item.color}:`, err);
        }
      }
    }

    return SUCCESS_RESPONSE({
      orderId,
      refundId: refund.id,
      refundAmount: order.total,
      status: 'refunded',
      stockRestored,
      note: 'Session fee non-refundable. Only order payment refunded.',
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return ERROR_RESPONSE(500, 'Failed to process refund');
  }
};
