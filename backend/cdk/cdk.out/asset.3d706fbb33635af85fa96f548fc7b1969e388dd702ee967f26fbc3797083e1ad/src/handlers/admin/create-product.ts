import { APIGatewayProxyHandler } from 'aws-lambda';
import { putItem, batchPutItems } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';
import { isValidMythology, isValidArtStyle, STANDARD_COLORS, SIZES } from '../../utils/constants';

/**
 * POST /admin/products
 * Create a new product with variants
 * Requires: Admin role
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Check admin role from Cognito claims
    const userRole = event.requestContext.authorizer?.jwt?.claims?.['custom:role'];
    if (userRole !== 'admin') {
      return ERROR_RESPONSE(403, 'Admin access required');
    }

    const body = JSON.parse(event.body || '{}');
    const {
      name,
      description,
      mythology,
      artStyle,
      basePrice,
      imageUrl,
      category,
      tags = [],
      variants = [], // Array of { size, color, stockCount, sku }
    } = body;

    // Validation
    if (!name || !mythology || !artStyle || !basePrice) {
      return ERROR_RESPONSE(400, 'Missing required fields: name, mythology, artStyle, basePrice');
    }

    if (!isValidMythology(mythology)) {
      return ERROR_RESPONSE(400, 'Invalid mythology. Must be "hindu" or "greek"');
    }

    if (!isValidArtStyle(artStyle)) {
      return ERROR_RESPONSE(400, 'Invalid art style. Must be "modern" or "anime"');
    }

    if (typeof basePrice !== 'number' || basePrice <= 0) {
      return ERROR_RESPONSE(400, 'Base price must be a positive number');
    }

    const productId = `PROD${Date.now()}`;
    const now = new Date().toISOString();

    // Create product metadata
    const metadata = {
      PK: `PRODUCT#${productId}`,
      SK: 'METADATA',
      productId,
      name,
      description: description || '',
      mythology,
      artStyle,
      basePrice,
      imageUrl: imageUrl || '',
      category: category || 'tshirts',
      tags,
      createdAt: now,
      updatedAt: now,
      // GSI1 for mythology filtering
      GSI1PK: `MYTHOLOGY#${mythology}`,
      GSI1SK: `PRODUCT#${productId}`,
      // GSI2 for category+price filtering
      GSI2PK: `CATEGORY#${category || 'tshirts'}`,
      GSI2SK: `PRICE#${String(basePrice).padStart(10, '0')}#${productId}`,
    };

    await putItem(metadata);

    // Create variants if provided
    if (variants.length > 0) {
      const variantItems = variants.map((variant: any) => ({
        PK: `PRODUCT#${productId}`,
        SK: `VARIANT#${variant.size}#${variant.color}`,
        productId,
        size: variant.size,
        color: variant.color,
        stockCount: variant.stockCount || 0,
        sku: variant.sku || `${productId}-${variant.size}-${variant.color}`,
        createdAt: now,
        updatedAt: now,
      }));

      await batchPutItems(variantItems);
    }

    return SUCCESS_RESPONSE({
      message: 'Product created successfully',
      productId,
      variantsCreated: variants.length,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return ERROR_RESPONSE(500, 'Failed to create product');
  }
};
