import { APIGatewayProxyHandler } from 'aws-lambda';
import { getItem, queryByPK } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

/**
 * GET /sessions/{sessionId}/status
 * Poll for session status and latest generation result
 * Requires: Cognito authentication
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return ERROR_RESPONSE(401, 'Unauthorized');
    }

    const sessionId = event.pathParameters?.sessionId;
    if (!sessionId) {
      return ERROR_RESPONSE(400, 'Session ID is required');
    }

    // Get session
    const session = await getItem(`USER#${userId}`, `SESSION#${sessionId}`);
    if (!session) {
      return ERROR_RESPONSE(404, 'Session not found');
    }

    if (session.userId !== userId) {
      return ERROR_RESPONSE(403, 'Access denied');
    }

    // Check session expiry
    const nowUnix = Math.floor(Date.now() / 1000);
    if (session.expiresAt && session.expiresAt < nowUnix && session.status === 'active') {
      session.status = 'expired';
    }

    // Get all messages for the session
    const messages = await queryByPK(`SESSION#${sessionId}`, 'MSG#');

    const formattedMessages = messages.map((msg: any) => ({
      messageId: msg.messageId,
      role: msg.role,
      content: msg.content || null,
      imageUrl: msg.imageUrl || null,
      mythology: msg.mythology || null,
      iterationNumber: msg.iterationNumber || null,
      status: msg.status || null,
      createdAt: msg.createdAt,
    }));

    return SUCCESS_RESPONSE({
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
  } catch (error) {
    console.error('Error getting session status:', error);
    return ERROR_RESPONSE(500, 'Failed to get session status');
  }
};
