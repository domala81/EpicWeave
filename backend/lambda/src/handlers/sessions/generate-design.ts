import { APIGatewayProxyHandler } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { getItem, updateItem, putItem } from '../../utils/dynamodb';
import { validateAndEnhancePrompt } from '../../utils/content-rules';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

const sqs = new SQSClient({});
const ssm = new SSMClient({});

const AI_QUEUE_URL = process.env.AI_QUEUE_URL!;

/**
 * POST /sessions/{sessionId}/generate
 * Validate prompt, enforce content rules, enqueue to SQS for DALL-E generation
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

    const body = JSON.parse(event.body || '{}');
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return ERROR_RESPONSE(400, 'Prompt is required');
    }

    if (prompt.length > 1000) {
      return ERROR_RESPONSE(400, 'Prompt must be under 1000 characters');
    }

    // 1. Get session from DynamoDB
    const session = await getItem(`USER#${userId}`, `SESSION#${sessionId}`);

    if (!session) {
      return ERROR_RESPONSE(404, 'Session not found');
    }

    if (session.userId !== userId) {
      return ERROR_RESPONSE(403, 'Access denied');
    }

    // 2. Check session expiry
    const nowUnix = Math.floor(Date.now() / 1000);
    if (session.expiresAt && session.expiresAt < nowUnix) {
      await updateItem(`USER#${userId}`, `SESSION#${sessionId}`, {
        status: 'expired',
        updatedAt: new Date().toISOString(),
      });
      return ERROR_RESPONSE(410, 'Session expired');
    }

    if (session.status !== 'active') {
      return ERROR_RESPONSE(409, `Session is ${session.status}. Cannot generate new designs.`);
    }

    // 3. Check iteration count
    if (session.iterationCount >= session.maxIterations) {
      return ERROR_RESPONSE(429, `Maximum design iterations reached (${session.maxIterations}/${session.maxIterations})`);
    }

    // 4. Validate and enhance prompt via content rules
    const validation = await validateAndEnhancePrompt(prompt, session.artStyleChoice);

    if (!validation.valid) {
      return ERROR_RESPONSE(422, validation.reason!);
    }

    // 5. Save user message to DynamoDB
    const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await putItem({
      PK: `SESSION#${sessionId}`,
      SK: `MSG#${now}#${messageId}`,
      sessionId,
      messageId,
      role: 'user',
      content: prompt,
      mythology: validation.detectedMythology,
      createdAt: now,
    });

    // 6. Read image resolution from Parameter Store
    let imageResolution = '1024x1024';
    try {
      const resParam = await ssm.send(
        new GetParameterCommand({ Name: '/EpicWeave/ai/image-resolution' })
      );
      if (resParam.Parameter?.Value) {
        imageResolution = resParam.Parameter.Value;
      }
    } catch {
      console.warn('Could not read image resolution, using default 1024x1024');
    }

    // 7. Enqueue to SQS for DALL-E generation
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: AI_QUEUE_URL,
        MessageBody: JSON.stringify({
          jobId,
          sessionId,
          userId,
          prompt: prompt.trim(),
          enhancedPrompt: validation.enhancedPrompt,
          artStyle: session.artStyleChoice,
          mythology: validation.detectedMythology,
          imageResolution,
          iterationNumber: session.iterationCount + 1,
        }),
        MessageGroupId: sessionId,
      })
    );

    // 8. Increment iteration count
    await updateItem(`USER#${userId}`, `SESSION#${sessionId}`, {
      iterationCount: session.iterationCount + 1,
      updatedAt: now,
    });

    return SUCCESS_RESPONSE({
      jobId,
      messageId,
      iterationCount: session.iterationCount + 1,
      maxIterations: session.maxIterations,
      message: 'Design generation started. Poll /sessions/{sessionId}/status for results.',
    });
  } catch (error) {
    console.error('Error generating design:', error);
    return ERROR_RESPONSE(500, 'Failed to start design generation');
  }
};
