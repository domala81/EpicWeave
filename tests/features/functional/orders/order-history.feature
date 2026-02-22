Feature: Customer Order History
  As a customer
  I want to view my order history
  So that I can track my purchases and their status

  Background:
    Given I am logged in as a customer via Cognito
    And I have placed orders in the past

  Scenario: View order history list
    When I navigate to the order history page
    Then I should see a list of my orders sorted by date descending
    And each order should display order ID, date, status, total, and item count

  Scenario: View order details
    Given I have an order with ID "ORD123"
    When I click on order "ORD123"
    Then I should see the order detail page
    And I should see all order items with name, size, color, quantity, and price
    And I should see the shipping address
    And I should see the order totals breakdown

  Scenario: Track order status
    Given I have an order with status "shipped"
    When I view the order details
    Then I should see the tracking number
    And I should see the status timeline showing "paid → processing → shipped"

  Scenario: Empty order history
    Given I have no previous orders
    When I navigate to the order history page
    Then I should see "No orders yet"
    And I should see a link to browse products

  Scenario: Order with custom design shows design image
    Given I have an order containing a custom design item
    When I view the order details
    Then I should see the custom design image from S3
    And the item should be labeled as "Custom Design"
