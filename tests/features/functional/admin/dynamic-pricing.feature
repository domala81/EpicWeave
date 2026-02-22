Feature: Dynamic Pricing via Parameter Store
  As a platform operator
  I want all pricing to be read dynamically from Parameter Store
  So that I can adjust prices without deploying code changes

  Background:
    Given I am logged in as a customer via Cognito

  Scenario: Session fee is read from Parameter Store
    Given the Parameter Store value "/EpicWeave/pricing/session-fee" is "2.00"
    When I navigate to the design session page
    Then the displayed session fee should be "$2.00"
    And the Stripe PaymentIntent amount should match the Parameter Store value

  Scenario: Session fee updates reflect immediately
    Given the admin has changed "/EpicWeave/pricing/session-fee" to "3.50"
    When I navigate to the design session page
    Then the displayed session fee should be "$3.50"

  Scenario: Custom t-shirt base price is read from Parameter Store
    Given the Parameter Store value "/EpicWeave/pricing/custom-tshirt-base" is "20.00"
    When I finalize a custom design with front-only placement
    Then the calculated price should be "$20.00"

  Scenario: Both-placement surcharge is applied from Parameter Store
    Given the Parameter Store value "/EpicWeave/pricing/custom-tshirt-base" is "20.00"
    And the Parameter Store value "/EpicWeave/pricing/both-placement-surcharge" is "5.00"
    When I finalize a custom design with both-side placement
    Then the calculated price should be "$25.00"

  Scenario: Shipping rate is read from Parameter Store
    Given the Parameter Store value "/EpicWeave/shipping/flat-rate-base" is "5.99"
    And I have 3 items in my cart
    When I proceed to the checkout page
    Then the shipping cost should be "$9.99"
    And the calculation should be flat-rate $5.99 plus $2.00 per extra item

  Scenario: Max iterations is read from Parameter Store
    Given the Parameter Store value "/EpicWeave/session/max-iterations" is "5"
    When I start a new design session
    Then the session should allow a maximum of 5 iterations

  Scenario: Allowed mythology types are read from Parameter Store
    Given the Parameter Store value "/EpicWeave/mythology/allowed-types" is "hindu,greek"
    When I enter a prompt referencing Norse mythology
    Then the prompt should be rejected as invalid mythology type

  Scenario: AI image resolution is read from Parameter Store
    Given the Parameter Store value "/EpicWeave/ai/image-resolution" is "1024x1024"
    When the AI worker generates an image
    Then the DALL-E API should be called with resolution "1024x1024"
