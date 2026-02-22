import { APIGatewayProxyHandler } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getItem, queryByPK } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

const ses = new SESClient({});
const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@epicweave.com';

/**
 * POST /orders/{orderId}/confirm
 * Send order confirmation email via SES
 * Called internally after order creation
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

    // Get order
    const order = await getItem(`USER#${userId}`, `ORDER#${orderId}`);
    if (!order) {
      return ERROR_RESPONSE(404, 'Order not found');
    }

    // Get order items
    const orderItems = await queryByPK(`ORDER#${orderId}`, 'ITEM#');

    // Get user email from Cognito claims
    const userEmail = event.requestContext.authorizer?.jwt?.claims?.email;
    if (!userEmail) {
      return ERROR_RESPONSE(400, 'User email not available');
    }

    // Build email
    const itemsList = orderItems.map((item: any) =>
      `• ${item.name} (${item.size}/${item.color}) x${item.quantity} — $${item.lineTotal.toFixed(2)}`
    ).join('\n');

    const emailBody = `
Thank you for your order from EpicWeave!

Order #${orderId}
Date: ${new Date(order.createdAt).toLocaleDateString()}

Items:
${itemsList}

Subtotal: $${order.subtotal.toFixed(2)}
Shipping: $${order.shippingCost.toFixed(2)}
Tax: $${order.tax.toFixed(2)}
─────────────────
Total: $${order.total.toFixed(2)}

Shipping Address:
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}

Status: ${order.status.toUpperCase()}

We'll send you an update when your order ships!

Thank you for shopping with EpicWeave 🎨
    `.trim();

    const htmlBody = `
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Thank you for your order!</h1>
  <p style="color: #666;">Order <strong>#${orderId}</strong></p>
  <p style="color: #666;">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
  
  <hr style="border: 1px solid #eee; margin: 20px 0;" />
  
  <h3>Order Items</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background: #f5f5f5;">
        <th style="padding: 8px; text-align: left;">Item</th>
        <th style="padding: 8px; text-align: center;">Qty</th>
        <th style="padding: 8px; text-align: right;">Price</th>
      </tr>
    </thead>
    <tbody>
      ${orderItems.map((item: any) => `
      <tr>
        <td style="padding: 8px;">${item.name}<br/><small style="color: #888;">${item.size} / ${item.color}</small></td>
        <td style="padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; text-align: right;">$${item.lineTotal.toFixed(2)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  
  <hr style="border: 1px solid #eee; margin: 20px 0;" />
  
  <table style="width: 100%;">
    <tr><td>Subtotal</td><td style="text-align: right;">$${order.subtotal.toFixed(2)}</td></tr>
    <tr><td>Shipping</td><td style="text-align: right;">$${order.shippingCost.toFixed(2)}</td></tr>
    <tr><td>Tax</td><td style="text-align: right;">$${order.tax.toFixed(2)}</td></tr>
    <tr style="font-weight: bold; font-size: 18px;">
      <td style="padding-top: 10px;">Total</td>
      <td style="padding-top: 10px; text-align: right;">$${order.total.toFixed(2)}</td>
    </tr>
  </table>
  
  <hr style="border: 1px solid #eee; margin: 20px 0;" />
  
  <h3>Shipping Address</h3>
  <p>
    ${order.shippingAddress.street}<br/>
    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
  </p>
  
  <p style="background: #e8f5e9; padding: 12px; border-radius: 4px; color: #2e7d32;">
    Status: <strong>${order.status.toUpperCase()}</strong>
  </p>
  
  <p style="color: #888; font-size: 14px; margin-top: 30px;">
    We'll send you an update when your order ships!<br/>
    Thank you for shopping with EpicWeave.
  </p>
</body>
</html>`.trim();

    // Send via SES
    await ses.send(
      new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [userEmail] },
        Message: {
          Subject: { Data: `EpicWeave Order Confirmation #${orderId}` },
          Body: {
            Text: { Data: emailBody },
            Html: { Data: htmlBody },
          },
        },
      })
    );

    return SUCCESS_RESPONSE({
      message: 'Confirmation email sent',
      orderId,
      email: userEmail,
    });
  } catch (error) {
    console.error('Error sending confirmation:', error);
    return ERROR_RESPONSE(500, 'Failed to send confirmation email');
  }
};
