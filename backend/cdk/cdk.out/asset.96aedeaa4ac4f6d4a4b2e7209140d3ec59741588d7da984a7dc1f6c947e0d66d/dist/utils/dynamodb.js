"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLE_NAME = exports.ddb = void 0;
exports.queryByPK = queryByPK;
exports.queryGSI1 = queryGSI1;
exports.queryGSI2 = queryGSI2;
exports.getItem = getItem;
exports.putItem = putItem;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
exports.batchPutItems = batchPutItems;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({});
exports.ddb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
exports.TABLE_NAME = process.env.TABLE_NAME || 'EpicWeaveTable-dev';
/**
 * Query items by partition key with optional sort key condition
 */
async function queryByPK(pk, skPrefix) {
    const params = {
        TableName: exports.TABLE_NAME,
        KeyConditionExpression: skPrefix ? 'PK = :pk AND begins_with(SK, :sk)' : 'PK = :pk',
        ExpressionAttributeValues: skPrefix
            ? { ':pk': pk, ':sk': skPrefix }
            : { ':pk': pk },
    };
    const result = await exports.ddb.send(new lib_dynamodb_1.QueryCommand(params));
    return result.Items || [];
}
/**
 * Query items using GSI1
 */
async function queryGSI1(gsi1pk, gsi1skPrefix) {
    const params = {
        TableName: exports.TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: gsi1skPrefix
            ? 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)'
            : 'GSI1PK = :pk',
        ExpressionAttributeValues: gsi1skPrefix
            ? { ':pk': gsi1pk, ':sk': gsi1skPrefix }
            : { ':pk': gsi1pk },
    };
    const result = await exports.ddb.send(new lib_dynamodb_1.QueryCommand(params));
    return result.Items || [];
}
/**
 * Query items using GSI2
 */
async function queryGSI2(gsi2pk, gsi2skPrefix) {
    const params = {
        TableName: exports.TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: gsi2skPrefix
            ? 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)'
            : 'GSI2PK = :pk',
        ExpressionAttributeValues: gsi2skPrefix
            ? { ':pk': gsi2pk, ':sk': gsi2skPrefix }
            : { ':pk': gsi2pk },
    };
    const result = await exports.ddb.send(new lib_dynamodb_1.QueryCommand(params));
    return result.Items || [];
}
/**
 * Get single item by PK and SK
 */
async function getItem(pk, sk) {
    const result = await exports.ddb.send(new lib_dynamodb_1.GetCommand({
        TableName: exports.TABLE_NAME,
        Key: { PK: pk, SK: sk },
    }));
    return result.Item;
}
/**
 * Put item into DynamoDB
 */
async function putItem(item) {
    await exports.ddb.send(new lib_dynamodb_1.PutCommand({
        TableName: exports.TABLE_NAME,
        Item: item,
    }));
    return item;
}
/**
 * Update item with attribute updates
 */
async function updateItem(pk, sk, updates) {
    const updateExpression = Object.keys(updates)
        .map((key) => `#${key} = :${key}`)
        .join(', ');
    const expressionAttributeNames = Object.keys(updates).reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});
    const expressionAttributeValues = Object.keys(updates).reduce((acc, key) => ({ ...acc, [`:${key}`]: updates[key] }), {});
    await exports.ddb.send(new lib_dynamodb_1.UpdateCommand({
        TableName: exports.TABLE_NAME,
        Key: { PK: pk, SK: sk },
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    }));
}
/**
 * Delete item from DynamoDB
 */
async function deleteItem(pk, sk) {
    await exports.ddb.send(new lib_dynamodb_1.DeleteCommand({
        TableName: exports.TABLE_NAME,
        Key: { PK: pk, SK: sk },
    }));
}
/**
 * Batch write items (max 25 per batch)
 */
async function batchPutItems(items) {
    if (items.length === 0)
        return;
    const batches = [];
    for (let i = 0; i < items.length; i += 25) {
        batches.push(items.slice(i, i + 25));
    }
    for (const batch of batches) {
        await exports.ddb.send(new lib_dynamodb_1.BatchWriteCommand({
            RequestItems: {
                [exports.TABLE_NAME]: batch.map((item) => ({
                    PutRequest: { Item: item },
                })),
            },
        }));
    }
}
