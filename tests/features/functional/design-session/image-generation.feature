Feature: AI Design Image Generation
  As a customer
  I want to generate mythology-themed designs via AI (OpenAI DALL-E)
  So that I can create custom t-shirts

  Background:
    Given I am logged in as a customer via Cognito
    And I have paid the $2.00 session fee via Stripe
    And I selected "anime" as my art style
    And I am in an active design session with 5 max iterations

  Scenario: Successfully generate an image from a valid prompt
    When I enter the prompt "Lord Shiva meditating on Mount Kailash"
    Then the system should validate the prompt against content rules
    And the prompt should be enqueued to SQS for DALL-E generation
    And I should see a "Generating design..." spinner
    When the Lambda AI worker processes the SQS message
    Then it should read image-resolution "1024x1024" from Parameter Store
    And it should call OpenAI DALL-E API with the enhanced prompt
    And the generated image should be uploaded to S3 bucket "epicweave-designs/<sessionId>/<ulid>.png"
    And a DesignMessage should be saved in DynamoDB with role "assistant"
    And the session iteration count should increment to "1 of 5"
    When I receive the image URL via polling
    Then I should see the generated image displayed on a t-shirt mockup

  Scenario: Reject a prompt that does not reference Hindu or Greek mythology
    When I enter the prompt "A cool dragon in space"
    Then the Lambda should read allowed mythology types from Parameter Store
    And the system should reject the prompt
    And I should see the message "Design must relate to Hindu or Greek mythology"
    And the session iteration count should not change
    And no SQS message should be sent

  Scenario: Modify an existing design
    Given I have a generated design in the current session
    When I enter the prompt "Make the background a sunset with cherry blossoms"
    Then the system should generate a modified image within 30 seconds
    And the iteration count should increment to "2 of 5"
    And I should see the updated image on the t-shirt mockup
    And both images should be preserved in the session history

  Scenario: Reach maximum iteration limit (5 iterations)
    Given I have used all 5 available iterations in the session
    When I try to enter a new modification prompt
    Then the Lambda should return 429 "Max iterations reached"
    And I should see the message "Maximum design iterations reached (5/5)"
    And I should be prompted to select color, size, and print placement
    And the prompt input should be disabled

  Scenario: Session expires after 1 hour of inactivity
    Given my session was created 61 minutes ago
    When I try to enter a new prompt
    Then the Lambda should check expiresAt > now
    And the Lambda should return 410 Gone
    And I should see the message "Session expired"
    And the session status in DynamoDB should be "expired"

  Scenario: Content safety filter blocks inappropriate prompt
    When I enter a prompt with inappropriate content
    Then the content safety filter should reject it
    And I should see "Content policy violation"
    And no image generation should occur
    And the iteration count should not change

  Scenario: Art style enforcement applies correctly
    Given I selected "modern" art style at session start
    When I enter the prompt "Zeus wielding lightning"
    Then the Lambda should prepend "Create a modern-styled depiction of"
    And the enhanced prompt should be sent to DALL-E
    And the generated image should reflect modern art style

  Scenario: Handle DALL-E API failure gracefully
    When I enter a valid prompt "Ganesha with lotus flowers"
    And the DALL-E API returns an error
    Then I should see "Image generation failed. Please try again."
    And the iteration count should not increment
    And I should be able to retry the same prompt
    And the session should remain active

  Scenario: Select t-shirt color and print placement after accepting design
    Given I have accepted a generated design
    When I select color "Navy" from the 30 standard options
    And I select size "L"
    And I select print placement "both"
    Then I should see a price breakdown showing base $20 + surcharge
    And the finalize endpoint should calculate the price from Parameter Store
    And I should be able to add the custom t-shirt to my cart
