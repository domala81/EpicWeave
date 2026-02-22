Feature: Browse Product Catalog
  As a customer
  I want to browse pre-designed mythology-themed t-shirts
  So that I can find products I want to purchase

  Background:
    Given the EpicWeave platform is available
    And the product catalog contains mythology-themed t-shirts

  Scenario: View all products without filters
    When I navigate to the catalog page
    Then I should see a grid of product cards
    And each product card should display an image, name, price, and available colors
    And the images should be served via CloudFront CDN

  Scenario: Filter products by mythology type
    Given the catalog contains Hindu and Greek mythology products
    When I select "Hindu" mythology filter
    Then I should only see products tagged with Hindu mythology
    And the filter should use DynamoDB GSI1 for efficient querying

  Scenario: Filter products by size
    When I select size "L" filter
    Then I should only see products available in size "L"
    And out-of-stock sizes should be indicated

  Scenario: Filter products by color
    When I select color "Navy" from the 30 standard colors
    Then I should only see products available in Navy color
    And the color selector should display all 30 standard options

  Scenario: Filter products by price range
    When I set price range filter to "$15 - $30"
    Then I should only see products priced between $15 and $30
    And the results should use DynamoDB GSI2 for category+price queries

  Scenario: Filter products by art style
    When I select "Modern" art style filter
    Then I should only see products with modern art style
    When I select "Anime" art style filter
    Then I should only see products with anime art style

  Scenario: Combine multiple filters
    When I select "Greek" mythology filter
    And I select size "M" filter
    And I select color "Black" filter
    Then I should see only Greek mythology products in size M and Black color
    And the filter count should be displayed

  Scenario: Clear all filters
    Given I have applied multiple filters
    When I click "Clear All Filters"
    Then all filters should be removed
    And I should see the full product catalog

  Scenario: Products display correctly on mobile
    Given I am viewing the catalog on a mobile device
    Then the product grid should be responsive
    And products should display in a single column layout
    And images should be optimized for mobile

  Scenario: Pagination for large catalogs
    Given the catalog contains more than 20 products
    When I scroll to the bottom of the page
    Then the next page of products should load automatically
    And the scroll position should be maintained
