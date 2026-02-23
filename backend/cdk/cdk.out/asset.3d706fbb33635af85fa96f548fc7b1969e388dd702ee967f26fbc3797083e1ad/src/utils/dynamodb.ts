import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.TABLE_NAME || 'EpicWeaveTable-dev';

/**
 * Query items by partition key with optional sort key condition
 */
export async function queryByPK(pk: string, skPrefix?: string) {
  const params: any = {
    TableName: TABLE_NAME,
    KeyConditionExpression: skPrefix ? 'PK = :pk AND begins_with(SK, :sk)' : 'PK = :pk',
    ExpressionAttributeValues: skPrefix
      ? { ':pk': pk, ':sk': skPrefix }
      : { ':pk': pk },
  };

  const result = await ddb.send(new QueryCommand(params));
  return result.Items || [];
}

/**
 * Query items using GSI1
 */
export async function queryGSI1(gsi1pk: string, gsi1skPrefix?: string) {
  const params: any = {
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: gsi1skPrefix
      ? 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)'
      : 'GSI1PK = :pk',
    ExpressionAttributeValues: gsi1skPrefix
      ? { ':pk': gsi1pk, ':sk': gsi1skPrefix }
      : { ':pk': gsi1pk },
  };

  const result = await ddb.send(new QueryCommand(params));
  return result.Items || [];
}

/**
 * Query items using GSI2
 */
export async function queryGSI2(gsi2pk: string, gsi2skPrefix?: string) {
  const params: any = {
    TableName: TABLE_NAME,
    IndexName: 'GSI2',
    KeyConditionExpression: gsi2skPrefix
      ? 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)'
      : 'GSI2PK = :pk',
    ExpressionAttributeValues: gsi2skPrefix
      ? { ':pk': gsi2pk, ':sk': gsi2skPrefix }
      : { ':pk': gsi2pk },
  };

  const result = await ddb.send(new QueryCommand(params));
  return result.Items || [];
}

/**
 * Get single item by PK and SK
 */
export async function getItem(pk: string, sk: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    })
  );
  return result.Item;
}

/**
 * Put item into DynamoDB
 */
export async function putItem(item: Record<string, any>) {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
  return item;
}

/**
 * Update item with attribute updates
 */
export async function updateItem(
  pk: string,
  sk: string,
  updates: Record<string, any>
) {
  const updateExpression = Object.keys(updates)
    .map((key) => `#${key} = :${key}`)
    .join(', ');

  const expressionAttributeNames = Object.keys(updates).reduce(
    (acc, key) => ({ ...acc, [`#${key}`]: key }),
    {}
  );

  const expressionAttributeValues = Object.keys(updates).reduce(
    (acc, key) => ({ ...acc, [`:${key}`]: updates[key] }),
    {}
  );

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

/**
 * Delete item from DynamoDB
 */
export async function deleteItem(pk: string, sk: string) {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    })
  );
}

/**
 * Batch write items (max 25 per batch)
 */
export async function batchPutItems(items: Record<string, any>[]) {
  if (items.length === 0) return;

  const batches = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      })
    );
  }
}
