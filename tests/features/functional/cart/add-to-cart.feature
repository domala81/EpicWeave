Feature: Add Items to Cart
  As a customer
  I want to add products to my shopping cart
  So that I can purchase them later

  Background:
    Given I am logged in as a customer via Cognito
    And the product catalog is available

  Scenario: Add pre-designed product to cart
    Given I am viewing product "Shiva Meditation Tee" with ID "PROD001"
    When I select size "L"
    And I select color "Navy"
    And I click "Add to Cart"
    Then a POST request should be made to API Gateway "/cart/items"
    And the Lambda should create a CartItem in DynamoDB with:
      | Field      | Value                    |
      | PK         | USER#<userId>            |
      | SK         | CART#ITEM#<ulid>         |
      | productId  | PROD001                  |
      | size       | L                        |
      | color      | Navy                     |
      | quantity   | 1                        |
      | type       | pre-designed             |
    And I should see "Item added to cart" confirmation toast
    And the cart icon badge should show "1"

  Scenario: Add custom design to cart
    Given I have completed a design session with a custom design
    And I selected color "Black", size "XL", and print placement "both"
    When I click "Add to Cart"
    Then a CartItem should be created in DynamoDB with:
      | Field          | Value                    |
      | type           | custom                   |
      | sessionId      | <sessionId>              |
      | designImageUrl | S3 URL                   |
      | printPlacement | both                     |
      | unitPrice      | calculated from config   |
    And I should see the custom design in my cart
    And the session status should update to "completed"

  Scenario: Add multiple quantities of same product
    When I add product "Zeus Lightning Tee" size "M" color "White" to cart
    And I add the same product with same size and color again
    Then the quantity should increment to 2
    And only one CartItem record should exist
    And the cart total should reflect 2 items

  Scenario: Add product that is out of stock
    Given product variant "Apollo Tee" size "S" color "Red" has stockCount 0
    When I select that variant and click "Add to Cart"
    Then the Lambda should check stockCount > 0
    And the Lambda should return 409 Conflict
    And I should see "This product is currently out of stock"
    And the item should not be added to cart

  Scenario: Cart persists across sessions
    Given I add items to my cart
    When I log out and log back in
    Then my cart items should still be present
    And they should be retrieved from DynamoDB using PK=USER#<userId>
