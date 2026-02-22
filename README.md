# EpicWeave

> AI-Powered Custom T-Shirt E-Commerce Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

EpicWeave is a browser-based e-commerce platform combining AI-powered image generation with custom apparel shopping. Users can browse pre-designed mythology-themed clothing or create custom designs through guided AI chat sessions using OpenAI DALL-E.

## 🎯 Features

- 🛍️ **Pre-Designed Catalog** - Browse Hindu & Greek mythology-themed t-shirts
- 🎨 **AI Custom Designs** - Create unique designs with DALL-E in modern/anime styles
- 💳 **Secure Payments** - Stripe integration for session fees and orders
- 🔐 **Authentication** - AWS Cognito with OAuth (Google/GitHub)
- 📦 **Order Management** - Full order tracking and in-house fulfillment
- ⚙️ **Admin Controls** - Configurable pricing, inventory, and settings

## 🏗️ Architecture

**Tech Stack:** AWS Serverless

- **Frontend:** Next.js 16, React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** AWS Lambda, API Gateway (HTTP API)
- **Database:** DynamoDB (single-table design)
- **Auth:** AWS Cognito (User Pools + OAuth)
- **AI:** OpenAI DALL-E via SQS + Lambda workers
- **Payments:** Stripe
- **Storage:** S3 + CloudFront
- **Email:** AWS SES
- **Config:** Parameter Store, Secrets Manager
- **IaC:** AWS CDK (TypeScript)

## 📁 Project Structure

```
epicweave/
├── frontend/           # Next.js React application
├── backend/
│   ├── cdk/           # AWS CDK infrastructure code
│   └── lambda/        # Lambda function handlers
├── tests/             # BDD/TDD test suite
│   ├── features/      # Gherkin scenarios
│   ├── step-definitions/
│   ├── unit/          # Vitest unit tests
│   ├── e2e/           # Playwright E2E tests
│   └── load/          # k6 load tests
└── docs/              # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (required for Next.js 16)
- AWS Account
- Stripe Account
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/domala81/EpicWeave.git
cd EpicWeave

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your AWS/Stripe credentials
```

### Development

```bash
# Run frontend dev server
npm run dev:frontend

# Watch CDK changes
npm run dev:cdk

# Run all tests
npm test

# Run BDD tests only
npm run test:bdd
```

### Deployment

```bash
# Deploy AWS infrastructure
npm run deploy:cdk

# Build and deploy frontend
npm run build:frontend
```

## 🧪 Testing

This project follows **BDD/TDD** principles:

- **Cucumber.js** - Behavior-driven development scenarios
- **Vitest** - Unit tests for Lambda handlers
- **Playwright** - End-to-end browser tests
- **k6** - Load and performance tests

See [tests/README.md](./tests/README.md) for details.

## 💰 Business Model

- **Session Fee:** $2.00 (configurable, non-refundable)
- **Custom T-Shirts:** Base $20.00 (configurable)
- **Pre-Designed:** Varies per product
- **Max AI Iterations:** 5 per session (configurable)
- **Session Expiry:** 1 hour (configurable)

All pricing and limits are admin-configurable via AWS Parameter Store.

## 🎨 Design Session Flow

1. User pays $2 session fee
2. Selects art style (modern or anime)
3. Enters mythology-themed prompts
4. AI generates 1024x1024 images via DALL-E
5. User iterates (up to 5 times)
6. Selects color, size, placement
7. Adds to cart with calculated pricing

## 📚 Documentation

- [Intent Document](./docs/INTENT.md) - Full requirements and architecture
- [Windsurf Workflow](./docs/WINDSURF_WORKFLOW.md) - Implementation phases
- [API Documentation](./docs/API.md) - API endpoints (coming soon)

## 🛣️ Roadmap

- [x] Phase 1: Foundation & Infrastructure
- [ ] Phase 2: Catalog & Inventory
- [ ] Phase 3: AI Design Sessions
- [ ] Phase 4: Cart & Checkout
- [ ] Phase 5: Order Management & Admin
- [ ] Phase 6: Admin Configuration
- [ ] Phase 7: Security & Load Testing

## 🤝 Contributing

This is a private project. For questions, contact the maintainer.

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

## 👨‍💻 Author

**Domala81**

- GitHub: [@domala81](https://github.com/domala81)

---

Built with ❤️ using AWS Serverless, Next.js, and AI
