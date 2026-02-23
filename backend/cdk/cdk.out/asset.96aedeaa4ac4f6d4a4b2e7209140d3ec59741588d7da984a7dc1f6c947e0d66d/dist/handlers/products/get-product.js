"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../utils/dynamodb");
const types_1 = require("../../types");
/**
 * GET /products/{productId}
 * Get product details with all variants (sizes, colors, stock)
 */
const handler = async (event) => {
    try {
        const productId = event.pathParameters?.productId;
        if (!productId) {
            return (0, types_1.ERROR_RESPONSE)(400, 'Product ID is required');
        }
        // Query DynamoDB: PK = PRODUCT#<id>, get metadata + all variants
        const items = await (0, dynamodb_1.queryByPK)(`PRODUCT#${productId}`);
        if (items.length === 0) {
            return (0, types_1.ERROR_RESPONSE)(404, 'Product not found');
        }
        // First item should be the metadata (SK = METADATA)
        const metadata = items.find(item => item.SK === 'METADATA');
        if (!metadata) {
            return (0, types_1.ERROR_RESPONSE)(404, 'Product metadata not found');
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
        return (0, types_1.SUCCESS_RESPONSE)({ product });
    }
    catch (error) {
        console.error('Error getting product:', error);
        return (0, types_1.ERROR_RESPONSE)(500, 'Failed to get product');
    }
};
exports.handler = handler;
