"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../utils/dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const types_1 = require("../../types");
const constants_1 = require("../../utils/constants");
/**
 * GET /products
 * List products with optional filters (mythology, size, color, price, style)
 * Uses GSI1 for mythology filtering (GSI1PK = MYTHOLOGY#<type>)
 * Uses GSI2 for category+price filtering (GSI2PK = CATEGORY#<cat>, GSI2SK = PRICE#<price>)
 */
const handler = async (event) => {
    try {
        const { mythology, category, style, minPrice, maxPrice, limit = "20", } = event.queryStringParameters || {};
        let products = [];
        // Query by mythology using GSI1
        if (mythology) {
            if (!(0, constants_1.isValidMythology)(mythology)) {
                return (0, types_1.ERROR_RESPONSE)(400, 'Invalid mythology type. Must be "hindu" or "greek"');
            }
            products = await (0, dynamodb_1.queryGSI1)(`MYTHOLOGY#${mythology}`, "PRODUCT#");
        }
        // Query by category+price using GSI2
        else if (category) {
            const gsi2pk = `CATEGORY#${category}`;
            products = await (0, dynamodb_1.queryGSI2)(gsi2pk);
            // Filter by price range if specified
            if (minPrice || maxPrice) {
                const min = minPrice ? parseFloat(minPrice) : 0;
                const max = maxPrice ? parseFloat(maxPrice) : Infinity;
                products = products.filter((p) => p.basePrice >= min && p.basePrice <= max);
            }
        }
        // No filters - scan all products (with limit)
        else {
            const result = await dynamodb_1.ddb.send(new lib_dynamodb_1.ScanCommand({
                TableName: dynamodb_1.TABLE_NAME,
                FilterExpression: "begins_with(SK, :metadata)",
                ExpressionAttributeValues: { ":metadata": "METADATA" },
                Limit: parseInt(limit),
            }));
            products = result.Items || [];
        }
        // Filter by art style if specified
        if (style) {
            if (!(0, constants_1.isValidArtStyle)(style)) {
                return (0, types_1.ERROR_RESPONSE)(400, 'Invalid art style. Must be "modern" or "anime"');
            }
            products = products.filter((p) => p.artStyle === style);
        }
        // Transform to response format
        const formattedProducts = products.map((p) => ({
            productId: p.productId,
            name: p.name,
            description: p.description,
            mythology: p.mythology,
            artStyle: p.artStyle,
            basePrice: p.basePrice,
            imageUrl: p.imageUrl,
            category: p.category,
            tags: p.tags || [],
            createdAt: p.createdAt,
        }));
        return (0, types_1.SUCCESS_RESPONSE)({
            products: formattedProducts,
            count: formattedProducts.length,
            filters: { mythology, category, style, minPrice, maxPrice },
        });
    }
    catch (error) {
        console.error("Error listing products:", error);
        return (0, types_1.ERROR_RESPONSE)(500, "Failed to list products");
    }
};
exports.handler = handler;
