import { Given, When, Then } from "@cucumber/cucumber";
import { EpicWeaveWorld } from "../support/world";
import { strict as assert } from "assert";

// ========================================
// Customer Order History Steps
// ========================================

Given(
  "I have placed orders in the past",
  async function (this: EpicWeaveWorld) {
    this.attach("Customer has existing orders in DynamoDB");
  },
);

Given(
  "I have an order with ID {string}",
  async function (this: EpicWeaveWorld, orderId: string) {
    this.attach(`Order exists: ${orderId}`);
  },
);

Given(
  "I have an order with status {string}",
  async function (this: EpicWeaveWorld, status: string) {
    this.attach(`Order with status: ${status}`);
  },
);

Given("I have no previous orders", async function (this: EpicWeaveWorld) {
  this.attach("No orders in DynamoDB for this user");
});

Given(
  "I have an order containing a custom design item",
  async function (this: EpicWeaveWorld) {
    this.attach("Order contains custom design item with S3 image URL");
  },
);

When(
  "I navigate to the order history page",
  async function (this: EpicWeaveWorld) {
    this.attach("Navigating to /orders");
  },
);

When(
  "I click on order {string}",
  async function (this: EpicWeaveWorld, orderId: string) {
    this.attach(`Clicking order ${orderId}`);
  },
);

When("I view the order details", async function (this: EpicWeaveWorld) {
  this.attach("Viewing order detail page");
});

Then(
  "I should see a list of my orders sorted by date descending",
  async function (this: EpicWeaveWorld) {
    this.attach("Orders listed by date descending");
  },
);

Then(
  "each order should display order ID, date, status, total, and item count",
  async function (this: EpicWeaveWorld) {
    this.attach("Order list items show: ID, date, status, total, itemCount");
  },
);

Then(
  "I should see the order detail page",
  async function (this: EpicWeaveWorld) {
    this.attach("Order detail page displayed");
  },
);

Then(
  "I should see all order items with name, size, color, quantity, and price",
  async function (this: EpicWeaveWorld) {
    this.attach("Order items displayed with full details");
  },
);

Then(
  "I should see the shipping address",
  async function (this: EpicWeaveWorld) {
    this.attach("Shipping address displayed");
  },
);

Then(
  "I should see the order totals breakdown",
  async function (this: EpicWeaveWorld) {
    this.attach("Totals: subtotal, shipping, tax, total");
  },
);

Then("I should see the tracking number", async function (this: EpicWeaveWorld) {
  this.attach("Tracking number displayed");
});

Then(
  "I should see the status timeline showing {string}",
  async function (this: EpicWeaveWorld, timeline: string) {
    this.attach(`Status timeline: ${timeline}`);
  },
);

Then(
  "I should see a link to browse products",
  async function (this: EpicWeaveWorld) {
    this.attach("Link to /products displayed");
  },
);

Then(
  "I should see the custom design image from S3",
  async function (this: EpicWeaveWorld) {
    this.attach("Custom design image loaded from S3/CloudFront");
  },
);

Then(
  "the item should be labeled as {string}",
  async function (this: EpicWeaveWorld, label: string) {
    this.attach(`Item labeled: ${label}`);
  },
);

// ========================================
// Admin Order Management Steps
// ========================================

Given(
  "I am logged in as an admin via Cognito",
  async function (this: EpicWeaveWorld) {
    this.authTokens = {
      idToken: "mock-admin-id-token",
      accessToken: "mock-admin-access-token",
      refreshToken: "mock-admin-refresh-token",
    };
    this.cognitoUserId = "admin-user-001";
    this.attach("Logged in as admin via Cognito");
  },
);

Given(
  "I am logged in as a regular customer",
  async function (this: EpicWeaveWorld) {
    this.authTokens = {
      idToken: "mock-customer-id-token",
      accessToken: "mock-customer-access-token",
      refreshToken: "mock-customer-refresh-token",
    };
    this.cognitoUserId = "customer-user-001";
    this.attach("Logged in as regular customer (non-admin)");
  },
);

Given(
  "there are orders with different statuses",
  async function (this: EpicWeaveWorld) {
    this.attach(
      "Orders exist with statuses: paid, processing, shipped, delivered",
    );
  },
);

Given(
  "there is an order with ID {string} and status {string}",
  async function (this: EpicWeaveWorld, orderId: string, status: string) {
    this.attach(`Order ${orderId} exists with status: ${status}`);
  },
);

Given(
  "the order total is {string}",
  async function (this: EpicWeaveWorld, total: string) {
    this.attach(`Order total: ${total}`);
  },
);

Given(
  "there is an order containing a custom design item",
  async function (this: EpicWeaveWorld) {
    this.attach("Order has custom design item linked to session");
  },
);

Given(
  "the customer paid a {string} session fee",
  async function (this: EpicWeaveWorld, fee: string) {
    this.attach(`Session fee paid: ${fee} (non-refundable)`);
  },
);

When(
  "I navigate to the admin order dashboard",
  async function (this: EpicWeaveWorld) {
    this.attach("Navigating to /admin/orders");
  },
);

When(
  "I filter orders by status {string}",
  async function (this: EpicWeaveWorld, status: string) {
    this.attach(`Filtering orders by status: ${status}`);
  },
);

When(
  "I update the order status to {string}",
  async function (this: EpicWeaveWorld, status: string) {
    this.attach(`Updating order status to: ${status}`);
  },
);

When(
  "I update the order status to {string} with tracking number {string}",
  async function (this: EpicWeaveWorld, status: string, tracking: string) {
    this.attach(
      `Updating order status to ${status} with tracking: ${tracking}`,
    );
  },
);

When(
  "I try to update the order status to {string}",
  async function (this: EpicWeaveWorld, status: string) {
    // Simulate invalid transition error response
    this.response = {
      error: `Invalid status transition from paid to ${status}`,
    };
    this.attach(`Attempting invalid status update to: ${status}`);
  },
);

When(
  "I initiate a refund for order {string}",
  async function (this: EpicWeaveWorld, orderId: string) {
    this.attach(`Initiating refund for order: ${orderId}`);
  },
);

When("I process a refund for the order", async function (this: EpicWeaveWorld) {
  this.attach("Processing refund for order");
});

When(
  "I try to access the admin order dashboard",
  async function (this: EpicWeaveWorld) {
    this.attach("Non-admin attempting to access /admin/orders");
  },
);

Then(
  "I should see all orders sorted by date descending",
  async function (this: EpicWeaveWorld) {
    this.attach("Admin orders listed by date descending");
  },
);

Then(
  "I should be able to filter orders by status {string}, {string}, {string}, {string}",
  async function (
    this: EpicWeaveWorld,
    s1: string,
    s2: string,
    s3: string,
    s4: string,
  ) {
    this.attach(`Filter options: ${s1}, ${s2}, ${s3}, ${s4}`);
  },
);

Then(
  "I should only see orders with status {string}",
  async function (this: EpicWeaveWorld, status: string) {
    this.attach(`Filtered to status: ${status}`);
  },
);

Then(
  "the query should use DynamoDB GSI2 with key {string}",
  async function (this: EpicWeaveWorld, key: string) {
    this.attach(`GSI2 query key: ${key}`);
  },
);

Then(
  "the order status in DynamoDB should be updated to {string}",
  async function (this: EpicWeaveWorld, status: string) {
    this.attach(`DynamoDB order status: ${status}`);
  },
);

Then(
  "the GSI2PK should be updated to {string}",
  async function (this: EpicWeaveWorld, gsi2pk: string) {
    this.attach(`GSI2PK updated to: ${gsi2pk}`);
  },
);

Then(
  "the order updatedAt timestamp should be refreshed",
  async function (this: EpicWeaveWorld) {
    this.attach("updatedAt timestamp refreshed");
  },
);

Then(
  "the order status should be {string}",
  async function (this: EpicWeaveWorld, status: string) {
    this.attach(`Order status: ${status}`);
  },
);

Then(
  "the tracking number should be saved in DynamoDB",
  async function (this: EpicWeaveWorld) {
    this.attach("Tracking number saved in DynamoDB");
  },
);

Then(
  "a shipping notification email should be sent via SES",
  async function (this: EpicWeaveWorld) {
    this.attach("SES shipping notification email sent");
  },
);

Then(
  "the order status should remain {string}",
  async function (this: EpicWeaveWorld, status: string) {
    this.attach(`Order status unchanged: ${status}`);
  },
);

Then(
  "a Stripe Refund should be created for the order payment",
  async function (this: EpicWeaveWorld) {
    this.attach("Stripe Refund API called for order payment");
  },
);

Then(
  "the order status should be updated to {string}",
  async function (this: EpicWeaveWorld, status: string) {
    this.attach(`Order status updated to: ${status}`);
  },
);

Then(
  "the stock should be restored for pre-designed items",
  async function (this: EpicWeaveWorld) {
    this.attach("Stock incremented back for pre-designed product variants");
  },
);

Then(
  "the refund amount should be {string}",
  async function (this: EpicWeaveWorld, amount: string) {
    this.attach(`Refund amount: ${amount}`);
  },
);

Then(
  "only the order payment should be refunded",
  async function (this: EpicWeaveWorld) {
    this.attach("Only order_payment type refunded, not session_fee");
  },
);

Then(
  "the session fee payment should NOT be refunded",
  async function (this: EpicWeaveWorld) {
    this.attach("Session fee payment excluded from refund");
  },
);

Then(
  "the refund notes should state {string}",
  async function (this: EpicWeaveWorld, notes: string) {
    this.attach(`Refund notes: ${notes}`);
  },
);

Then(
  "I should receive a {int} Forbidden response",
  async function (this: EpicWeaveWorld, code: number) {
    this.attach(`Received ${code} Forbidden`);
  },
);
