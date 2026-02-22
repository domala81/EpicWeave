Feature: Admin Order Management
  As an admin
  I want to manage customer orders
  So that I can process fulfillment and handle refunds

  Background:
    Given I am logged in as an admin via Cognito

  Scenario: View all orders with status filter
    When I navigate to the admin order dashboard
    Then I should see all orders sorted by date descending
    And I should be able to filter orders by status "paid", "processing", "shipped", "delivered"

  Scenario: Filter orders by status
    Given there are orders with different statuses
    When I filter orders by status "paid"
    Then I should only see orders with status "paid"
    And the query should use DynamoDB GSI2 with key "ORDER#STATUS#paid"

  Scenario: Update order status to processing
    Given there is an order with ID "ORD456" and status "paid"
    When I update the order status to "processing"
    Then the order status in DynamoDB should be updated to "processing"
    And the GSI2PK should be updated to "ORDER#STATUS#processing"
    And the order updatedAt timestamp should be refreshed

  Scenario: Mark order as shipped with tracking number
    Given there is an order with ID "ORD456" and status "processing"
    When I update the order status to "shipped" with tracking number "1Z999AA10123456784"
    Then the order status should be "shipped"
    And the tracking number should be saved in DynamoDB
    And a shipping notification email should be sent via SES

  Scenario: Mark order as delivered
    Given there is an order with ID "ORD456" and status "shipped"
    When I update the order status to "delivered"
    Then the order status should be "delivered"

  Scenario: Invalid status transition
    Given there is an order with ID "ORD456" and status "paid"
    When I try to update the order status to "delivered"
    Then I should see an error "Invalid status transition from paid to delivered"
    And the order status should remain "paid"

  Scenario: Process refund for order payment
    Given there is an order with ID "ORD789" and status "paid"
    And the order total is "$45.99"
    When I initiate a refund for order "ORD789"
    Then a Stripe Refund should be created for the order payment
    And the order status should be updated to "refunded"
    And the stock should be restored for pre-designed items
    And the refund amount should be "$45.99"

  Scenario: Session fee is non-refundable
    Given there is an order containing a custom design item
    And the customer paid a "$2.00" session fee
    When I process a refund for the order
    Then only the order payment should be refunded
    And the session fee payment should NOT be refunded
    And the refund notes should state "Session fee non-refundable"

  Scenario: Non-admin cannot access admin endpoints
    Given I am logged in as a regular customer
    When I try to access the admin order dashboard
    Then I should receive a 403 Forbidden response
