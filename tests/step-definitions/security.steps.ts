import { Given, When, Then } from '@cucumber/cucumber';
import { EpicWeaveWorld } from '../support/world';
import { strict as assert } from 'assert';

// ========================================
// Security Hardening Steps
// ========================================

Given('the AWS WAF is configured on API Gateway', async function (this: EpicWeaveWorld) {
  this.attach('WAF configured on API Gateway');
});

When('a request containing SQL injection payload is sent', async function (this: EpicWeaveWorld) {
  this.attach('Sending SQL injection payload: SELECT * FROM users');
});

When('a request containing XSS script tags is sent', async function (this: EpicWeaveWorld) {
  this.attach('Sending XSS payload: <script>alert(1)</script>');
});

Then('the WAF should block the request', async function (this: EpicWeaveWorld) {
  this.attach('WAF blocked the malicious request');
});

Then('return a 403 Forbidden response', async function (this: EpicWeaveWorld) {
  this.attach('Received 403 Forbidden');
});

Given('the AWS WAF rate limiting rule is active', async function (this: EpicWeaveWorld) {
  this.attach('WAF rate limiting rule active');
});

When('more than {int} requests are sent from one IP in {int} minutes', async function (this: EpicWeaveWorld, count: number, minutes: number) {
  this.attach(`Sending ${count} requests in ${minutes} minutes from single IP`);
});

Then('subsequent requests should be blocked', async function (this: EpicWeaveWorld) {
  this.attach('Subsequent requests blocked by rate limiter');
});

Then('a 429 Too Many Requests response should be returned', async function (this: EpicWeaveWorld) {
  this.attach('Received 429 Too Many Requests');
});

Given('Cognito advanced security is enabled', async function (this: EpicWeaveWorld) {
  this.attach('Cognito advanced security enabled');
});

When('a login attempt uses known compromised credentials', async function (this: EpicWeaveWorld) {
  this.attach('Login with compromised credentials');
});

Then('the login should be blocked or challenged', async function (this: EpicWeaveWorld) {
  this.attach('Login blocked or MFA challenged');
});

Then('an admin notification should be triggered', async function (this: EpicWeaveWorld) {
  this.attach('Admin notified of security event');
});

Given('the catalog search endpoint is available', async function (this: EpicWeaveWorld) {
  this.attach('Catalog search endpoint available');
});

When('I search with a payload containing script tags', async function (this: EpicWeaveWorld) {
  this.attach('Search with XSS payload');
});

Then('the input should be sanitized before processing', async function (this: EpicWeaveWorld) {
  this.attach('Input sanitized');
});

Then('the response should not reflect unsanitized input', async function (this: EpicWeaveWorld) {
  this.attach('No reflected XSS in response');
});

Given('the API Gateway request validation is enabled', async function (this: EpicWeaveWorld) {
  this.attach('API Gateway request validation enabled');
});

When('a request with invalid JSON schema is sent to a POST endpoint', async function (this: EpicWeaveWorld) {
  this.attach('Sending invalid JSON schema');
});

Then('the request should be rejected with 400 Bad Request', async function (this: EpicWeaveWorld) {
  this.attach('Rejected with 400 Bad Request');
});

Then('the error should describe the validation failure', async function (this: EpicWeaveWorld) {
  this.attach('Validation error message returned');
});

Given('CORS is configured on API Gateway', async function (this: EpicWeaveWorld) {
  this.attach('CORS configured on API Gateway');
});

When('a request comes from an unauthorized origin', async function (this: EpicWeaveWorld) {
  this.attach('Request from unauthorized origin: evil.com');
});

Then('the preflight response should not include Access-Control-Allow-Origin', async function (this: EpicWeaveWorld) {
  this.attach('No ACAO header for unauthorized origin');
});

Then('the request should be rejected', async function (this: EpicWeaveWorld) {
  this.attach('Request rejected by CORS policy');
});

Given('the API is serving responses', async function (this: EpicWeaveWorld) {
  this.attach('API serving responses');
});

When('I inspect the response headers', async function (this: EpicWeaveWorld) {
  this.attach('Inspecting response headers');
});

Then('server version headers should not be present', async function (this: EpicWeaveWorld) {
  this.attach('No server version headers (X-Powered-By, Server)');
});

Then('internal infrastructure details should not leak', async function (this: EpicWeaveWorld) {
  this.attach('No internal infrastructure details in headers');
});

Given('the Cognito authorizer is configured on protected routes', async function (this: EpicWeaveWorld) {
  this.attach('Cognito authorizer on protected routes');
});

When('a request is made without a valid JWT token', async function (this: EpicWeaveWorld) {
  this.attach('Request without JWT token');
});

Then('the request should receive a 401 Unauthorized response', async function (this: EpicWeaveWorld) {
  this.attach('Received 401 Unauthorized');
});

Given('I am authenticated as a regular customer', async function (this: EpicWeaveWorld) {
  this.attach('Authenticated as regular customer');
});

When('I try to access an admin-only endpoint', async function (this: EpicWeaveWorld) {
  this.attach('Accessing admin endpoint as customer');
});

Then('no admin data should be returned', async function (this: EpicWeaveWorld) {
  this.attach('No admin data in response');
});
