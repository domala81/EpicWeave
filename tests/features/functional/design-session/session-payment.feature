Feature: AI Design Session Payment
  As a customer
  I want to pay a session fee to access AI design generation
  So that I can create custom t-shirt designs

  Background:
    Given I am logged in as a customer via Cognito
    And the session fee is configured at "$2.00" in Parameter Store

  Scenario: Successfully pay session fee and create session
    When I click "Create Custom Design"
    Then I should see the session fee of "$2.00"
    And I should see terms stating "Session fee is non-refundable"
    And I should see art style options "Modern" and "Anime"
    When I select art style "Anime"
    And I enter my Stripe payment details
    And I click "Pay and Start Session"
    Then a Stripe PaymentIntent should be created for "$2.00"
    When the payment is successful
    Then a DesignSession should be created in DynamoDB with:
      | Field           | Value                  |
      | status          | active                 |
      | artStyleChoice  | anime                  |
      | iterationCount  | 0                      |
      | maxIterations   | 5                      |
      | expiresAt       | now + 60 minutes (TTL) |
    And a Payment record should be saved with type "session_fee" and status "succeeded"
    And I should be redirected to the chat interface

  Scenario: Payment fails due to insufficient funds
    When I click "Create Custom Design"
    And I select art style "Modern"
    And I enter payment details with insufficient funds
    And I click "Pay and Start Session"
    Then the Stripe payment should fail
    And I should see error "Your card has insufficient funds"
    And no DesignSession should be created
    And I should be able to retry payment

  Scenario: Payment fails due to invalid card
    When I click "Create Custom Design"
    And I select art style "Anime"
    And I enter invalid payment details
    And I click "Pay and Start Session"
    Then the Stripe payment should fail
    And I should see error "Your card was declined"
    And no DesignSession should be created

  Scenario: Display session fee from Parameter Store
    Given the admin has updated session fee to "$3.50" in Parameter Store
    When I click "Create Custom Design"
    Then I should see the updated session fee of "$3.50"
    And the Stripe PaymentIntent should be created for "$3.50"

  Scenario: Cannot start multiple concurrent sessions
    Given I have an active design session
    When I attempt to create another design session
    Then I should see message "You already have an active session"
    And I should be redirected to my existing session

  Scenario: Session created with correct TTL for auto-expiry
    When I successfully pay and create a session
    Then the DynamoDB record should have TTL set to 60 minutes from now
    And the session will auto-expire via DynamoDB TTL
