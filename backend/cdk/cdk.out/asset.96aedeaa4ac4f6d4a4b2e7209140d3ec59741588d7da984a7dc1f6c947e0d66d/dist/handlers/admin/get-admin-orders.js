"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
const VALID_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'refunded'];
/**
 * GET /admin/orders?status=
 * Get all orders, optionally filtered by status using GSI2
 * Requires: Admin role
 */
const handler = async (event) => {
    try {
        const userRole = event.requestContext.authorizer?.jwt?.claims?.['custom:role'];
        if (userRole !== 'admin') {
            return (0, types_1.ERROR_RESPONSE)(403, 'Admin access required');
        }
        const { status } = event.queryStringParameters || {};
        let orders = [];
        if (status) {
            if (!VALID_STATUSES.includes(status)) {
                return (0, types_1.ERROR_RESPONSE)(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
            }
            orders = await (0, dynamodb_1.queryGSI2)(`ORDER#STATUS#${status}`);
        }
        else {
            // Query all statuses
            for (const s of VALID_STATUSES) {
                const statusOrders = await (0, dynamodb_1.queryGSI2)(`ORDER#STATUS#${s}`);
                orders.push(...statusOrders);
            }
        }
        const formattedOrders = orders.map((o) => ({
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
        formattedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return (0, types_1.SUCCESS_RESPONSE)({
            orders: formattedOrders,
            count: formattedOrders.length,
            filter: status || 'all',
        });
    }
    catch (error) {
        console.error('Error getting admin orders:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to get orders');
    }
};
exports.handler = handler;
