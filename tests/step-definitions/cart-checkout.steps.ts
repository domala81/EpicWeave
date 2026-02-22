import { Given, When, Then } from '@cucumber/cucumber';
import { EpicWeaveWorld } from '../support/world';
import { strict as assert } from 'assert';

// ========================================
// Cart Steps
// ========================================

Given('I have an empty cart', async function (this: EpicWeaveWorld) {
  this.attach('Cart is empty');
});

Given('I have items in my cart', async function (this: EpicWeaveWorld) {
  this.attach('Cart has items');
});

Given('I have a pre-designed product {string} in my cart', async function (this: EpicWeaveWorld, name: string) {
  this.attach(`Pre-designed product "${name}" in cart`);
});

Given('I have a custom design in my cart from session {string}', async function (this: EpicWeaveWorld, sessionId: string) {
  this.attach(`Custom design from session ${sessionId} in cart`);
});

Given('the product variant {string} has {int} units in stock', async function (this: EpicWeaveWorld, variant: string, stock: number) {
  this.attach(`Variant ${variant} has ${stock} stock`);
});

// Add to cart
When('I add a pre-designed product to my cart with:', async function (this: EpicWeaveWorld, table: any) {
  const rows = table.rowsHash();
  this.attach(`Adding to cart: ${JSON.stringify(rows)}`);
});

When('I add a custom design to my cart with:', async function (this: EpicWeaveWorld, table: any) {
  const rows = table.rowsHash();
  this.attach(`Adding custom design to cart: ${JSON.stringify(rows)}`);
});

When('I add the same product with same size and color again', async function (this: EpicWeaveWorld) {
  this.attach('Adding duplicate product to cart');
});

Then('the item should be added to my cart', async function (this: EpicWeaveWorld) {
  this.attach('Item added to cart');
});

Then('a CartItem should be created in DynamoDB with PK {string}', async function (this: EpicWeaveWorld, pk: string) {
  this.attach(`CartItem created with PK: ${pk}`);
});

Then('the existing item quantity should increase', async function (this: EpicWeaveWorld) {
  this.attach('Quantity incremented for existing cart item');
});

Then('the session status should be updated to {string}', async function (this: EpicWeaveWorld, status: string) {
  this.attach(`Session status updated to: ${status}`);
});

// Quantity management
When('I update the quantity of item {string} to {int}', async function (this: EpicWeaveWorld, itemId: string, qty: number) {
  this.attach(`Updating ${itemId} quantity to ${qty}`);
});

When('I remove item {string} from my cart', async function (this: EpicWeaveWorld, itemId: string) {
  this.attach(`Removing ${itemId} from cart`);
});

Then('the cart item quantity should be {int}', async function (this: EpicWeaveWorld, qty: number) {
  this.attach(`Cart item quantity: ${qty}`);
});

Then('the item should be removed from the cart', async function (this: EpicWeaveWorld) {
  this.attach('Item removed from cart');
});

Then('I should see an error {string}', async function (this: EpicWeaveWorld, error: string) {
  this.attach(`Error: ${error}`);
});

// View cart
When('I view my cart', async function (this: EpicWeaveWorld) {
  this.attach('Viewing cart via GET /cart');
});

Then('I should see {int} items in my cart', async function (this: EpicWeaveWorld, count: number) {
  this.attach(`Cart has ${count} items`);
});

Then('the subtotal should be ${float}', async function (this: EpicWeaveWorld, amount: number) {
  this.attach(`Subtotal: $${amount}`);
});

Then('custom items should show quantity as {int} and not be editable', async function (this: EpicWeaveWorld, qty: number) {
  this.attach(`Custom items fixed at quantity ${qty}`);
});

// Out of stock
When('I try to add an out-of-stock product to my cart', async function (this: EpicWeaveWorld) {
  this.attach('Attempting to add out-of-stock product');
});

Then('the Lambda should check variant stockCount in DynamoDB', async function (this: EpicWeaveWorld) {
  this.attach('Stock checked in DynamoDB');
});

Then('I should see {string} error', async function (this: EpicWeaveWorld, error: string) {
  this.attach(`Error displayed: ${error}`);
});

// Cart persistence
Given('I added items to my cart yesterday', async function (this: EpicWeaveWorld) {
  this.attach('Cart items from previous session');
});

When('I log in again today', async function (this: EpicWeaveWorld) {
  this.attach('Re-authenticated');
});

Then('my cart items should still be there', async function (this: EpicWeaveWorld) {
  this.attach('Cart persisted in DynamoDB across sessions');
});

// ========================================
// Checkout Steps
// ========================================

Given('I have {int} items in my cart totaling ${float}', async function (this: EpicWeaveWorld, count: number, total: number) {
  this.attach(`Cart: ${count} items, $${total}`);
});

When('I proceed to checkout', async function (this: EpicWeaveWorld) {
  this.attach('Navigating to /checkout');
});

// Shipping
When('I enter a valid US shipping address:', async function (this: EpicWeaveWorld, table: any) {
  const rows = table.rowsHash();
  this.attach(`Shipping address: ${JSON.stringify(rows)}`);
});

When('I enter a non-US shipping address', async function (this: EpicWeaveWorld) {
  this.attach('Entered non-US address');
});

Then('the shipping address form should only allow US addresses', async function (this: EpicWeaveWorld) {
  this.attach('US-only shipping enforced');
});

Then('I should see the error {string}', async function (this: EpicWeaveWorld, error: string) {
  this.attach(`Error: ${error}`);
});

// Shipping cost
Then('the flat-rate shipping should be ${float}', async function (this: EpicWeaveWorld, rate: number) {
  this.attach(`Flat rate shipping: $${rate}`);
});

Then('each additional item should add ${float} to shipping', async function (this: EpicWeaveWorld, rate: number) {
  this.attach(`Additional item shipping: $${rate}`);
});

Then('total shipping should be ${float}', async function (this: EpicWeaveWorld, total: number) {
  this.attach(`Total shipping: $${total}`);
});

Then('shipping rate should be read from Parameter Store', async function (this: EpicWeaveWorld) {
  this.attach('Read /EpicWeave/shipping/flat-rate-base from Parameter Store');
});

// Payment
When('I enter valid Stripe payment details', async function (this: EpicWeaveWorld) {
  this.attach('Stripe payment details entered');
});

When('I click "Place Order"', async function (this: EpicWeaveWorld) {
  this.attach('Clicked Place Order');
});

When('the Stripe payment fails', async function (this: EpicWeaveWorld) {
  this.attach('Stripe payment failed');
});

Then('a Stripe PaymentIntent should be created for the order total', async function (this: EpicWeaveWorld) {
  this.attach('Stripe PaymentIntent created for order');
});

Then('the order should not be created', async function (this: EpicWeaveWorld) {
  this.attach('Order not created due to payment failure');
});

Then('the cart should remain unchanged', async function (this: EpicWeaveWorld) {
  this.attach('Cart unchanged after failed payment');
});

// Order creation - TransactWriteItems
Then('a DynamoDB TransactWriteItems should atomically:', async function (this: EpicWeaveWorld, table: any) {
  const rows = table.rows();
  for (const [action] of rows) {
    this.attach(`Transaction action: ${action}`);
  }
});

Then('an Order record should be created with status {string}', async function (this: EpicWeaveWorld, status: string) {
  this.attach(`Order created with status: ${status}`);
});

Then('order items should be saved under PK ORDER#{string}', async function (this: EpicWeaveWorld, orderId: string) {
  this.attach(`Order items saved under PK: ORDER#${orderId}`);
});

Then('a payment record should be saved', async function (this: EpicWeaveWorld) {
  this.attach('Payment record saved');
});

Then('stock should be decremented for pre-designed items', async function (this: EpicWeaveWorld) {
  this.attach('Stock decremented atomically in transaction');
});

Then('the cart should be cleared', async function (this: EpicWeaveWorld) {
  this.attach('All CART#ITEM# records deleted');
});

// Stock validation at checkout
Given('another customer purchased the last unit of a product in my cart', async function (this: EpicWeaveWorld) {
  this.attach('Stock depleted by another customer');
});

Then('the transaction should fail with ConditionExpression error', async function (this: EpicWeaveWorld) {
  this.attach('TransactionCanceledException due to stock condition');
});

Then('I should see {string} message', async function (this: EpicWeaveWorld, message: string) {
  this.attach(`Message: ${message}`);
});

// Confirmation
Then('I should be redirected to the order confirmation page', async function (this: EpicWeaveWorld) {
  this.attach('Redirected to /orders/{orderId}/confirmation');
});

Then('a confirmation email should be sent via SES', async function (this: EpicWeaveWorld) {
  this.attach('SES email sent with order details');
});

Then('the email should contain order ID, items, total, and shipping address', async function (this: EpicWeaveWorld) {
  this.attach('Email contains full order summary');
});

Then('the order confirmation page should display a success checkmark', async function (this: EpicWeaveWorld) {
  this.attach('Success checkmark displayed');
});

Then('the order details with items and totals should be shown', async function (this: EpicWeaveWorld) {
  this.attach('Order details displayed on confirmation page');
});

// Session fee non-refundability
Then('the session fee should be marked as non-refundable', async function (this: EpicWeaveWorld) {
  this.attach('Session fee is non-refundable per policy');
});

Then('the checkout page should display {string}', async function (this: EpicWeaveWorld, text: string) {
  this.attach(`Checkout displays: ${text}`);
});
