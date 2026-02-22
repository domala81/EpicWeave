# EpicWeave - BDD/TDD Test Suite

Comprehensive test suite following Behavior-Driven Development and Test-Driven Development principles.

## Test Structure

```
tests/
├── features/               # Gherkin BDD scenarios
│   ├── functional/         # Feature tests
│   │   ├── auth/          # Authentication & authorization
│   │   ├── catalog/       # Product browsing
│   │   ├── design-session/# AI design generation
│   │   ├── cart/          # Shopping cart
│   │   ├── checkout/      # Order placement
│   │   ├── orders/        # Order management
│   │   └── admin/         # Admin features
│   ├── non-functional/    # Performance, security, availability
│   └── load/              # Load & stress tests
├── step-definitions/      # Cucumber step implementations
├── support/               # Test helpers & world setup
├── unit/                  # Vitest unit tests
├── e2e/                   # Playwright end-to-end tests
└── load/                  # k6 load test scripts
```

## Running Tests

```bash
# All tests
npm test

# BDD scenarios only
npm run test:bdd

# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Load tests
npm run test:load

# With coverage
npm run test:coverage
```

## Feature Files Created

### Functional Tests
- ✅ `auth/registration.feature` - User sign-up with Cognito
- ✅ `auth/login.feature` - Authentication & OAuth
- ✅ `catalog/browse-products.feature` - Product browsing with filters
- ✅ `design-session/session-payment.feature` - $2 session fee payment
- ✅ `design-session/image-generation.feature` - DALL-E AI generation
- ✅ `cart/add-to-cart.feature` - Cart management
- ✅ `checkout/payment-processing.feature` - Stripe checkout

### Non-Functional Tests
- ✅ `performance/api-response-time.feature` - Latency targets

## Environment Variables

Set these before running tests:

```bash
API_ENDPOINT=https://api.epicweave.com
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=EpicWeaveTable-dev
AWS_REGION=us-east-1
```

## Next Steps

1. Install dependencies: `npm install`
2. Implement step definitions in `step-definitions/`
3. Run tests: `npm run test:bdd`
4. Watch tests fail (TDD red phase)
5. Implement features
6. Watch tests pass (TDD green phase)
