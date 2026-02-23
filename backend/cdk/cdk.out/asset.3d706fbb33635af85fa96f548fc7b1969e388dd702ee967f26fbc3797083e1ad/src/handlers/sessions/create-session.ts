import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';
import Stripe from 'stripe';

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);
const ssm = new SSMClient({});
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * POST /sessions/create
 * Pay $2 session fee and create AI design session
 * Requires: Cognito authentication
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return ERROR_RESPONSE(401, 'Unauthorized');
    }

    const body = JSON.parse(event.body || '{}');
    const { artStyleChoice, paymentMethodId } = body;

    if (!artStyleChoice || !['modern', 'anime'].includes(artStyleChoice)) {
      return ERROR_RESPONSE(400, 'Invalid art style. Must be "modern" or "anime"');
    }

    // Read session fee from Parameter Store
    const sessionFeeParam = await ssm.send(
      new GetParameterCommand({ Name: '/EpicWeave/pricing/session-fee' })
    );
    const sessionFee = parseFloat(sessionFeeParam.Parameter?.Value || '2.00');

    // Read max iterations and TTL from Parameter Store
    const maxIterParam = await ssm.send(
      new GetParameterCommand({ Name: '/EpicWeave/session/max-iterations' })
    );
    const maxIterations = parseInt(maxIterParam.Parameter?.Value || '5');

    const ttlParam = await ssm.send(
      new GetParameterCommand({ Name: '/EpicWeave/session/ttl-minutes' })
    );
    const ttlMinutes = parseInt(ttlParam.Parameter?.Value || '60');

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(sessionFee * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: {
        type: 'session_fee',
        userId,
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      return ERROR_RESPONSE(402, 'Payment failed');
    }

    // Create session in DynamoDB
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const expiresAt = Math.floor(Date.now() / 1000) + ttlMinutes * 60; // Unix timestamp for TTL

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `SESSION#${sessionId}`,
          sessionId,
          userId,
          status: 'active',
          artStyleChoice,
          iterationCount: 0,
          maxIterations,
          expiresAt, // DynamoDB TTL attribute
          createdAt: now,
          updatedAt: now,
        },
      })
    );

    // Save payment record
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `PAYMENT#${paymentIntent.id}`,
          paymentId: paymentIntent.id,
          userId,
          type: 'session_fee',
          amount: sessionFee,
          currency: 'usd',
          status: 'succeeded',
          createdAt: now,
        },
      })
    );

    return SUCCESS_RESPONSE({
      sessionId,
      artStyleChoice,
      maxIterations,
      expiresAt,
      message: 'Session created successfully',
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return ERROR_RESPONSE(500, 'Failed to create session');
  }
};
