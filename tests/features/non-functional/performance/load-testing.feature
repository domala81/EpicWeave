Feature: Load Testing
  As a platform operator
  I need the system to handle high concurrent load
  So that users have a reliable experience during peak traffic

  Background:
    Given the EpicWeave AWS serverless stack is deployed
    And Lambda functions are warmed up

  Scenario: 500 concurrent users browsing products
    When 500 concurrent users request the product catalog
    Then all requests should complete within 2 seconds
    And the error rate should be below 1 percent
    And no Lambda throttling should occur

  Scenario: 50 TPS checkout throughput
    When 50 transactions per second hit the checkout endpoint
    Then all transactions should complete within 5 seconds
    And the DynamoDB consumed capacity should remain within provisioned limits
    And no orders should be lost or duplicated

  Scenario: SQS queue handles AI generation load
    When 200 concurrent AI design generation requests are queued
    Then the SQS queue depth should increase gracefully
    And the dead letter queue should remain empty
    And all messages should be processed within 10 minutes

  Scenario: DynamoDB handles concurrent writes
    When 100 concurrent cart add operations occur
    Then all operations should succeed without conflicts
    And DynamoDB conditional check failures should be retried

  Scenario: CloudFront caches static assets under load
    When 1000 concurrent requests hit product images
    Then the CloudFront cache hit ratio should be above 90 percent
    And origin requests should remain minimal

  Scenario: API Gateway handles burst traffic
    When a burst of 500 requests hits the API in 1 second
    Then API Gateway should not return 429 errors
    And the P99 latency should remain under 3 seconds
