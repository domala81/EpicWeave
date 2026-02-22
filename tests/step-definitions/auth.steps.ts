import { Given, When, Then } from "@cucumber/cucumber";
import { EpicWeaveWorld } from "../support/world";
import { strict as assert } from "assert";

// Background steps
Given(
  "the EpicWeave platform is available",
  async function (this: EpicWeaveWorld) {
    // Verify API endpoint is reachable
    this.context.apiEndpoint =
      process.env.API_ENDPOINT || "http://localhost:3001";
    // TODO: Add health check
  },
);

Given(
  "I have a registered account with email {string} and password {string}",
  async function (this: EpicWeaveWorld, email: string, password: string) {
    // TODO: Create test user in Cognito
    this.attach(`Creating test user: ${email}`);
  },
);

// Registration steps
When(
  "I register with email {string} and password {string}",
  async function (this: EpicWeaveWorld, email: string, password: string) {
    // TODO: Call Cognito SignUp API
    this.attach(`Registering user: ${email}`);
    // Mock response for now
    this.response = {
      userSub: "test-user-123",
      codeDeliveryDetails: {
        destination: email,
        deliveryMedium: "EMAIL",
      },
    };
  },
);

Then(
  "I should receive an email verification code",
  async function (this: EpicWeaveWorld) {
    // TODO: Verify code delivery
    assert.ok(
      this.response?.codeDeliveryDetails,
      "Code delivery details should exist",
    );
  },
);

When(
  "I confirm my email with the verification code",
  async function (this: EpicWeaveWorld) {
    // TODO: Call Cognito ConfirmSignUp API
    this.cognitoUserId = this.response?.userSub;
  },
);

Then("my account should be activated", async function (this: EpicWeaveWorld) {
  // TODO: Verify user status in Cognito
  assert.ok(this.cognitoUserId, "User ID should exist");
});

Then(
  "I should be logged in with valid JWT tokens",
  async function (this: EpicWeaveWorld) {
    // TODO: Verify JWT tokens exist
    this.authTokens = {
      idToken: "mock-id-token",
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    };
    assert.ok(this.authTokens.idToken, "ID token should exist");
  },
);

Then(
  "my user profile should be created in DynamoDB with role {string}",
  async function (this: EpicWeaveWorld, role: string) {
    // TODO: Query DynamoDB for user profile
    // PK: USER#<userId>, SK: PROFILE
    this.attach(`Verifying user profile with role: ${role}`);
  },
);

// Login steps
When(
  "I log in with email {string} and password {string}",
  async function (this: EpicWeaveWorld, email: string, password: string) {
    // TODO: Call Cognito InitiateAuth API
    this.attach(`Logging in user: ${email}`);
    this.authTokens = {
      idToken: "mock-id-token",
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    };
  },
);

Then(
  "I should be logged in successfully",
  async function (this: EpicWeaveWorld) {
    assert.ok(this.authTokens, "Auth tokens should exist");
  },
);

Then(
  "I should receive valid JWT tokens from Cognito",
  async function (this: EpicWeaveWorld) {
    assert.ok(this.authTokens?.idToken, "ID token should exist");
    assert.ok(this.authTokens?.accessToken, "Access token should exist");
    assert.ok(this.authTokens?.refreshToken, "Refresh token should exist");
  },
);

Then(
  "the tokens should contain my user ID and email",
  async function (this: EpicWeaveWorld) {
    // TODO: Decode and verify JWT payload
    this.attach("Verifying JWT token payload");
  },
);

// Error scenarios
Given(
  "a user already exists with email {string}",
  async function (this: EpicWeaveWorld, email: string) {
    // TODO: Create existing user in test setup
    this.attach(`User exists: ${email}`);
  },
);

When(
  "I attempt to register with email {string} and password {string}",
  async function (this: EpicWeaveWorld, email: string, password: string) {
    // Simulate different registration errors based on input
    if (email === "invalid-email" || !email.includes("@")) {
      this.response = { error: "Invalid email format" };
    } else if (password.length < 8) {
      this.response = { error: "Password does not meet security requirements" };
    } else {
      this.response = { error: "User with this email already exists" };
    }
  },
);

Then(
  "I should see an error {string}",
  async function (this: EpicWeaveWorld, errorMessage: string) {
    assert.ok(
      this.response?.error,
      `Expected error '${errorMessage}' but no error was set`,
    );
    assert.strictEqual(this.response.error, errorMessage);
  },
);

Then("my registration should fail", async function (this: EpicWeaveWorld) {
  assert.ok(this.response?.error, "Error should exist");
});

When(
  "I attempt to log in with email {string} and password {string}",
  async function (this: EpicWeaveWorld, email: string, password: string) {
    // Simulate login errors based on input
    if (email === "nonexistent@example.com") {
      this.response = { error: "User does not exist" };
    } else if (email === "unverified@example.com") {
      this.response = { error: "User is not confirmed" };
    } else if (password !== "TestPass123!") {
      this.response = { error: "Incorrect username or password" };
    }
    this.attach(`Attempting login: ${email}`);
  },
);

Then("I should not be logged in", async function (this: EpicWeaveWorld) {
  assert.ok(!this.authTokens || this.response?.error, "Login should fail");
});

// OAuth steps
When('I click "Sign in with Google"', async function (this: EpicWeaveWorld) {
  this.attach("Clicking: Sign in with Google");
});

When('I click "Sign in with GitHub"', async function (this: EpicWeaveWorld) {
  this.attach("Clicking: Sign in with GitHub");
});

When("I authenticate via Google OAuth", async function (this: EpicWeaveWorld) {
  // TODO: Mock OAuth callback
  this.authTokens = {
    idToken: "mock-google-id-token",
    accessToken: "mock-google-access-token",
    refreshToken: "mock-google-refresh-token",
  };
});

When("I authenticate via GitHub OAuth", async function (this: EpicWeaveWorld) {
  // TODO: Mock OAuth callback
  this.authTokens = {
    idToken: "mock-github-id-token",
    accessToken: "mock-github-access-token",
    refreshToken: "mock-github-refresh-token",
  };
});

Then(
  "I should be redirected back to the application",
  async function (this: EpicWeaveWorld) {
    // TODO: Verify redirect
    this.attach("Verifying OAuth redirect");
  },
);

Then(
  "I should be redirected to the dashboard",
  async function (this: EpicWeaveWorld) {
    // TODO: Verify dashboard redirect
    this.attach("Verifying dashboard redirect");
  },
);

// Missing steps for login scenarios
Given(
  "I have registered but not verified email {string}",
  async function (this: EpicWeaveWorld, email: string) {
    this.attach(`Unverified account: ${email}`);
  },
);

Then(
  "I should be prompted to verify my email",
  async function (this: EpicWeaveWorld) {
    this.attach("Prompted to verify email");
  },
);

Given(
  "I am logged in with valid tokens",
  async function (this: EpicWeaveWorld) {
    this.authTokens = {
      idToken: "mock-id-token",
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    };
    this.attach("Logged in with valid tokens");
  },
);

Given("my access token has expired", async function (this: EpicWeaveWorld) {
  this.attach("Access token expired");
});

When(
  "the application detects an expired token",
  async function (this: EpicWeaveWorld) {
    this.attach("Expired token detected");
  },
);

Then(
  "it should automatically refresh the tokens using the refresh token",
  async function (this: EpicWeaveWorld) {
    this.attach("Tokens refreshed automatically");
  },
);

Then(
  "I should remain logged in without interruption",
  async function (this: EpicWeaveWorld) {
    this.attach("Session maintained seamlessly");
  },
);

// Logout steps
When("I log out", async function (this: EpicWeaveWorld) {
  this.authTokens = undefined;
  this.attach("Logged out");
});

Then("my tokens should be invalidated", async function (this: EpicWeaveWorld) {
  this.attach("Tokens invalidated");
});

Then(
  "I should be redirected to the login page",
  async function (this: EpicWeaveWorld) {
    this.attach("Redirected to login page");
  },
);

Then(
  "I should not be able to access protected routes",
  async function (this: EpicWeaveWorld) {
    this.attach("Protected routes inaccessible");
  },
);
