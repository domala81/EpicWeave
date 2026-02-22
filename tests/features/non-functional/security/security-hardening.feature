Feature: Security Hardening
  As a platform operator
  I want robust security measures in place
  So that the platform is protected against common attacks

  Scenario: WAF blocks SQL injection attempts
    Given the AWS WAF is configured on API Gateway
    When a request containing SQL injection payload is sent
    Then the WAF should block the request
    And return a 403 Forbidden response

  Scenario: WAF blocks XSS attempts
    Given the AWS WAF is configured on API Gateway
    When a request containing XSS script tags is sent
    Then the WAF should block the request
    And return a 403 Forbidden response

  Scenario: WAF rate limiting prevents abuse
    Given the AWS WAF rate limiting rule is active
    When more than 1000 requests are sent from one IP in 5 minutes
    Then subsequent requests should be blocked
    And a 429 Too Many Requests response should be returned

  Scenario: Cognito advanced security detects compromised credentials
    Given Cognito advanced security is enabled
    When a login attempt uses known compromised credentials
    Then the login should be blocked or challenged
    And an admin notification should be triggered

  Scenario: Input sanitization on product search
    Given the catalog search endpoint is available
    When I search with a payload containing script tags
    Then the input should be sanitized before processing
    And the response should not reflect unsanitized input

  Scenario: API Gateway validates request body schema
    Given the API Gateway request validation is enabled
    When a request with invalid JSON schema is sent to a POST endpoint
    Then the request should be rejected with 400 Bad Request
    And the error should describe the validation failure

  Scenario: CORS policy restricts origins
    Given CORS is configured on API Gateway
    When a request comes from an unauthorized origin
    Then the preflight response should not include Access-Control-Allow-Origin
    And the request should be rejected

  Scenario: Sensitive headers are not exposed
    Given the API is serving responses
    When I inspect the response headers
    Then server version headers should not be present
    And internal infrastructure details should not leak

  Scenario: JWT tokens are validated on every request
    Given the Cognito authorizer is configured on protected routes
    When a request is made without a valid JWT token
    Then the request should receive a 401 Unauthorized response

  Scenario: Admin routes require admin role
    Given I am authenticated as a regular customer
    When I try to access an admin-only endpoint
    Then I should receive a 403 Forbidden response
    And no admin data should be returned
