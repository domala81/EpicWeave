Feature: Checkout Payment Processing
  As a customer
  I want to complete my purchase with payment
  So that I can receive my custom t-shirts

  Background:
    Given I am logged in as a customer via Cognito
    And I have items in my cart
    And shipping is configured for US domestic only

  Scenario: Successfully place order with valid payment
    When I navigate to checkout
    Then I should see my cart summary with all items
    When I enter US shipping address:
      | Field      | Value              |
      | Street     | 123 Main St        |
      | City       | New York           |
      | State      | NY                 |
      | Zip        | 10001              |
      | Country    | United States      |
    And I enter valid payment details via Stripe Elements
    And I click "Place Order"
    Then the Lambda should read shipping rates from Parameter Store
    And the Lambda should validate all items are in stock
    And a Stripe PaymentIntent should be created for the order total
    When payment is successful
    Then a DynamoDB TransactWriteItems should execute atomically:
      | Action           | Entity              |
      | PUT              | Order               |
      | PUT              | OrderItems (each)   |
      | PUT              | Payment             |
      | UPDATE           | ProductVariant stock|
      | DELETE           | All CartItems       |
    And I should receive an order confirmation email via SES
    And I should see the order confirmation page with order number
    And the order should have status "paid"

  Scenario: Payment fails - insufficient funds
    When I proceed to checkout with valid shipping address
    And I enter payment details with insufficient funds
    And I click "Place Order"
    Then the Stripe payment should fail
    And I should see "Payment failed: Insufficient funds"
    And no Order should be created in DynamoDB
    And my cart items should remain intact
    And I should be able to retry with different payment method

  Scenario: Stock validation fails during checkout
    Given one of my cart items goes out of stock
    When I click "Place Order"
    Then the Lambda should perform final stock check
    And it should return 409 Conflict with unavailable items list
    And I should see "Some items are no longer available"
    And the unavailable items should be highlighted
    And I should be prompted to remove them

  Scenario: Calculate shipping costs correctly
    When I proceed to checkout
    Then the Lambda should read "/EpicWeave/shipping/flat-rate-base" from Parameter Store
    And it should calculate: subtotal + tax + flat-rate + carrier-rate
    And the order summary should show itemized costs:
      | Cost Type    |
      | Subtotal     |
      | Tax          |
      | Shipping     |
      | Total        |

  Scenario: Non-US shipping address is rejected
    When I enter a shipping address with country "Canada"
    Then I should see "We currently only ship within the United States"
    And the Place Order button should be disabled

  Scenario: Session fee is NOT refunded when order is placed
    Given I paid a $2 session fee for custom design
    And I added the custom design to cart
    When I complete the order
    Then the order payment and session fee payment should be separate records
    And only the order payment should be eligible for refund
