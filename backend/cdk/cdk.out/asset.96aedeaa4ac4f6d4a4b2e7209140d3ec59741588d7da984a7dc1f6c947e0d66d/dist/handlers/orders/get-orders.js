"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
/**
 * GET /orders
 * Get order history for the authenticated user
 * Requires: Cognito authentication
 */
const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
        if (!userId) {
            return (0, types_1.ERROR_RESPONSE)(401, 'Unauthorized');
        }
        const items = await (0, dynamodb_1.queryByPK)(`USER#${userId}`, 'ORDER#');
        const orders = items.map((item) => ({
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
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return (0, types_1.SUCCESS_RESPONSE)({ orders, count: orders.length });
    }
    catch (error) {
        console.error('Error getting orders:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to get orders');
    }
};
exports.handler = handler;
