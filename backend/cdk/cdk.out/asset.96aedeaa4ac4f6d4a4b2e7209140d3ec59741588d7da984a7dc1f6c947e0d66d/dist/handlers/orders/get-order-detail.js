"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
/**
 * GET /orders/{orderId}
 * Get order details with items
 * Requires: Cognito authentication
 */
const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
        if (!userId) {
            return (0, types_1.ERROR_RESPONSE)(401, 'Unauthorized');
        }
        const orderId = event.pathParameters?.orderId;
        if (!orderId) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Order ID is required');
        }
        const order = await (0, dynamodb_1.getItem)(`USER#${userId}`, `ORDER#${orderId}`);
        if (!order) {
            return (0, types_1.ERROR_RESPONSE)(404, 'Order not found');
        }
        const orderItems = await (0, dynamodb_1.queryByPK)(`ORDER#${orderId}`, 'ITEM#');
        const items = orderItems.map((item) => ({
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
        return (0, types_1.SUCCESS_RESPONSE)({
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
    }
    catch (error) {
        console.error('Error getting order detail:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to get order details');
    }
};
exports.handler = handler;
