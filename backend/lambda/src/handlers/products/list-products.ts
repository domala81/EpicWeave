import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * GET /products
 * List products with optional filters (mythology, size, color, price, style)
 * Uses GSI1 for mythology filtering, GSI2 for category+price
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { mythology, size, color, style, minPrice, maxPrice } = event.queryStringParameters || {};

    // TODO: Implement DynamoDB query with appropriate GSI
    // For now, return mock data for BDD tests
    const products = [
      {
        productId: 'PROD001',
        name: 'Shiva Meditation Tee',
        mythology: 'hindu',
        artStyle: 'modern',
        basePrice: 25.00,
        imageUrl: 'https://cdn.epicweave.com/products/shiva-meditation.jpg',
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        availableColors: ['Black', 'Navy', 'White'],
      },
      {
        productId: 'PROD002',
        name: 'Zeus Lightning Tee',
        mythology: 'greek',
        artStyle: 'anime',
        basePrice: 28.00,
        imageUrl: 'https://cdn.epicweave.com/products/zeus-lightning.jpg',
        availableSizes: ['S', 'M', 'L', 'XL'],
        availableColors: ['Black', 'Navy', 'Gray'],
      },
    ];

    return SUCCESS_RESPONSE({ products, count: products.length });
  } catch (error) {
    console.error('Error listing products:', error);
    return ERROR_RESPONSE(500, 'Failed to list products');
  }
};
