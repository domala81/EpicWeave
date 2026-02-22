# EpicWeave — Windsurf Workflow Implementation Approach

> Extracted from [INTENT.md](./INTENT.md) Section 8.
> Each phase follows BDD/TDD: write feature files → write failing tests → implement → pass tests.

---

## Phase 1: Foundation & Infrastructure

1. **Project scaffolding** — Next.js frontend (React + TailwindCSS + shadcn/ui), AWS CDK (TypeScript) for IaC
2. **AWS CDK stack** — DynamoDB table (EpicWeaveTable + GSIs), S3 buckets, CloudFront distribution, API Gateway (HTTP API), Cognito User Pool, SQS queues, Parameter Store defaults, Secrets Manager placeholders
3. **Authentication** — Cognito User Pool with email/password + OAuth (Google, GitHub), post-confirmation Lambda trigger to create DynamoDB user profile, Cognito authorizer on API Gateway
4. **BDD test harness** — Cucumber.js + Vitest + Playwright setup, AWS SDK mocks (aws-sdk-client-mock), k6 config

---

## Phase 2: Catalog & Inventory

5. **Product Lambda functions** — GET /products (list + filter via GSIs), GET /products/:id (detail + variants)
6. **Product listing page** — React page with filters (mythology, size, color, price, style), CloudFront image delivery
7. **Product detail page** — Image gallery, 30-color selector, size selector, add-to-cart button
8. **Admin inventory management** — Lambda CRUD for products + variants, admin-only routes (Cognito group check)
9. **Seed data** — Lambda or script to populate DynamoDB with pre-designed products

---

## Phase 3: AI Design Sessions

10. **Session fee payment** — Lambda: create Stripe PaymentIntent ($2), on success create DesignSession in DynamoDB with TTL
11. **Chat UI** — React conversational interface, art style selector (modern/anime), prompt input
12. **Content rule enforcement** — Lambda: mythology keyword check (from Parameter Store), style enforcement, safety filter
13. **AI image generation pipeline** — Lambda → SQS → Lambda worker → DALL-E API → S3 upload → DynamoDB message insert
14. **T-shirt mockup preview** — React component: overlay design on t-shirt template, 30-color picker, size selector, print placement (front/back/both)
15. **Design-to-cart flow** — Lambda: calculate price (base × complexity × size + placement surcharge from Parameter Store), add CartItem to DynamoDB

---

## Phase 4: Cart & Checkout

16. **Cart management** — Lambda CRUD: GET /cart, POST /cart/items, PATCH /cart/items/:id, DELETE /cart/items/:id (DynamoDB)
17. **Checkout flow** — React: shipping address form (US only), Stripe Elements, order summary with flat-rate + carrier shipping
18. **Order creation** — Lambda: DynamoDB TransactWriteItems (order + items + payment + stock decrement + cart clear)
19. **Order confirmation** — SES email via Lambda, React confirmation page

---

## Phase 5: Order Management & Admin

20. **Customer order history** — Lambda: GET /orders (query DynamoDB PK=USER#), React order list + detail pages
21. **Admin order dashboard** — Lambda: GET /admin/orders?status= (GSI2), PATCH status transitions, React admin panel
22. **In-house fulfillment workflow** — Admin: mark processing → enter tracking → mark shipped (SES notification) → mark delivered
23. **Refund/cancellation** — Lambda: Stripe Refund API (order payments only, not session fees), DynamoDB atomic update + stock restore

---

## Phase 6: Admin Configuration

24. **Parameter Store management** — Lambda: GET/PUT /admin/config (read/write Parameter Store values), React admin config page
25. **Dynamic pricing** — All pricing reads from Parameter Store (session fee, base price, surcharges, complexity multipliers)

---

## Phase 7: Non-Functional, Security & Load Testing

26. **Performance tests** — k6 scripts against API Gateway (page load, API response, AI generation latency)
27. **Security hardening** — AWS WAF rules on CloudFront + API Gateway, Cognito advanced security, input sanitization
28. **Observability** — CloudWatch Logs + X-Ray tracing on all Lambdas, CloudWatch Alarms (error rate, DLQ depth, latency), dashboard
29. **Load tests** — k6: 500 concurrent users, 50 TPS checkout, SQS queue depth under AI load
