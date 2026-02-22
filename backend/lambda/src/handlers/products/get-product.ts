import { APIGatewayProxyHandler } from 'aws-lambda';
import { queryByPK } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';

/**
 * GET /products/{productId}
 * Get product details with all variants (sizes, colors, stock)
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const productId = event.pathParameters?.productId;
    
    if (!productId) {
      return ERROR_RESPONSE(400, 'Product ID is required');
    }

    // Query DynamoDB: PK = PRODUCT#<id>, get metadata + all variants
    const items = await queryByPK(`PRODUCT#${productId}`);

    if (items.length === 0) {
      return ERROR_RESPONSE(404, 'Product not found');
    }

    // First item should be the metadata (SK = METADATA)
    const metadata = items.find(item => item.SK === 'METADATA');
    if (!metadata) {
      return ERROR_RESPONSE(404, 'Product metadata not found');
    }

    // Remaining items are variants (SK = VARIANT#<size>#<color>)
    const variants = items.filter(item => item.SK.startsWith('VARIANT#')).map(v => ({
      size: v.size,
      color: v.color,
      stockCount: v.stockCount,
      sku: v.sku,
    }));

    const product = {
      productId: metadata.productId,
      name: metadata.name,
      description: metadata.description,
      mythology: metadata.mythology,
      artStyle: metadata.artStyle,
      basePrice: metadata.basePrice,
      imageUrl: metadata.imageUrl,
      category: metadata.category,
      tags: metadata.tags || [],
      variants,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    };

    return SUCCESS_RESPONSE({ product });
  } catch (error) {
    console.error('Error getting product:', error);
    return ERROR_RESPONSE(500, 'Failed to get product');
  }
};
