Feature: Admin Configuration Management
  As an admin
  I want to manage platform configuration via Parameter Store
  So that I can dynamically adjust pricing, limits, and settings without code changes

  Background:
    Given I am logged in as an admin via Cognito

  Scenario: View all configuration parameters
    When I navigate to the admin configuration page
    Then I should see all Parameter Store values grouped by category
    And I should see the following categories: "pricing", "session", "mythology", "ai", "shipping"

  Scenario: View pricing configuration
    When I request the admin config API filtered by pricing
    Then I should see the following pricing parameters:
      | Parameter                                    | Value  |
      | /EpicWeave/pricing/session-fee               | 2.00   |
      | /EpicWeave/pricing/custom-tshirt-base        | 20.00  |
      | /EpicWeave/pricing/both-placement-surcharge  | 5.00   |

  Scenario: Update session fee
    When I update parameter "/EpicWeave/pricing/session-fee" to "3.50"
    Then the Parameter Store value should be updated to "3.50"
    And the change should take effect immediately for new sessions
    And a config change audit log should be recorded

  Scenario: Update custom t-shirt base price
    When I update parameter "/EpicWeave/pricing/custom-tshirt-base" to "25.00"
    Then the Parameter Store value should be updated to "25.00"
    And new design finalizations should use the updated price

  Scenario: Update shipping flat rate
    When I update parameter "/EpicWeave/shipping/flat-rate-base" to "7.99"
    Then the Parameter Store value should be updated to "7.99"
    And new checkout calculations should use the updated rate

  Scenario: Update session configuration
    When I update parameter "/EpicWeave/session/max-iterations" to "8"
    Then the Parameter Store value should be updated to "8"
    And new design sessions should allow 8 iterations

  Scenario: Update AI image resolution
    When I update parameter "/EpicWeave/ai/image-resolution" to "1024x1024"
    Then the Parameter Store value should be updated to "1024x1024"

  Scenario: Update allowed mythology types
    When I update parameter "/EpicWeave/mythology/allowed-types" to "hindu,greek,norse"
    Then the Parameter Store value should be updated to "hindu,greek,norse"
    And content validation should accept Norse mythology prompts

  Scenario: Validate parameter value format
    When I try to update parameter "/EpicWeave/pricing/session-fee" to "not-a-number"
    Then I should see a validation error "Value must be a valid number for pricing parameters"
    And the parameter should not be updated

  Scenario: Validate parameter value range
    When I try to update parameter "/EpicWeave/pricing/session-fee" to "-5.00"
    Then I should see a validation error "Pricing values must be positive"
    And the parameter should not be updated

  Scenario: Non-admin cannot access configuration
    Given I am logged in as a regular customer
    When I try to access the admin config API
    Then I should receive a 403 Forbidden response

  Scenario: Non-admin cannot update configuration
    Given I am logged in as a regular customer
    When I try to update parameter "/EpicWeave/pricing/session-fee" to "0.00"
    Then I should receive a 403 Forbidden response
    And the parameter should not be updated
