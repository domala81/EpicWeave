"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_ssm_1 = require("@aws-sdk/client-ssm");
const types_1 = require("../../types");
const stripe_1 = __importDefault(require("stripe"));
const ddbClient = new client_dynamodb_1.DynamoDBClient({});
const ddb = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
const ssm = new client_ssm_1.SSMClient({});
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const TABLE_NAME = process.env.TABLE_NAME;
/**
 * POST /sessions/create
 * Pay $2 session fee and create AI design session
 * Requires: Cognito authentication
 */
const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
        if (!userId) {
            return (0, types_1.ERROR_RESPONSE)(401, 'Unauthorized');
        }
        const body = JSON.parse(event.body || '{}');
        const { artStyleChoice, paymentMethodId, skipPayment } = body;
        if (!artStyleChoice || !['modern', 'anime'].includes(artStyleChoice)) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Invalid art style. Must be "modern" or "anime"');
        }
        // Feature flag: allow bypassing payment for testing
        const feeBypassEnabled = process.env.SKIP_SESSION_FEE === 'true';
        const shouldSkipPayment = feeBypassEnabled && skipPayment === true;
        // Read max iterations and TTL from Parameter Store
        const maxIterParam = await ssm.send(new client_ssm_1.GetParameterCommand({ Name: '/EpicWeave/session/max-iterations' }));
        const maxIterations = parseInt(maxIterParam.Parameter?.Value || '5');
        const ttlParam = await ssm.send(new client_ssm_1.GetParameterCommand({ Name: '/EpicWeave/session/ttl-minutes' }));
        const ttlMinutes = parseInt(ttlParam.Parameter?.Value || '60');
        let paymentIntentId = 'skipped_test';
        if (!shouldSkipPayment) {
            // Read session fee from Parameter Store
            const sessionFeeParam = await ssm.send(new client_ssm_1.GetParameterCommand({ Name: '/EpicWeave/pricing/session-fee' }));
            const sessionFee = parseFloat(sessionFeeParam.Parameter?.Value || '2.00');
            // Create Stripe PaymentIntent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(sessionFee * 100),
                currency: 'usd',
                payment_method: paymentMethodId,
                confirm: true,
                automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
                metadata: { type: 'session_fee', userId },
            });
            if (paymentIntent.status !== 'succeeded') {
                return (0, types_1.ERROR_RESPONSE)(402, 'Payment failed');
            }
            paymentIntentId = paymentIntent.id;
        }
        // Create session in DynamoDB
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const expiresAt = Math.floor(Date.now() / 1000) + ttlMinutes * 60; // Unix timestamp for TTL
        await ddb.send(new lib_dynamodb_1.PutCommand({
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
        }));
        // Save payment record (skip if payment was bypassed)
        if (!shouldSkipPayment) {
            await ddb.send(new lib_dynamodb_1.PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `USER#${userId}`,
                    SK: `PAYMENT#${paymentIntentId}`,
                    paymentId: paymentIntentId,
                    userId,
                    type: 'session_fee',
                    currency: 'usd',
                    status: 'succeeded',
                    createdAt: now,
                },
            }));
        }
        return (0, types_1.SUCCESS_RESPONSE)({
            sessionId,
            artStyleChoice,
            maxIterations,
            expiresAt,
            message: 'Session created successfully',
        });
    }
    catch (error) {
        console.error('Error creating session:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to create session');
    }
};
exports.handler = handler;
