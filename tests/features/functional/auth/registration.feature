Feature: User Registration
  As a new user
  I want to register for an account
  So that I can purchase products and create custom designs

  Background:
    Given the EpicWeave platform is available

  Scenario: Successfully register with email and password
    When I register with email "user@example.com" and password "SecurePass123!"
    Then I should receive an email verification code
    When I confirm my email with the verification code
    Then my account should be activated
    And I should be logged in with valid JWT tokens
    And my user profile should be created in DynamoDB with role "customer"

  Scenario: Register with duplicate email
    Given a user already exists with email "existing@example.com"
    When I attempt to register with email "existing@example.com" and password "AnotherPass456!"
    Then I should see an error "User with this email already exists"
    And my registration should fail

  Scenario: Register with invalid email format
    When I attempt to register with email "invalid-email" and password "ValidPass789!"
    Then I should see an error "Invalid email format"
    And my registration should fail

  Scenario: Register with weak password
    When I attempt to register with email "newuser@example.com" and password "weak"
    Then I should see an error "Password does not meet security requirements"
    And my registration should fail

  Scenario: Register via Google OAuth
    When I click "Sign up with Google"
    And I authenticate via Google OAuth
    Then I should be redirected back to the application
    And I should be logged in with valid JWT tokens
    And my user profile should be created in DynamoDB with role "customer"

  Scenario: Register via GitHub OAuth
    When I click "Sign up with GitHub"
    And I authenticate via GitHub OAuth
    Then I should be redirected back to the application
    And I should be logged in with valid JWT tokens
    And my user profile should be created in DynamoDB with role "customer"
