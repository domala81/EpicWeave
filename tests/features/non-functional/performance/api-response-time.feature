Feature: API Response Time Performance
  As a platform operator
  I need API endpoints to respond quickly
  So that users have a good experience

  Background:
    Given the EpicWeave AWS serverless stack is deployed
    And Lambda functions are warmed up

  Scenario: Product listing API responds within target latency
    When I send GET request to "/products"
    Then the response should complete within 500ms
    And the response should include CloudFront cache headers

  Scenario: DynamoDB queries complete within target latency
    When I query DynamoDB for user cart items
    Then the query should complete within 100ms
    And it should use the correct partition key

  Scenario: Lambda cold start is acceptable
    Given a Lambda function has not been invoked recently
    When the function is invoked for the first time
    Then the cold start latency should be under 2 seconds
    And subsequent invocations should be under 200ms

  Scenario: CloudFront serves static assets quickly
    When I request a product image from CloudFront
    Then the image should be served within 200ms
    And it should come from the nearest edge location

  Scenario: API Gateway handles concurrent requests
    When 100 concurrent requests hit "/products"
    Then all requests should complete successfully
    And the P95 latency should be under 500ms
    And no requests should be throttled
