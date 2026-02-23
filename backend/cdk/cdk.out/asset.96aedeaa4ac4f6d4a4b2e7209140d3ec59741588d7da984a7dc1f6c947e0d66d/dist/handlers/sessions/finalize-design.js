"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_ssm_1 = require("@aws-sdk/client-ssm");
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
const constants_1 = require("../../utils/constants");
const ssm = new client_ssm_1.SSMClient({});
/**
 * POST /sessions/{sessionId}/finalize
 * Calculate price based on selections and Parameter Store config, prepare for cart
 * Requires: Cognito authentication
 */
const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
        if (!userId) {
            return (0, types_1.ERROR_RESPONSE)(401, 'Unauthorized');
        }
        const sessionId = event.pathParameters?.sessionId;
        if (!sessionId) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Session ID is required');
        }
        const body = JSON.parse(event.body || '{}');
        const { color, size, printPlacement } = body;
        // Validate inputs
        if (!color || !(0, constants_1.isValidColor)(color)) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Invalid color. Must be one of the 30 standard colors.');
        }
        if (!size || !(0, constants_1.isValidSize)(size)) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Invalid size. Must be S, M, L, XL, or XXL.');
        }
        if (!printPlacement || !constants_1.PRINT_PLACEMENTS.includes(printPlacement)) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Invalid print placement. Must be "front", "back", or "both".');
        }
        // Get session
        const session = await (0, dynamodb_1.getItem)(`USER#${userId}`, `SESSION#${sessionId}`);
        if (!session) {
            return (0, types_1.ERROR_RESPONSE)(404, 'Session not found');
        }
        if (session.userId !== userId) {
            return (0, types_1.ERROR_RESPONSE)(403, 'Access denied');
        }
        if (session.status !== 'active') {
            return (0, types_1.ERROR_RESPONSE)(409, `Session is ${session.status}. Cannot finalize.`);
        }
        if (!session.latestImageUrl) {
            return (0, types_1.ERROR_RESPONSE)(400, 'No design generated yet. Generate a design first.');
        }
        // Read pricing config from Parameter Store
        const [baseParam, surchargeParam] = await Promise.all([
            ssm.send(new client_ssm_1.GetParameterCommand({ Name: '/EpicWeave/pricing/custom-tshirt-base' })),
            ssm.send(new client_ssm_1.GetParameterCommand({ Name: '/EpicWeave/pricing/both-placement-surcharge' })),
        ]);
        const basePrice = parseFloat(baseParam.Parameter?.Value || '20.00');
        const bothSurcharge = parseFloat(surchargeParam.Parameter?.Value || '8.00');
        // Calculate price
        // Size multiplier: S=1.0, M=1.0, L=1.0, XL=1.05, XXL=1.10
        const sizeMultipliers = {
            'S': 1.0, 'M': 1.0, 'L': 1.0, 'XL': 1.05, 'XXL': 1.10,
        };
        const sizeMultiplier = sizeMultipliers[size] || 1.0;
        // Placement surcharge
        const placementSurcharge = printPlacement === 'both' ? bothSurcharge : 0;
        // Final price calculation
        const subtotal = basePrice * sizeMultiplier;
        const totalPrice = Math.round((subtotal + placementSurcharge) * 100) / 100;
        const priceBreakdown = {
            basePrice,
            sizeMultiplier,
            sizeAdjustedPrice: Math.round(subtotal * 100) / 100,
            printPlacement,
            placementSurcharge,
            totalPrice,
        };
        // Update session with finalized selections
        const now = new Date().toISOString();
        await (0, dynamodb_1.updateItem)(`USER#${userId}`, `SESSION#${sessionId}`, {
            finalizedColor: color,
            finalizedSize: size,
            finalizedPrintPlacement: printPlacement,
            finalizedPrice: totalPrice,
            finalizedPriceBreakdown: JSON.stringify(priceBreakdown),
            finalizedAt: now,
            updatedAt: now,
        });
        return (0, types_1.SUCCESS_RESPONSE)({
            sessionId,
            designImageUrl: session.latestImageUrl,
            color,
            size,
            printPlacement,
            priceBreakdown,
            message: 'Design finalized. You can now add it to your cart.',
        });
    }
    catch (error) {
        console.error('Error finalizing design:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to finalize design');
    }
};
exports.handler = handler;
