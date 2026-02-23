"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_ses_1 = require("@aws-sdk/client-ses");
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
const ses = new client_ses_1.SESClient({});
const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@epicweave.com';
// Valid status transitions
const VALID_TRANSITIONS = {
    paid: ['processing', 'refunded'],
    processing: ['shipped', 'refunded'],
    shipped: ['delivered'],
    delivered: [],
    refunded: [],
};
/**
 * PATCH /admin/orders/{orderId}
 * Update order status with validation for allowed transitions
 * Requires: Admin role
 */
const handler = async (event) => {
    try {
        const userRole = event.requestContext.authorizer?.jwt?.claims?.['custom:role'];
        if (userRole !== 'admin') {
            return (0, types_1.ERROR_RESPONSE)(403, 'Admin access required');
        }
        const orderId = event.pathParameters?.orderId;
        if (!orderId) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Order ID is required');
        }
        const body = JSON.parse(event.body || '{}');
        const { status, trackingNumber } = body;
        if (!status) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Status is required');
        }
        // Find the order - we need to search since we don't know the userId
        // In production, pass userId or use a different access pattern
        const { userId } = body;
        if (!userId) {
            return (0, types_1.ERROR_RESPONSE)(400, 'User ID is required');
        }
        const order = await (0, dynamodb_1.getItem)(`USER#${userId}`, `ORDER#${orderId}`);
        if (!order) {
            return (0, types_1.ERROR_RESPONSE)(404, 'Order not found');
        }
        // Validate status transition
        const allowedTransitions = VALID_TRANSITIONS[order.status] || [];
        if (!allowedTransitions.includes(status)) {
            return (0, types_1.ERROR_RESPONSE)(400, `Invalid status transition from ${order.status} to ${status}. Allowed: ${allowedTransitions.join(', ') || 'none'}`);
        }
        const now = new Date().toISOString();
        const updates = {
            status,
            updatedAt: now,
            GSI2PK: `ORDER#STATUS#${status}`,
            GSI2SK: `${order.createdAt}#${orderId}`,
        };
        // Add tracking number if shipping
        if (status === 'shipped' && trackingNumber) {
            updates.trackingNumber = trackingNumber;
            updates.shippedAt = now;
        }
        if (status === 'delivered') {
            updates.deliveredAt = now;
        }
        await (0, dynamodb_1.updateItem)(`USER#${userId}`, `ORDER#${orderId}`, updates);
        // Send shipping notification email
        if (status === 'shipped') {
            try {
                const userEmail = body.userEmail;
                if (userEmail) {
                    await ses.send(new client_ses_1.SendEmailCommand({
                        Source: FROM_EMAIL,
                        Destination: { ToAddresses: [userEmail] },
                        Message: {
                            Subject: { Data: `Your EpicWeave order #${orderId} has shipped!` },
                            Body: {
                                Text: {
                                    Data: `Your order #${orderId} has been shipped!\n\nTracking Number: ${trackingNumber || 'Not available'}\n\nThank you for shopping with EpicWeave!`,
                                },
                            },
                        },
                    }));
                }
            }
            catch (emailError) {
                console.warn('Failed to send shipping notification email:', emailError);
            }
        }
        return (0, types_1.SUCCESS_RESPONSE)({
            orderId,
            previousStatus: order.status,
            newStatus: status,
            trackingNumber: updates.trackingNumber || order.trackingNumber || null,
            updatedAt: now,
            message: `Order status updated to ${status}`,
        });
    }
    catch (error) {
        console.error('Error updating order status:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to update order status');
    }
};
exports.handler = handler;
