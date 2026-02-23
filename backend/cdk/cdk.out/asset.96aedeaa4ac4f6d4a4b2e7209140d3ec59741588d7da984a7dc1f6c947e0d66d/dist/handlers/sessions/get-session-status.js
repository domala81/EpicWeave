"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
/**
 * GET /sessions/{sessionId}/status
 * Poll for session status and latest generation result
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
        // Get session
        const session = await (0, dynamodb_1.getItem)(`USER#${userId}`, `SESSION#${sessionId}`);
        if (!session) {
            return (0, types_1.ERROR_RESPONSE)(404, 'Session not found');
        }
        if (session.userId !== userId) {
            return (0, types_1.ERROR_RESPONSE)(403, 'Access denied');
        }
        // Check session expiry
        const nowUnix = Math.floor(Date.now() / 1000);
        if (session.expiresAt && session.expiresAt < nowUnix && session.status === 'active') {
            session.status = 'expired';
        }
        // Get all messages for the session
        const messages = await (0, dynamodb_1.queryByPK)(`SESSION#${sessionId}`, 'MSG#');
        const formattedMessages = messages.map((msg) => ({
            messageId: msg.messageId,
            role: msg.role,
            content: msg.content || null,
            imageUrl: msg.imageUrl || null,
            mythology: msg.mythology || null,
            iterationNumber: msg.iterationNumber || null,
            status: msg.status || null,
            createdAt: msg.createdAt,
        }));
        return (0, types_1.SUCCESS_RESPONSE)({
            sessionId,
            status: session.status,
            artStyleChoice: session.artStyleChoice,
            iterationCount: session.iterationCount,
            maxIterations: session.maxIterations,
            latestImageUrl: session.latestImageUrl || null,
            latestJobId: session.latestJobId || null,
            latestJobStatus: session.latestJobStatus || null,
            latestJobError: session.latestJobError || null,
            expiresAt: session.expiresAt,
            messages: formattedMessages,
        });
    }
    catch (error) {
        console.error('Error getting session status:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to get session status');
    }
};
exports.handler = handler;
