import { APIGatewayProxyHandler } from 'aws-lambda';
import { getItem, putItem, updateItem, queryByPK } from '../../utils/dynamodb';
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from '../../types';
import { isValidColor, isValidSize } from '../../utils/constants';

/**
 * POST /cart/items
 * Add item to cart (pre-designed or custom)
 * Requires: Cognito authentication
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return ERROR_RESPONSE(401, 'Unauthorized');
    }

    const body = JSON.parse(event.body || '{}');
    const { productId, sessionId, type, size, color, quantity = 1, printPlacement, designImageUrl, unitPrice } = body;

    // Validate required fields
    if (!type || !['pre-designed', 'custom'].includes(type)) {
      return ERROR_RESPONSE(400, 'Type must be "pre-designed" or "custom"');
    }
    if (!size || !isValidSize(size)) {
      return ERROR_RESPONSE(400, 'Invalid size');
    }
    if (!color || !isValidColor(color)) {
      return ERROR_RESPONSE(400, 'Invalid color');
    }

    const now = new Date().toISOString();

    if (type === 'pre-designed') {
      if (!productId) {
        return ERROR_RESPONSE(400, 'Product ID is required for pre-designed items');
      }

      // Check product exists and variant is in stock
      const variant = await getItem(`PRODUCT#${productId}`, `VARIANT#${size}#${color}`);
      if (!variant) {
        return ERROR_RESPONSE(404, 'Product variant not found');
      }
      if (variant.stockCount <= 0) {
        return ERROR_RESPONSE(409, 'This product variant is out of stock');
      }

      // Check if same item already in cart - increment quantity
      const existingItems = await queryByPK(`USER#${userId}`, 'CART#ITEM#');
      const existing = existingItems.find(
        (i: any) => i.productId === productId && i.size === size && i.color === color
      );

      if (existing) {
        await updateItem(`USER#${userId}`, existing.SK, {
          quantity: existing.quantity + quantity,
          updatedAt: now,
        });
        return SUCCESS_RESPONSE({
          message: 'Cart item quantity updated',
          itemId: existing.itemId,
          quantity: existing.quantity + quantity,
        });
      }

      // Get product metadata for name/price
      const product = await getItem(`PRODUCT#${productId}`, 'METADATA');
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await putItem({
        PK: `USER#${userId}`,
        SK: `CART#ITEM#${itemId}`,
        itemId,
        userId,
        productId,
        type: 'pre-designed',
        name: product?.name || 'Unknown Product',
        size,
        color,
        quantity,
        unitPrice: product?.basePrice || 0,
        imageUrl: product?.imageUrl || '',
        createdAt: now,
        updatedAt: now,
      });

      return SUCCESS_RESPONSE({ message: 'Item added to cart', itemId });
    }

    // Custom design
    if (type === 'custom') {
      if (!sessionId) {
        return ERROR_RESPONSE(400, 'Session ID is required for custom items');
      }
      if (!unitPrice || typeof unitPrice !== 'number') {
        return ERROR_RESPONSE(400, 'Unit price is required for custom items');
      }

      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await putItem({
        PK: `USER#${userId}`,
        SK: `CART#ITEM#${itemId}`,
        itemId,
        userId,
        sessionId,
        type: 'custom',
        name: 'Custom Design T-Shirt',
        size,
        color,
        quantity: 1,
        unitPrice,
        printPlacement: printPlacement || 'front',
        designImageUrl: designImageUrl || '',
        createdAt: now,
        updatedAt: now,
      });

      // Update session status to completed
      await updateItem(`USER#${userId}`, `SESSION#${sessionId}`, {
        status: 'completed',
        updatedAt: now,
      });

      return SUCCESS_RESPONSE({ message: 'Custom design added to cart', itemId });
    }

    return ERROR_RESPONSE(400, 'Invalid request');
  } catch (error) {
    console.error('Error adding to cart:', error);
    return ERROR_RESPONSE(500, 'Failed to add item to cart');
  }
};
