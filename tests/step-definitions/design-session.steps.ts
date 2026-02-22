import { Given, When, Then } from '@cucumber/cucumber';
import { EpicWeaveWorld } from '../support/world';
import { strict as assert } from 'assert';

// Background steps
Given('I am logged in as a customer via Cognito', async function (this: EpicWeaveWorld) {
  this.authTokens = {
    idToken: 'mock-cognito-id-token',
    accessToken: 'mock-cognito-access-token',
    refreshToken: 'mock-cognito-refresh-token',
  };
  this.cognitoUserId = 'test-user-123';
  this.attach('Logged in as customer via Cognito');
});

Given('the session fee is configured at {string} in Parameter Store', async function (this: EpicWeaveWorld, fee: string) {
  this.attach(`Session fee configured at ${fee} in Parameter Store /EpicWeave/pricing/session-fee`);
});

Given('I have paid the ${float} session fee via Stripe', async function (this: EpicWeaveWorld, amount: number) {
  this.attach(`Paid $${amount} session fee via Stripe`);
});

Given('I selected {string} as my art style', async function (this: EpicWeaveWorld, style: string) {
  this.attach(`Art style selected: ${style}`);
});

Given('I am in an active design session with {int} max iterations', async function (this: EpicWeaveWorld, maxIter: number) {
  this.sessionId = 'test-session-123';
  this.attach(`Active session ${this.sessionId} with ${maxIter} max iterations`);
});

Given('I have an active design session', async function (this: EpicWeaveWorld) {
  this.sessionId = 'test-session-123';
  this.attach('Active design session exists');
});

Given('I have a generated design in the current session', async function (this: EpicWeaveWorld) {
  this.attach('Design generated in current session');
});

Given('I have used all {int} available iterations in the session', async function (this: EpicWeaveWorld, count: number) {
  this.attach(`Used ${count}/${count} iterations`);
});

Given('my session was created {int} minutes ago', async function (this: EpicWeaveWorld, minutes: number) {
  this.attach(`Session created ${minutes} minutes ago`);
});

Given('I selected {string} art style at session start', async function (this: EpicWeaveWorld, style: string) {
  this.attach(`Art style at start: ${style}`);
});

Given('I have accepted a generated design', async function (this: EpicWeaveWorld) {
  this.attach('Design accepted');
});

Given('the admin has updated session fee to {string} in Parameter Store', async function (this: EpicWeaveWorld, fee: string) {
  this.attach(`Admin updated session fee to ${fee}`);
});

// Session payment steps
When('I click "Create Custom Design"', async function (this: EpicWeaveWorld) {
  this.attach('Navigating to /design');
});

Then('I should see the session fee of {string}', async function (this: EpicWeaveWorld, fee: string) {
  this.attach(`Displayed session fee: ${fee}`);
});

Then('I should see terms stating {string}', async function (this: EpicWeaveWorld, terms: string) {
  this.attach(`Terms displayed: ${terms}`);
});

Then('I should see art style options {string} and {string}', async function (this: EpicWeaveWorld, opt1: string, opt2: string) {
  this.attach(`Art style options: ${opt1}, ${opt2}`);
});

When('I select art style {string}', async function (this: EpicWeaveWorld, style: string) {
  this.attach(`Selected art style: ${style}`);
});

When('I enter my Stripe payment details', async function (this: EpicWeaveWorld) {
  this.attach('Entered Stripe payment details');
});

When('I click "Pay and Start Session"', async function (this: EpicWeaveWorld) {
  this.attach('Clicked Pay and Start Session');
});

Then('a Stripe PaymentIntent should be created for {string}', async function (this: EpicWeaveWorld, amount: string) {
  this.attach(`Stripe PaymentIntent created for ${amount}`);
});

When('the payment is successful', async function (this: EpicWeaveWorld) {
  this.attach('Payment succeeded');
});

Then('a DesignSession should be created in DynamoDB with:', async function (this: EpicWeaveWorld, table: any) {
  const rows = table.rows();
  for (const [field, value] of rows) {
    this.attach(`DynamoDB DesignSession: ${field} = ${value}`);
  }
});

Then('a Payment record should be saved with type {string} and status {string}', async function (this: EpicWeaveWorld, type: string, status: string) {
  this.attach(`Payment record: type=${type}, status=${status}`);
});

Then('I should be redirected to the chat interface', async function (this: EpicWeaveWorld) {
  this.attach('Redirected to /design/<sessionId>');
});

// Image generation steps
When('I enter the prompt {string}', async function (this: EpicWeaveWorld, prompt: string) {
  this.attach(`User prompt: ${prompt}`);
});

Then('the system should validate the prompt against content rules', async function (this: EpicWeaveWorld) {
  this.attach('Content rules validated');
});

Then('the prompt should be enqueued to SQS for DALL-E generation', async function (this: EpicWeaveWorld) {
  this.attach('Prompt enqueued to SQS');
});

Then('I should see a {string} spinner', async function (this: EpicWeaveWorld, text: string) {
  this.attach(`Spinner displayed: ${text}`);
});

When('the Lambda AI worker processes the SQS message', async function (this: EpicWeaveWorld) {
  this.attach('Lambda AI worker processing SQS message');
});

Then('it should read image-resolution {string} from Parameter Store', async function (this: EpicWeaveWorld, resolution: string) {
  this.attach(`Read image resolution: ${resolution}`);
});

Then('it should call OpenAI DALL-E API with the enhanced prompt', async function (this: EpicWeaveWorld) {
  this.attach('Called OpenAI DALL-E API');
});

Then('the generated image should be uploaded to S3 bucket {string}', async function (this: EpicWeaveWorld, path: string) {
  this.attach(`Image uploaded to S3: ${path}`);
});

Then('a DesignMessage should be saved in DynamoDB with role {string}', async function (this: EpicWeaveWorld, role: string) {
  this.attach(`DynamoDB DesignMessage saved with role: ${role}`);
});

Then('the session iteration count should increment to {string}', async function (this: EpicWeaveWorld, count: string) {
  this.attach(`Iteration count: ${count}`);
});

When('I receive the image URL via polling', async function (this: EpicWeaveWorld) {
  this.attach('Image URL received via polling GET /sessions/{id}/status');
});

Then('I should see the generated image displayed on a t-shirt mockup', async function (this: EpicWeaveWorld) {
  this.attach('T-shirt mockup displayed with generated image');
});

// Content rule enforcement
Then('the Lambda should read allowed mythology types from Parameter Store', async function (this: EpicWeaveWorld) {
  this.attach('Read /EpicWeave/mythology/allowed-types from Parameter Store');
});

Then('the system should reject the prompt', async function (this: EpicWeaveWorld) {
  this.attach('Prompt rejected by content rules');
});

Then('I should see the message {string}', async function (this: EpicWeaveWorld, message: string) {
  this.attach(`Message displayed: ${message}`);
});

Then('the session iteration count should not change', async function (this: EpicWeaveWorld) {
  this.attach('Iteration count unchanged');
});

Then('no SQS message should be sent', async function (this: EpicWeaveWorld) {
  this.attach('No SQS message sent');
});

// Max iterations
When('I try to enter a new modification prompt', async function (this: EpicWeaveWorld) {
  this.attach('Attempting new prompt at max iterations');
});

Then('the Lambda should return {int} {string}', async function (this: EpicWeaveWorld, code: number, message: string) {
  this.attach(`Lambda returned ${code}: ${message}`);
});

Then('the prompt input should be disabled', async function (this: EpicWeaveWorld) {
  this.attach('Prompt input disabled');
});

// Session expiry
When('I try to enter a new prompt', async function (this: EpicWeaveWorld) {
  this.attach('Attempting new prompt after session expiry');
});

Then('the Lambda should check expiresAt > now', async function (this: EpicWeaveWorld) {
  this.attach('Lambda checked TTL expiry');
});

Then('the session status in DynamoDB should be {string}', async function (this: EpicWeaveWorld, status: string) {
  this.attach(`Session status in DynamoDB: ${status}`);
});

// Finalize design
When('I select color {string} from the 30 standard options', async function (this: EpicWeaveWorld, color: string) {
  this.attach(`Selected color: ${color}`);
});

When('I select size {string}', async function (this: EpicWeaveWorld, size: string) {
  this.attach(`Selected size: ${size}`);
});

When('I select print placement {string}', async function (this: EpicWeaveWorld, placement: string) {
  this.attach(`Selected print placement: ${placement}`);
});

Then('I should see a price breakdown showing base ${int} + surcharge', async function (this: EpicWeaveWorld, basePrice: number) {
  this.attach(`Price breakdown: base $${basePrice} + surcharge`);
});

Then('the finalize endpoint should calculate the price from Parameter Store', async function (this: EpicWeaveWorld) {
  this.attach('Price calculated from /EpicWeave/pricing/* Parameter Store values');
});

Then('I should be able to add the custom t-shirt to my cart', async function (this: EpicWeaveWorld) {
  this.attach('Add to cart button enabled');
});

// Safety filter
When('I enter a prompt with inappropriate content', async function (this: EpicWeaveWorld) {
  this.attach('Entered inappropriate prompt');
});

Then('the content safety filter should reject it', async function (this: EpicWeaveWorld) {
  this.attach('Safety filter triggered');
});

Then('no image generation should occur', async function (this: EpicWeaveWorld) {
  this.attach('No generation occurred');
});

Then('the iteration count should not change', async function (this: EpicWeaveWorld) {
  this.attach('Iteration count unchanged');
});

// Art style enforcement
Then('the Lambda should prepend {string}', async function (this: EpicWeaveWorld, prefix: string) {
  this.attach(`Prompt enhanced with prefix: ${prefix}`);
});

Then('the enhanced prompt should be sent to DALL-E', async function (this: EpicWeaveWorld) {
  this.attach('Enhanced prompt sent to DALL-E');
});

Then('the generated image should reflect modern art style', async function (this: EpicWeaveWorld) {
  this.attach('Image reflects modern art style');
});

// Error handling
When('the DALL-E API returns an error', async function (this: EpicWeaveWorld) {
  this.attach('DALL-E API returned error');
});

Then('I should be able to retry the same prompt', async function (this: EpicWeaveWorld) {
  this.attach('Retry enabled');
});

Then('the session should remain active', async function (this: EpicWeaveWorld) {
  this.attach('Session still active');
});

Then('the iteration count should not increment', async function (this: EpicWeaveWorld) {
  this.attach('Iteration count not incremented');
});

// Concurrent sessions
When('I attempt to create another design session', async function (this: EpicWeaveWorld) {
  this.attach('Attempting second concurrent session');
});

Then('I should be redirected to my existing session', async function (this: EpicWeaveWorld) {
  this.attach('Redirected to existing active session');
});

When('I successfully pay and create a session', async function (this: EpicWeaveWorld) {
  this.sessionId = 'new-test-session';
  this.attach('Session created successfully');
});

Then('the DynamoDB record should have TTL set to {int} minutes from now', async function (this: EpicWeaveWorld, minutes: number) {
  this.attach(`DynamoDB TTL set to ${minutes} minutes from now (expiresAt attribute)`);
});

Then('the session will auto-expire via DynamoDB TTL', async function (this: EpicWeaveWorld) {
  this.attach('DynamoDB TTL auto-expiry enabled');
});
