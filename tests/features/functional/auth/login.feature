Feature: User Login
  As a registered user
  I want to log in to my account
  So that I can access my profile and make purchases

  Background:
    Given the EpicWeave platform is available
    And I have a registered account with email "testuser@example.com" and password "TestPass123!"

  Scenario: Successfully login with valid credentials
    When I log in with email "testuser@example.com" and password "TestPass123!"
    Then I should be logged in successfully
    And I should receive valid JWT tokens from Cognito
    And the tokens should contain my user ID and email

  Scenario: Login with incorrect password
    When I attempt to log in with email "testuser@example.com" and password "WrongPassword!"
    Then I should see an error "Incorrect username or password"
    And I should not be logged in

  Scenario: Login with non-existent email
    When I attempt to log in with email "nonexistent@example.com" and password "SomePass123!"
    Then I should see an error "User does not exist"
    And I should not be logged in

  Scenario: Login with unverified email
    Given I have registered but not verified email "unverified@example.com"
    When I attempt to log in with email "unverified@example.com" and password "TestPass123!"
    Then I should see an error "User is not confirmed"
    And I should be prompted to verify my email

  Scenario: Login via Google OAuth
    When I click "Sign in with Google"
    And I authenticate via Google OAuth
    Then I should be redirected back to the application
    And I should be logged in with valid JWT tokens
    And I should be redirected to the dashboard

  Scenario: Login via GitHub OAuth
    When I click "Sign in with GitHub"
    And I authenticate via GitHub OAuth
    Then I should be redirected back to the application
    And I should be logged in with valid JWT tokens
    And I should be redirected to the dashboard

  Scenario: Token refresh after expiration
    Given I am logged in with valid tokens
    And my access token has expired
    When I make an authenticated API request
    Then the system should automatically refresh my access token using the refresh token
    And the API request should succeed
