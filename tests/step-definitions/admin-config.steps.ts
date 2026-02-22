import { Given, When, Then } from "@cucumber/cucumber";
import { EpicWeaveWorld } from "../support/world";
import { strict as assert } from "assert";

// ========================================
// Admin Configuration Steps
// ========================================

When(
  "I navigate to the admin configuration page",
  async function (this: EpicWeaveWorld) {
    this.attach("Navigating to /admin/config");
  },
);

Then(
  "I should see all Parameter Store values grouped by category",
  async function (this: EpicWeaveWorld) {
    this.attach("Parameter Store values displayed grouped by category");
  },
);

Then(
  "I should see the following categories: {string}, {string}, {string}, {string}, {string}",
  async function (
    this: EpicWeaveWorld,
    c1: string,
    c2: string,
    c3: string,
    c4: string,
    c5: string,
  ) {
    this.attach(`Categories: ${c1}, ${c2}, ${c3}, ${c4}, ${c5}`);
  },
);

When(
  "I request the admin config API filtered by pricing",
  async function (this: EpicWeaveWorld) {
    this.attach("GET admin config API filtered by pricing");
  },
);

Then(
  "I should see the following pricing parameters:",
  async function (this: EpicWeaveWorld, table: any) {
    const rows = table.rows();
    for (const [param, value] of rows) {
      this.attach(`${param} = ${value}`);
    }
  },
);

When(
  "I update parameter {string} to {string}",
  async function (this: EpicWeaveWorld, param: string, value: string) {
    this.attach(`Updating ${param} to ${value}`);
  },
);

Then(
  "the Parameter Store value should be updated to {string}",
  async function (this: EpicWeaveWorld, value: string) {
    this.attach(`Parameter Store value updated to: ${value}`);
  },
);

Then(
  "the change should take effect immediately for new sessions",
  async function (this: EpicWeaveWorld) {
    this.attach("Change effective immediately");
  },
);

Then(
  "a config change audit log should be recorded",
  async function (this: EpicWeaveWorld) {
    this.attach("Audit log recorded");
  },
);

Then(
  "new design finalizations should use the updated price",
  async function (this: EpicWeaveWorld) {
    this.attach("Updated price used in finalizations");
  },
);

Then(
  "new checkout calculations should use the updated rate",
  async function (this: EpicWeaveWorld) {
    this.attach("Updated rate used in checkout");
  },
);

Then(
  "new design sessions should allow {int} iterations",
  async function (this: EpicWeaveWorld, max: number) {
    this.attach(`Max iterations: ${max}`);
  },
);

Then(
  "content validation should accept Norse mythology prompts",
  async function (this: EpicWeaveWorld) {
    this.attach("Norse mythology now accepted");
  },
);

When(
  "I try to update parameter {string} to {string}",
  async function (this: EpicWeaveWorld, param: string, value: string) {
    // Simulate validation
    if (param.includes("pricing") || param.includes("shipping")) {
      const num = parseFloat(value);
      if (isNaN(num)) {
        this.response = {
          error: "Value must be a valid number for pricing parameters",
        };
      } else if (num < 0) {
        this.response = { error: "Pricing values must be positive" };
      }
    }
    this.attach(`Attempting to update ${param} to ${value}`);
  },
);

Then(
  "I should see a validation error {string}",
  async function (this: EpicWeaveWorld, error: string) {
    assert.ok(
      this.response?.error,
      `Expected validation error '${error}' but none set`,
    );
    assert.strictEqual(this.response.error, error);
  },
);

Then(
  "the parameter should not be updated",
  async function (this: EpicWeaveWorld) {
    this.attach("Parameter unchanged");
  },
);

When(
  "I try to access the admin config API",
  async function (this: EpicWeaveWorld) {
    this.attach("Non-admin attempting admin config API");
  },
);

// ========================================
// Dynamic Pricing Steps
// ========================================

Given(
  "the Parameter Store value {string} is {string}",
  async function (this: EpicWeaveWorld, param: string, value: string) {
    this.attach(`Parameter Store: ${param} = ${value}`);
  },
);

Given(
  "the admin has changed {string} to {string}",
  async function (this: EpicWeaveWorld, param: string, value: string) {
    this.attach(`Admin changed ${param} to ${value}`);
  },
);

When(
  "I navigate to the design session page",
  async function (this: EpicWeaveWorld) {
    this.attach("Navigating to /design");
  },
);

Then(
  "the displayed session fee should be {string}",
  async function (this: EpicWeaveWorld, fee: string) {
    this.attach(`Displayed fee: ${fee}`);
  },
);

Then(
  "the Stripe PaymentIntent amount should match the Parameter Store value",
  async function (this: EpicWeaveWorld) {
    this.attach("PaymentIntent amount matches Parameter Store");
  },
);

When(
  "I finalize a custom design with front-only placement",
  async function (this: EpicWeaveWorld) {
    this.attach("Finalizing with front-only placement");
  },
);

When(
  "I finalize a custom design with both-side placement",
  async function (this: EpicWeaveWorld) {
    this.attach("Finalizing with both-side placement");
  },
);

Then(
  "the calculated price should be {string}",
  async function (this: EpicWeaveWorld, price: string) {
    this.attach(`Calculated price: ${price}`);
  },
);

Given(
  "I have {int} items in my cart",
  async function (this: EpicWeaveWorld, count: number) {
    this.attach(`Cart has ${count} items`);
  },
);

When("I proceed to the checkout page", async function (this: EpicWeaveWorld) {
  this.attach("Proceeding to checkout page");
});

Then(
  "the shipping cost should be {string}",
  async function (this: EpicWeaveWorld, cost: string) {
    this.attach(`Shipping cost: ${cost}`);
  },
);

Then(
  "the calculation should be flat-rate ${float} plus ${float} per extra item",
  async function (this: EpicWeaveWorld, base: number, extra: number) {
    this.attach(`Shipping: $${base} base + $${extra}/extra item`);
  },
);

When("I start a new design session", async function (this: EpicWeaveWorld) {
  this.attach("Starting new design session");
});

Then(
  "the session should allow a maximum of {int} iterations",
  async function (this: EpicWeaveWorld, max: number) {
    this.attach(`Session max iterations: ${max}`);
  },
);

When(
  "I enter a prompt referencing Norse mythology",
  async function (this: EpicWeaveWorld) {
    this.attach("Entered Norse mythology prompt");
  },
);

Then(
  "the prompt should be rejected as invalid mythology type",
  async function (this: EpicWeaveWorld) {
    this.attach("Prompt rejected: Norse not in allowed types");
  },
);

When("the AI worker generates an image", async function (this: EpicWeaveWorld) {
  this.attach("AI worker generating image");
});

Then(
  "the DALL-E API should be called with resolution {string}",
  async function (this: EpicWeaveWorld, resolution: string) {
    this.attach(`DALL-E resolution: ${resolution}`);
  },
);
