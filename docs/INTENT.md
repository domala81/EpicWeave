# EpicWeave — E-Commerce Application Intent Document

> **Project Codename:** EpicWeave
> **Platform:** Browser-based Web Application
> **Date:** 2026-02-16
> **Version:** 0.2.0
> **Status:** Requirements Finalized

---

## 1. Vision Statement

EpicWeave is a browser-based e-commerce platform that combines AI-powered image generation with custom apparel shopping. Users can browse pre-designed mythology-themed clothing **or** create their own designs through guided AI chat sessions — choosing Hindu or Greek mythology motifs rendered in modern/anime art styles — and have them printed on t-shirts.

**Key business decisions:**

- **Currency:** USD only
- **AI Provider:** OpenAI DALL-E
- **Mythology scope:** Hindu & Greek (architected for future expansion)
- **Fulfillment:** In-house printing, admin manages inventory and shipping
- **Shipping:** US domestic only (expandable to international), flat rate + real-time carrier rates
- **Infrastructure:** AWS serverless stack with Stripe for payments
- **Session fee:** $2 default (admin-configurable)
- **Session fee refundability:** Non-refundable
- **T-shirt colors:** 30 standard color options

---

## 2. Functional Requirements

### 2.1 User Authentication (FR-AUTH)

| ID         | Requirement                                                                             |
| ---------- | --------------------------------------------------------------------------------------- |
| FR-AUTH-01 | Users can register with email/password or OAuth (Google, GitHub)                        |
| FR-AUTH-02 | Users can log in and receive a session token (JWT)                                      |
| FR-AUTH-03 | Users can log out, invalidating their session                                           |
| FR-AUTH-04 | Users can reset their password via email link                                           |
| FR-AUTH-05 | Users have a profile page displaying order history, saved designs, and account settings |
| FR-AUTH-06 | Role-based access: `customer`, `admin`                                                  |

### 2.2 Inventory & Product Catalog (FR-INV)

| ID        | Requirement                                                                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-INV-01 | The system maintains a catalog of pre-designed mythology-themed t-shirts                                                                                                                                                                   |
| FR-INV-02 | Each product has: name, description, images, price (varies per product, preloaded in DB), available sizes (S/M/L/XL/XXL), available colors (from 30 standard options), stock count, category tags (Hindu/Greek, character/item), art style |
| FR-INV-03 | Users can browse products with filtering (mythology type, price range, size, color, art style) and sorting (price, newest, popularity)                                                                                                     |
| FR-INV-04 | Users can view a product detail page with image gallery, size selector, color selector (30 standard colors), and add-to-cart action                                                                                                        |
| FR-INV-05 | Admin can perform CRUD operations on inventory items                                                                                                                                                                                       |
| FR-INV-06 | Stock is decremented on successful order placement and restored on cancellation/refund                                                                                                                                                     |

### 2.3 AI Design Chat Session (FR-CHAT)

| ID         | Requirement                                                                                                                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| FR-CHAT-01 | Users can initiate a new AI design session by paying a session fee (default $2 USD, admin-configurable)                                                                                                                                                                                      |
| FR-CHAT-02 | Each session is a conversational interface (similar to ChatGPT)                                                                                                                                                                                                                              |
| FR-CHAT-03 | The session begins with the user providing a text prompt describing their desired design                                                                                                                                                                                                     |
| FR-CHAT-04 | The system generates an image based on the prompt, subject to content rules (see FR-CHAT-07)                                                                                                                                                                                                 |
| FR-CHAT-05 | The user can request modifications to the generated image via follow-up prompts                                                                                                                                                                                                              |
| FR-CHAT-06 | Each modification regenerates or edits the image according to the new instructions                                                                                                                                                                                                           |
| FR-CHAT-07 | **Content Rules:** (a) Images must depict characters, items, or scenes from Hindu or Greek mythology only (architected for future mythology expansion). (b) User explicitly chooses art style: "modern" or "anime". (c) Prompts violating mythology rules are rejected with a clear message. |
| FR-CHAT-08 | Once satisfied, the user sees the design mockup on a t-shirt preview                                                                                                                                                                                                                         |
| FR-CHAT-09 | The user selects a print placement option: **front-only**, **back-only**, or **both** (front and back)                                                                                                                                                                                       |
| FR-CHAT-10 | The user can choose to: (a) **Accept** the design and proceed to add-to-cart, or (b) **Modify again** and return to the prompt step                                                                                                                                                          |
| FR-CHAT-11 | Session history (prompts + generated images) is persisted and viewable from the user profile                                                                                                                                                                                                 |
| FR-CHAT-12 | A session has a maximum of 5 generation/modification iterations (admin-configurable)                                                                                                                                                                                                         |
| FR-CHAT-13 | A session expires after 1 hour of inactivity (admin-configurable TTL)                                                                                                                                                                                                                        |
| FR-CHAT-14 | The session fee is non-refundable                                                                                                                                                                                                                                                            |
| FR-CHAT-15 | User selects t-shirt color (from 30 standard options) during the design preview step                                                                                                                                                                                                         |     |

### 2.4 Shopping Cart & Checkout (FR-CART)

| ID         | Requirement                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| FR-CART-01 | Users can add pre-designed products or custom-designed t-shirts to a cart                                                        |
| FR-CART-02 | Cart displays line items with: thumbnail, name/description, size, print placement (for custom), quantity, unit price, line total |
| FR-CART-03 | Users can update quantity or remove items from the cart                                                                          |
| FR-CART-04 | Cart persists across sessions (server-side for authenticated users)                                                              |
| FR-CART-05 | Checkout collects shipping address and payment information                                                                       |
| FR-CART-06 | Order summary is displayed before final confirmation                                                                             |
| FR-CART-07 | On confirmation, payment is processed and an order is created                                                                    |

### 2.5 Pricing (FR-PRICE)

| ID          | Requirement                                                                                                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| FR-PRICE-01 | Pre-designed t-shirts have a per-product price (preloaded in inventory database, varies per product)                                                                                                                                                                        |
| FR-PRICE-02 | Custom-designed t-shirts have a base price of $20 USD (admin-configurable), with pricing factors: size, color, and design complexity (low/medium/high — determined by AI generation parameters). Print placement surcharge for "both" (front + back) is admin-configurable. |
| FR-PRICE-03 | AI design session has a flat access fee of $2 USD (admin-configurable) charged before the session begins                                                                                                                                                                    |
| FR-PRICE-04 | All prices displayed in USD. Tax shown separately at checkout.                                                                                                                                                                                                              |
| FR-PRICE-05 | Shipping cost = flat rate base + real-time carrier rate (US domestic only, expandable to international)                                                                                                                                                                     |     |

### 2.6 Payment Processing (FR-PAY)

| ID        | Requirement                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------- | --- |
| FR-PAY-01 | Integration with Stripe for card payments (new Stripe account to be set up)                                 |
| FR-PAY-02 | Session fee ($2 default) is charged as a separate non-refundable transaction before the chat session starts |
| FR-PAY-03 | Order payment is charged at checkout                                                                        |
| FR-PAY-04 | Payment failures are handled gracefully with retry options                                                  |
| FR-PAY-05 | Refund capability for cancelled orders (admin-initiated, excludes session fees)                             |     |

### 2.7 Order Management (FR-ORD)

| ID        | Requirement                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ | --- |
| FR-ORD-01 | Orders have statuses: `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded` |
| FR-ORD-02 | Users can view order history and individual order details from their profile                           |
| FR-ORD-03 | Admin can view all orders, update statuses, and initiate refunds                                       |
| FR-ORD-04 | Admin handles in-house printing and updates inventory/order status when ready to ship                  |
| FR-ORD-05 | Admin enters tracking number when shipping; system sends shipping notification via AWS SES             |     |

---

## 3. Non-Functional Requirements

### 3.1 Performance (NFR-PERF)

| ID          | Requirement                              | Target                        |
| ----------- | ---------------------------------------- | ----------------------------- |
| NFR-PERF-01 | Page load time (catalog, product detail) | < 2 seconds (P95)             |
| NFR-PERF-02 | API response time (auth, cart, checkout) | < 500ms (P95)                 |
| NFR-PERF-03 | AI image generation latency              | < 30 seconds per generation   |
| NFR-PERF-04 | AI image modification latency            | < 20 seconds per modification |
| NFR-PERF-05 | Concurrent users supported               | 500 simultaneous users        |
| NFR-PERF-06 | Transactions per second (checkout)       | 50 TPS                        |

### 3.2 Availability (NFR-AVAIL)

| ID           | Requirement                                       | Target                         |
| ------------ | ------------------------------------------------- | ------------------------------ |
| NFR-AVAIL-01 | Application uptime                                | 99.5% monthly                  |
| NFR-AVAIL-02 | Graceful degradation if AI service is unavailable | Catalog/cart remain functional |

### 3.3 Security (NFR-SEC)

| ID         | Requirement                                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
| NFR-SEC-01 | All traffic over HTTPS                                                               |
| NFR-SEC-02 | Password management delegated to AWS Cognito (SRP protocol, no raw passwords stored) |
| NFR-SEC-03 | Cognito-issued JWT tokens with short expiry + refresh token rotation                 |
| NFR-SEC-04 | Input sanitization to prevent XSS and NoSQL injection                                |
| NFR-SEC-05 | PCI-DSS compliance delegated to payment gateway (no raw card data stored)            |
| NFR-SEC-06 | Rate limiting via API Gateway throttling on auth endpoints and AI session creation   |
| NFR-SEC-07 | AWS WAF on CloudFront and API Gateway for DDoS protection                            |

### 3.4 Scalability (NFR-SCALE)

| ID           | Requirement                                                                        |
| ------------ | ---------------------------------------------------------------------------------- |
| NFR-SCALE-01 | Stateless Lambda functions with automatic scaling (no server management)           |
| NFR-SCALE-02 | AI generation requests queued via SQS to manage throughput and decouple processing |
| NFR-SCALE-03 | Image assets served via CloudFront CDN                                             |
| NFR-SCALE-04 | DynamoDB on-demand capacity mode for automatic read/write scaling                  |

### 3.5 Observability (NFR-OBS)

| ID         | Requirement                                                                     |
| ---------- | ------------------------------------------------------------------------------- |
| NFR-OBS-01 | Structured logging via CloudWatch Logs for all Lambda functions and API Gateway |
| NFR-OBS-02 | AWS X-Ray distributed tracing across Lambda, API Gateway, DynamoDB, and SQS     |
| NFR-OBS-03 | CloudWatch Alarms for error rates, latency, and DLQ depth                       |
| NFR-OBS-04 | CloudWatch dashboards for real-time operational visibility                      |

---

## 4. Architecture Requirements

### 4.1 Technology Stack (AWS Serverless)

| Layer                   | Technology                                                      | AWS Service                                          |
| ----------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| **Frontend**            | React 18+ (Next.js), TypeScript, TailwindCSS, shadcn/ui         | S3 + CloudFront (static hosting)                     |
| **State Management**    | Zustand                                                         | — (client-side)                                      |
| **Backend API**         | TypeScript (Lambda handlers)                                    | AWS Lambda + API Gateway (HTTP API)                  |
| **Database**            | NoSQL document store                                            | Amazon DynamoDB (on-demand mode)                     |
| **AI Image Generation** | OpenAI DALL-E API                                               | Lambda (caller) → SQS (queue) → Lambda (worker)      |
| **Payment Gateway**     | Stripe                                                          | Lambda integration + Stripe webhooks via API Gateway |
| **Authentication**      | AWS Cognito (User Pools + Identity Pools)                       | Cognito with OAuth (Google, GitHub)                  |
| **File/Image Storage**  | S3 buckets (generated images, product images)                   | Amazon S3                                            |
| **CDN**                 | CloudFront distribution                                         | Amazon CloudFront                                    |
| **Async Job Queue**     | SQS + Dead Letter Queue                                         | Amazon SQS (Standard queues)                         |
| **Orchestration**       | Step Functions (order fulfillment workflow)                     | AWS Step Functions                                   |
| **Email**               | Transactional email (order confirmation, shipping)              | Amazon SES                                           |
| **Secrets Management**  | API keys (Stripe, OpenAI)                                       | AWS Secrets Manager                                  |
| **Configuration**       | Admin-configurable settings (session fee, max iterations, etc.) | AWS Systems Manager Parameter Store                  |
| **Security**            | WAF rules, DDoS protection                                      | AWS WAF + Shield                                     |
| **Monitoring**          | Logs, traces, metrics, alarms                                   | CloudWatch + X-Ray                                   |
| **IaC**                 | Infrastructure as Code                                          | AWS CDK (TypeScript) or AWS SAM                      |
| **Testing**             | Vitest (unit), Playwright (E2E), Cucumber.js (BDD), k6 (load)   | — (CI pipeline)                                      |
| **CI/CD**               | GitHub Actions → deploy via CDK/SAM                             | —                                                    |

### 4.2 System Architecture (High-Level — AWS Serverless)

```
                              ┌──────────────────────────────────────────┐
                              │              AWS Cloud                    │
                              │                                          │
┌─────────────┐    ┌─────────▼──────────┐                               │
│   Browser    │───▶│   CloudFront CDN   │                               │
│   (React)    │◀───│   + S3 (Static)    │                               │
└─────────────┘    └─────────┬──────────┘                               │
                              │                                          │
                   ┌──────────▼──────────┐    ┌──────────────────┐      │
                   │   API Gateway        │───▶│   AWS Cognito     │      │
                   │   (HTTP API)         │    │   (Auth/JWT)      │      │
                   └──────────┬──────────┘    └──────────────────┘      │
                              │                                          │
              ┌───────────────┼───────────────────┐                     │
              │               │                   │                     │
    ┌─────────▼────┐ ┌───────▼───────┐ ┌─────────▼──────┐             │
    │  Lambda       │ │  Lambda        │ │  Lambda         │             │
    │  (API Fns)    │ │  (Stripe       │ │  (Admin Fns)    │             │
    │  Cart/Order/  │ │   Webhooks)    │ │  Config/CRUD    │             │
    │  Catalog      │ │               │ │                 │             │
    └───────┬──────┘ └───────┬───────┘ └────────┬────────┘             │
            │                │                   │                      │
            ▼                ▼                   ▼                      │
    ┌──────────────────────────────────────────────────┐               │
    │                  DynamoDB                         │               │
    │  (Users, Products, Sessions, Cart, Orders, Pay)  │               │
    └──────────────────────────────────────────────────┘               │
                              │                                         │
              ┌───────────────┼──────────────────┐                     │
              │               │                  │                     │
    ┌─────────▼────┐ ┌───────▼───────┐ ┌────────▼────────┐           │
    │  SQS Queue    │ │  S3 Bucket    │ │  SES             │           │
    │  (AI Jobs)    │ │  (Images)     │ │  (Email)         │           │
    └───────┬──────┘ └──────▲────────┘ └──────────────────┘           │
            │               │                                          │
    ┌───────▼──────┐        │                                          │
    │  Lambda       │────────┘    ┌──────────────────┐                 │
    │  (AI Worker)  │             │  Step Functions    │                 │
    │  → DALL-E API │             │  (Order            │                 │
    └──────────────┘             │   Fulfillment)     │                 │
                                  └──────────────────┘                 │
              ┌──────────────────────────────────────┐                 │
              │  Parameter Store    │  Secrets Manager │                 │
              │  (Admin Config)     │  (API Keys)      │                 │
              └──────────────────────────────────────┘                 │
                              │                                         │
                              │  ┌──────────────────────┐              │
                              └──│  CloudWatch + X-Ray   │              │
                                 │  (Logs/Traces/Alarms) │              │
                                 └──────────────────────┘              │
                              └──────────────────────────────────────────┘

External Services:
  ┌──────────┐    ┌──────────────┐
  │  Stripe   │    │  OpenAI       │
  │  (Pay)    │    │  DALL-E API   │
  └──────────┘    └──────────────┘
```

### 4.3 Admin-Configurable Settings (via Parameter Store)

| Parameter                                         | Default       | Description                                          |
| ------------------------------------------------- | ------------- | ---------------------------------------------------- |
| `/EpicWeave/pricing/session-fee`                  | `2.00`        | AI design session fee (USD)                          |
| `/EpicWeave/pricing/custom-tshirt-base`           | `20.00`       | Base price for custom t-shirt (USD)                  |
| `/EpicWeave/pricing/both-placement-surcharge`     | `8.00`        | Surcharge for front+back printing (USD)              |
| `/EpicWeave/pricing/complexity-multiplier-low`    | `1.0`         | Price multiplier for low complexity                  |
| `/EpicWeave/pricing/complexity-multiplier-medium` | `1.3`         | Price multiplier for medium complexity               |
| `/EpicWeave/pricing/complexity-multiplier-high`   | `1.6`         | Price multiplier for high complexity                 |
| `/EpicWeave/session/max-iterations`               | `5`           | Max generation/modification attempts per session     |
| `/EpicWeave/session/ttl-minutes`                  | `60`          | Session expiry in minutes                            |
| `/EpicWeave/ai/image-resolution`                  | `1024x1024`   | DALL-E output resolution (print quality)             |
| `/EpicWeave/shipping/flat-rate-base`              | `5.99`        | Base flat rate for shipping (USD)                    |
| `/EpicWeave/mythology/allowed-types`              | `hindu,greek` | Comma-separated allowed mythology types (expandable) |

---

## 5. Data Architecture (DynamoDB Single-Table Design)

DynamoDB uses a single-table design with composite keys. All entities share one table (`EpicWeaveTable`) with a partition key (`PK`) and sort key (`SK`). Global Secondary Indexes (GSIs) enable alternate access patterns.

### 5.1 Table Schema

**Table:** `EpicWeaveTable`

- **PK** (Partition Key): String
- **SK** (Sort Key): String
- **GSI1PK / GSI1SK**: For alternate queries (e.g., email lookup, order-by-status)
- **GSI2PK / GSI2SK**: For additional access patterns (e.g., product filtering)

### 5.2 Entity Definitions

#### Users (managed by Cognito, profile data in DynamoDB)

```
PK: USER#<userId>
SK: PROFILE

Attributes:
  userId          String (matches Cognito sub)
  email           String (unique, indexed via GSI1)
  name            String
  role            String ('customer' | 'admin')
  createdAt       String (ISO 8601)
  updatedAt       String (ISO 8601)

GSI1PK: EMAIL#<email>
GSI1SK: USER
```

#### Products (Pre-designed Inventory)

```
PK: PRODUCT#<productId>
SK: METADATA

Attributes:
  productId       String (ULID)
  name            String
  description     String
  price           Number (varies per product, preloaded)
  mythology       String ('hindu' | 'greek')
  artStyle        String
  category        String
  availableColors List<String> (subset of 30 standard colors)
  images          List<Map> [{url, altText, sortOrder}]
  isActive        Boolean
  createdAt       String (ISO 8601)
  updatedAt       String (ISO 8601)

GSI1PK: MYTHOLOGY#<mythology>
GSI1SK: PRODUCT#<productId>

GSI2PK: CATEGORY#<category>
GSI2SK: PRICE#<price>
```

#### Product Variants (Size + Color + Stock)

```
PK: PRODUCT#<productId>
SK: VARIANT#<size>#<color>

Attributes:
  sku             String (unique)
  size            String ('S' | 'M' | 'L' | 'XL' | 'XXL')
  color           String (one of 30 standard colors)
  stockCount      Number
  updatedAt       String (ISO 8601)
```

#### AI Design Sessions

```
PK: USER#<userId>
SK: SESSION#<sessionId>

Attributes:
  sessionId       String (ULID)
  sessionFeeTxnId String (Payment ID)
  status          String ('active' | 'completed' | 'expired')
  artStyleChoice  String ('modern' | 'anime')
  iterationCount  Number (default 0)
  maxIterations   Number (from Parameter Store, default 5)
  ttlMinutes      Number (from Parameter Store, default 60)
  expiresAt       Number (Unix epoch — DynamoDB TTL attribute)
  createdAt       String (ISO 8601)
  updatedAt       String (ISO 8601)

GSI1PK: SESSION#<sessionId>
GSI1SK: USER#<userId>
```

#### Design Messages (within a session)

```
PK: SESSION#<sessionId>
SK: MSG#<timestamp>#<messageId>

Attributes:
  messageId       String (ULID)
  role            String ('user' | 'assistant' | 'system')
  content         String (prompt text)
  imageUrl        String (S3 URL, nullable)
  createdAt       String (ISO 8601)
```

#### Cart (one cart per user)

```
PK: USER#<userId>
SK: CART#ITEM#<cartItemId>

Attributes:
  cartItemId      String (ULID)
  productId       String (nullable — for pre-designed)
  variantSk       String (nullable — "VARIANT#<size>#<color>")
  sessionId       String (nullable — for custom designs)
  size            String ('S' | 'M' | 'L' | 'XL' | 'XXL')
  color           String
  printPlacement  String ('front' | 'back' | 'both')
  quantity        Number (default 1)
  unitPrice       Number
  designImageUrl  String (nullable)
  createdAt       String (ISO 8601)
```

#### Orders

```
PK: USER#<userId>
SK: ORDER#<orderId>

Attributes:
  orderId         String (ULID)
  status          String ('pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded')
  subtotal        Number
  tax             Number
  shippingCost    Number
  total           Number
  shippingAddress Map {name, line1, line2, city, state, zip, country}
  trackingNumber  String (nullable)
  createdAt       String (ISO 8601)
  updatedAt       String (ISO 8601)

GSI1PK: ORDER#<orderId>
GSI1SK: USER#<userId>

GSI2PK: ORDER_STATUS#<status>
GSI2SK: ORDER#<orderId>
```

#### Order Items

```
PK: ORDER#<orderId>
SK: ITEM#<orderItemId>

Attributes:
  orderItemId     String (ULID)
  productId       String (nullable)
  sessionId       String (nullable)
  size            String
  color           String
  printPlacement  String ('front' | 'back' | 'both')
  quantity        Number
  unitPrice       Number
  lineTotal       Number
  designImageUrl  String (nullable)
```

#### Payments

```
PK: USER#<userId>
SK: PAYMENT#<paymentId>

Attributes:
  paymentId       String (ULID)
  orderId         String (nullable — null for session fees)
  stripePaymentId String
  amount          Number
  currency        String ('USD')
  status          String ('pending' | 'succeeded' | 'failed' | 'refunded')
  type            String ('session_fee' | 'order_payment' | 'refund')
  createdAt       String (ISO 8601)

GSI1PK: PAYMENT#<stripePaymentId>
GSI1SK: USER#<userId>
```

### 5.3 DynamoDB Access Patterns

| Access Pattern               | Key Condition                                         |
| ---------------------------- | ----------------------------------------------------- |
| Get user profile by ID       | PK=`USER#<id>`, SK=`PROFILE`                          |
| Get user by email            | GSI1: PK=`EMAIL#<email>`, SK=`USER`                   |
| List products by mythology   | GSI1: PK=`MYTHOLOGY#hindu`, SK begins_with `PRODUCT#` |
| Get product + all variants   | PK=`PRODUCT#<id>`, SK begins_with `VARIANT#`          |
| Get user's cart items        | PK=`USER#<id>`, SK begins_with `CART#ITEM#`           |
| Get user's orders            | PK=`USER#<id>`, SK begins_with `ORDER#`               |
| Get order items              | PK=`ORDER#<id>`, SK begins_with `ITEM#`               |
| Get user's sessions          | PK=`USER#<id>`, SK begins_with `SESSION#`             |
| Get session messages         | PK=`SESSION#<id>`, SK begins_with `MSG#`              |
| Get user's payments          | PK=`USER#<id>`, SK begins_with `PAYMENT#`             |
| Lookup payment by Stripe ID  | GSI1: PK=`PAYMENT#<stripeId>`                         |
| Admin: orders by status      | GSI2: PK=`ORDER_STATUS#<status>`                      |
| Products by category + price | GSI2: PK=`CATEGORY#<cat>`, SK begins_with `PRICE#`    |

### 5.4 Standard T-Shirt Colors (30 Options)

```
Black, White, Navy, Charcoal, Heather Grey, Royal Blue, Red, Burgundy,
Forest Green, Olive, Teal, Sky Blue, Powder Blue, Lavender, Purple,
Hot Pink, Coral, Peach, Mustard, Gold, Cream, Sand, Tan, Rust,
Sage Green, Mint, Slate Blue, Maroon, Burnt Orange, Steel Grey
```

### 5.5 Storage Strategy

| Data Type                                                                | Storage                 | Rationale                                                          |
| ------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------ |
| All application data (users, products, sessions, cart, orders, payments) | DynamoDB (single table) | Serverless, auto-scaling, single-digit ms latency, pay-per-request |
| User authentication & sessions                                           | AWS Cognito             | Managed auth, JWT issuance, OAuth federation, no password storage  |
| Generated images + product images                                        | S3 + CloudFront         | Scalable blob storage, edge delivery via CDN                       |
| AI generation job queue                                                  | SQS + DLQ               | Serverless, decoupled, automatic retry with dead-letter queue      |
| Admin configuration                                                      | Parameter Store         | Centralized, versioned, no redeploy needed to change settings      |
| API keys (Stripe, OpenAI)                                                | Secrets Manager         | Encrypted, rotatable, IAM-controlled access                        |
| Transactional email                                                      | SES                     | Native AWS, cost-effective, deliverability tracking                |

---

## 6. BPMN Business Process Workflow Definition (Text)

Below is the textual BPMN definition describing the end-to-end business processes. Each process is defined with its lanes, events, tasks, gateways, and flows.

---

### Process 1: User Registration & Authentication

**Pool:** EpicWeave Platform
**Lanes:** Customer, Frontend (React), AWS Cognito, Lambda, DynamoDB

```
START EVENT: User visits site
  → TASK [Customer]: Click "Sign Up" or "Log In"
  → EXCLUSIVE GATEWAY: New user or existing?
    ── [New User] ──
      → TASK [Customer]: Fill registration form (email/password or OAuth via Google/GitHub)
      → TASK [Frontend]: Call Cognito SignUp API (Amplify SDK)
      → TASK [Cognito]: Validate input, check duplicate email, create user in User Pool
      → EXCLUSIVE GATEWAY: Validation passed?
        ── [No] → TASK [Cognito]: Return error (UserExistsException / InvalidParameterException)
                 → TASK [Frontend]: Display error message → END EVENT (Error)
        ── [Yes] → TASK [Cognito]: User created, email verification sent
          → TASK [Customer]: Confirm email verification code
          → TASK [Cognito]: Confirm sign-up, issue JWT (id_token + access_token + refresh_token)
          → TASK [Lambda]: Post-confirmation trigger → PUT user profile in DynamoDB
          → TASK [DynamoDB]: INSERT {PK: USER#<id>, SK: PROFILE, role: 'customer'}
          → TASK [Frontend]: Store tokens, redirect to dashboard
          → END EVENT: Registration complete
    ── [Existing User] ──
      → TASK [Customer]: Enter credentials (or click OAuth provider)
      → TASK [Frontend]: Call Cognito InitiateAuth API
      → TASK [Cognito]: Verify credentials (SRP protocol)
      → EXCLUSIVE GATEWAY: Credentials valid?
        ── [No] → TASK [Cognito]: Return NotAuthorizedException → END EVENT (Error)
        ── [Yes] → TASK [Cognito]: Issue JWT (id_token + access_token + refresh_token)
          → TASK [Frontend]: Store tokens, redirect to dashboard
          → END EVENT: Login complete
```

---

### Process 2: Browse & Purchase Pre-Designed Products

**Pool:** EpicWeave Platform
**Lanes:** Customer, Frontend (React), API Gateway, Lambda, DynamoDB, CloudFront

```
START EVENT: User navigates to catalog
  → TASK [Frontend]: Display product listing with filters (mythology, price, size, color, style)
  → TASK [Customer]: Apply filters
  → TASK [Frontend]: Call API Gateway GET /products?mythology=&size=&color=&style=
  → TASK [API Gateway]: Route to Lambda (Cognito authorizer optional for browse)
  → TASK [Lambda]: Query DynamoDB (GSI1 for mythology, GSI2 for category+price)
  → TASK [DynamoDB]: Return matching products
  → TASK [Frontend]: Render filtered product grid (images via CloudFront CDN)
  → TASK [Customer]: Click on a product
  → TASK [Frontend]: Call API Gateway GET /products/<productId>
  → TASK [Lambda]: Query DynamoDB PK=PRODUCT#<id>, SK begins_with VARIANT# (get metadata + all variants)
  → TASK [Frontend]: Display product detail page (images, sizes, 30 colors, price)
  → TASK [Customer]: Select size + color, click "Add to Cart"
  → TASK [Frontend]: Call API Gateway POST /cart/items (with Cognito JWT)
  → TASK [Lambda]: Query DynamoDB for variant PK=PRODUCT#<id>, SK=VARIANT#<size>#<color>
  → EXCLUSIVE GATEWAY: stockCount > 0?
    ── [No] → TASK [Lambda]: Return 409 Conflict
             → TASK [Frontend]: Show "Out of Stock" message → END EVENT
    ── [Yes] → TASK [Lambda]: PUT CartItem in DynamoDB {PK: USER#<id>, SK: CART#ITEM#<ulid>}
      → TASK [Frontend]: Show cart confirmation toast
      → TASK [Customer]: Navigate to cart → (continues to Process 5: Checkout)
      → END EVENT: Item added to cart
```

---

### Process 3: AI Design Chat Session

**Pool:** EpicWeave Platform
**Lanes:** Customer, Frontend (React), API Gateway, Lambda, SQS, Lambda (AI Worker), OpenAI DALL-E, S3, DynamoDB, Stripe, Parameter Store

```
START EVENT: User clicks "Create Custom Design"
  → TASK [Frontend]: Call API Gateway GET /config/session-fee
  → TASK [Lambda]: Read /EpicWeave/pricing/session-fee from Parameter Store → return $2.00
  → TASK [Frontend]: Display session fee ($2.00), terms (non-refundable), art style selector
  → TASK [Customer]: Select art style ("modern" or "anime"), confirm and pay
  → TASK [Frontend]: Call API Gateway POST /sessions/create (with Cognito JWT)
  → TASK [Lambda]: Create Stripe PaymentIntent for session fee ($2.00)
  → TASK [Stripe]: Process session fee payment
  → EXCLUSIVE GATEWAY: Payment successful?
    ── [No] → TASK [Lambda]: Return payment error
             → TASK [Frontend]: Show payment error, offer retry → END EVENT (Error)
    ── [Yes] →
      → TASK [Lambda]: Read max-iterations (5) and ttl-minutes (60) from Parameter Store
      → TASK [DynamoDB]: PUT Payment {PK: USER#<id>, SK: PAYMENT#<ulid>, type: 'session_fee', status: 'succeeded'}
      → TASK [DynamoDB]: PUT DesignSession {PK: USER#<id>, SK: SESSION#<ulid>, status: 'active',
                          artStyleChoice: 'anime', iterationCount: 0, maxIterations: 5,
                          expiresAt: now+60min (DynamoDB TTL)}
      → TASK [Frontend]: Open chat interface

  → SUB-PROCESS: Design Iteration Loop
    │
    │  START EVENT: Chat session active
    │  → TASK [Customer]: Enter text prompt describing desired design
    │  → TASK [Frontend]: Call API Gateway POST /sessions/<sessionId>/generate (with Cognito JWT)
    │  → TASK [Lambda]: Check session not expired (expiresAt > now)
    │  → EXCLUSIVE GATEWAY: Session expired?
    │    ── [Yes] → TASK [Lambda]: UPDATE session status='expired', return 410 Gone
    │              → TASK [Frontend]: Show "Session expired" → END EVENT
    │    ── [No] →
    │      → TASK [Lambda]: Call Content Rule Enforcement (Process 4)
    │      → EXCLUSIVE GATEWAY: Prompt valid?
    │        ── [No] → TASK [Lambda]: Return 422 with rule violation message
    │        │         → TASK [Frontend]: Show "Design must relate to Hindu/Greek mythology"
    │        │         → LOOP BACK to "Enter text prompt"
    │        ── [Yes] →
    │          → TASK [Lambda]: PUT DesignMessage {PK: SESSION#<id>, SK: MSG#<ts>#<ulid>, role: 'user'}
    │          → TASK [Lambda]: Send message to SQS (AI Job Queue) with {sessionId, prompt, artStyle, resolution}
    │          → TASK [Frontend]: Show "Generating design..." spinner
    │          → TASK [SQS]: Deliver message to Lambda (AI Worker)
    │          → TASK [Lambda AI Worker]: Read image-resolution from Parameter Store (1024x1024)
    │          → TASK [Lambda AI Worker]: Call OpenAI DALL-E API with prompt + style enforcement
    │          → TASK [OpenAI DALL-E]: Return generated image
    │          → TASK [Lambda AI Worker]: Upload image to S3 bucket (EpicWeave-designs/<sessionId>/<ulid>.png)
    │          → TASK [Lambda AI Worker]: PUT DesignMessage {PK: SESSION#<id>, SK: MSG#<ts>#<ulid>,
    │                                     role: 'assistant', imageUrl: S3 URL}
    │          → TASK [Lambda AI Worker]: INCREMENT iterationCount on DesignSession
    │          → TASK [Frontend]: Poll/WebSocket receives image URL → display on t-shirt mockup
    │          → TASK [Customer]: Review design on t-shirt preview (with selected color)
    │          → EXCLUSIVE GATEWAY: Satisfied with design?
    │            ── [No — Modify] →
    │            │   → TASK [Frontend]: Call API Gateway to check iterations
    │            │   → TASK [Lambda]: Read session iterationCount vs maxIterations
    │            │   → EXCLUSIVE GATEWAY: iterationCount < maxIterations?
    │            │     ── [No] → TASK [Lambda]: Return 429 "Max iterations reached"
    │            │     │         → TASK [Frontend]: Show "Maximum design iterations reached (5/5)"
    │            │     │         → FORCE proceed to print placement selection
    │            │     ── [Yes] → LOOP BACK to "Enter text prompt"
    │            ── [Yes — Accept] →
    │              → TASK [Customer]: Select t-shirt color (from 30 options)
    │              → TASK [Customer]: Select print placement (front / back / both)
    │              → TASK [Customer]: Select size (S / M / L / XL / XXL)
    │              → TASK [Frontend]: Call API Gateway POST /sessions/<sessionId>/finalize
    │              → TASK [Lambda]: Read pricing config from Parameter Store
    │                (base=$20, complexity multiplier, both-surcharge=$8)
    │              → TASK [Lambda]: Calculate price = base × complexity_multiplier × size_factor + placement_surcharge
    │              → TASK [Lambda]: Return price breakdown to frontend
    │              → TASK [Frontend]: Display price breakdown
    │              → TASK [Customer]: Click "Add to Cart"
    │              → TASK [Frontend]: Call API Gateway POST /cart/items (custom design)
    │              → TASK [Lambda]: PUT CartItem {PK: USER#<id>, SK: CART#ITEM#<ulid>,
    │                               sessionId, color, size, printPlacement, unitPrice, designImageUrl}
    │              → TASK [Lambda]: UPDATE DesignSession status='completed'
    │              → TASK [Frontend]: Show "Design added to cart!" confirmation
    │              → END EVENT: Custom design added to cart
    │
    END SUB-PROCESS
```

---

### Process 4: Content Rule Enforcement (Called Sub-Process)

**Pool:** EpicWeave Platform
**Lanes:** Lambda, Parameter Store

```
START EVENT: Prompt received for validation (called by Process 3 Lambda)
  → TASK [Lambda]: Read /EpicWeave/mythology/allowed-types from Parameter Store → "hindu,greek"
  → TASK [Lambda]: Run keyword/classifier check against allowed mythology types
  → EXCLUSIVE GATEWAY: Contains reference to an allowed mythology type?
    ── [No] → TASK [Lambda]: Return rejection — "Must relate to Hindu or Greek mythology"
             → END EVENT: Rejected
    ── [Yes] →
      → TASK [Lambda]: Read user's art style choice from session (modern/anime)
      → TASK [Lambda]: Construct enhanced prompt with style enforcement
        (e.g., prepend: "Create a [modern|anime]-styled depiction of...")
      → TASK [Lambda]: Run content safety filter (no NSFW, no offensive, no real people)
      → EXCLUSIVE GATEWAY: Passes safety filter?
        ── [No] → TASK [Lambda]: Return rejection — "Content policy violation"
                 → END EVENT: Rejected
        ── [Yes] → END EVENT: Prompt approved + enhanced prompt returned for generation
```

> **Note:** The mythology allowed-types list is stored in Parameter Store, making it trivial
> for admin to expand to Egyptian, Norse, Japanese, etc. without code changes.

---

### Process 5: Checkout & Payment

**Pool:** EpicWeave Platform
**Lanes:** Customer, Frontend (React), API Gateway, Lambda, DynamoDB, Stripe, SES, Parameter Store

```
START EVENT: User navigates to checkout
  → TASK [Frontend]: Call API Gateway GET /cart (with Cognito JWT)
  → TASK [Lambda]: Query DynamoDB PK=USER#<id>, SK begins_with CART#ITEM# → return cart items
  → TASK [Frontend]: Display cart summary (items, quantities, prices, colors, sizes)
  → TASK [Customer]: Review cart, update quantities if needed
  → TASK [Frontend]: Call API Gateway POST /checkout/calculate
  → TASK [Lambda]: Read /EpicWeave/shipping/flat-rate-base from Parameter Store ($5.99)
  → TASK [Lambda]: Calculate totals (subtotal + tax + flat-rate + carrier rate estimate)
  → TASK [Frontend]: Display order summary with total
  → TASK [Customer]: Enter/select US shipping address
  → TASK [Customer]: Enter payment details (Stripe Elements embedded in frontend)
  → TASK [Customer]: Click "Place Order"
  → TASK [Frontend]: Call API Gateway POST /checkout/place-order (with Cognito JWT)
  → TASK [Lambda]: Final stock validation — for each pre-designed item, query DynamoDB
                   PK=PRODUCT#<id>, SK=VARIANT#<size>#<color> → check stockCount
  → EXCLUSIVE GATEWAY: All items available?
    ── [No] → TASK [Lambda]: Return 409 with list of unavailable items
             → TASK [Frontend]: Show unavailable items, prompt removal → LOOP BACK
    ── [Yes] →
      → TASK [Lambda]: Create Stripe PaymentIntent for order total
      → TASK [Stripe]: Process payment
      → EXCLUSIVE GATEWAY: Payment successful?
        ── [No] → TASK [Lambda]: Return payment error
                 → TASK [Frontend]: Show payment error, offer retry → END EVENT (Error)
        ── [Yes] →
          → TASK [Lambda]: DynamoDB TransactWriteItems (atomic batch):
            → PUT Order {PK: USER#<id>, SK: ORDER#<ulid>, status: 'paid', ...}
            → PUT OrderItems {PK: ORDER#<ulid>, SK: ITEM#<ulid>, ...} (one per cart item)
            → PUT Payment {PK: USER#<id>, SK: PAYMENT#<ulid>, type: 'order_payment', status: 'succeeded'}
            → UPDATE each pre-designed ProductVariant: decrement stockCount (ConditionExpression: stockCount > 0)
            → DELETE all CartItems for user (PK: USER#<id>, SK begins_with CART#ITEM#)
          → TASK [Lambda]: Call SES SendEmail → order confirmation to customer
          → TASK [Frontend]: Display order confirmation with order number
          → END EVENT: Order placed successfully
```

---

### Process 6: Order Fulfillment (Admin — In-House Printing)

**Pool:** EpicWeave Platform
**Lanes:** Admin, Frontend (Admin Panel), API Gateway, Lambda, DynamoDB, S3, SES, Step Functions

```
START EVENT: New order with status=paid (Step Functions triggered by DynamoDB Stream or manual)
  → TASK [Admin]: Log in to admin panel (Cognito admin role)
  → TASK [Frontend]: Call API Gateway GET /admin/orders?status=paid
  → TASK [Lambda]: Query DynamoDB GSI2 PK=ORDER_STATUS#paid → return orders
  → TASK [Frontend]: Display order queue
  → TASK [Admin]: Click on order to review details
  → TASK [Frontend]: Call API Gateway GET /admin/orders/<orderId>
  → TASK [Lambda]: Query DynamoDB PK=ORDER#<id>, SK begins_with ITEM# → return order + items
  → TASK [Frontend]: Display order details (items, sizes, colors, print placements, design images)
  → EXCLUSIVE GATEWAY: Contains custom designs?
    ── [Yes] → TASK [Admin]: View/download design files from S3 (via CloudFront signed URL)
             → TASK [Admin]: Print design in-house with specified placement (front/back/both)
    ── [No]  → TASK [Admin]: Pick pre-designed items from inventory
  → TASK [Admin]: Click "Mark as Processing"
  → TASK [Frontend]: Call API Gateway PATCH /admin/orders/<orderId>/status {status: 'processing'}
  → TASK [Lambda]: UPDATE DynamoDB Order status='processing'
                   (also update GSI2: ORDER_STATUS#processing)
  → TASK [Admin]: Complete printing, prepare shipment
  → TASK [Admin]: Enter tracking number, click "Mark as Shipped"
  → TASK [Frontend]: Call API Gateway PATCH /admin/orders/<orderId>/status
                     {status: 'shipped', trackingNumber: '...'}
  → TASK [Lambda]: UPDATE DynamoDB Order status='shipped', trackingNumber='...'
  → TASK [Lambda]: Call SES SendEmail → shipping notification with tracking number to customer
  → INTERMEDIATE EVENT: Wait for delivery confirmation
  → TASK [Admin]: Click "Mark as Delivered"
  → TASK [Frontend]: Call API Gateway PATCH /admin/orders/<orderId>/status {status: 'delivered'}
  → TASK [Lambda]: UPDATE DynamoDB Order status='delivered'
  → TASK [Lambda]: Call SES SendEmail → delivery confirmation to customer
  → END EVENT: Order fulfilled
```

---

### Process 7: Refund / Cancellation

**Pool:** EpicWeave Platform
**Lanes:** Customer, Admin, Frontend, API Gateway, Lambda, DynamoDB, Stripe, SES

> **Rule:** Session fees ($2) are **non-refundable**. Only order payments are eligible for refund.

```
START EVENT: Customer requests cancellation OR Admin initiates refund
  → TASK [Frontend]: Call API Gateway POST /orders/<orderId>/cancel (Customer)
                     OR API Gateway POST /admin/orders/<orderId>/refund (Admin)
  → TASK [Lambda]: Query DynamoDB PK=USER#<id> (or GSI1 PK=ORDER#<id>), get order
  → TASK [Lambda]: Validate order is eligible (status in ['paid', 'processing'])
  → EXCLUSIVE GATEWAY: Eligible for refund?
    ── [No] → TASK [Lambda]: Return 422 "Order cannot be cancelled at this stage"
             → TASK [Frontend]: Display error message → END EVENT
    ── [Yes] →
      → TASK [Lambda]: Query DynamoDB for associated Payment (type='order_payment')
      → TASK [Lambda]: Call Stripe Refunds API (refund order payment only, NOT session fees)
      → TASK [Stripe]: Process refund
      → TASK [Lambda]: DynamoDB TransactWriteItems (atomic):
        → PUT Payment {PK: USER#<id>, SK: PAYMENT#<ulid>, type: 'refund', status: 'succeeded'}
        → UPDATE Order status='refunded'
        → UPDATE each pre-designed ProductVariant: increment stockCount (restore inventory)
      → TASK [Lambda]: Call SES SendEmail → refund confirmation to customer
      → TASK [Frontend]: Display "Refund processed" confirmation
      → END EVENT: Refund processed
```

---

## 7. BDD/TDD Scenario Structure

All scenarios follow Gherkin syntax and are organized by domain.

### 7.1 Directory Structure

```
tests/
├── features/                        # BDD Gherkin feature files
│   ├── functional/
│   │   ├── auth/
│   │   │   ├── registration.feature          # Cognito sign-up, email verification
│   │   │   ├── login.feature                 # Cognito sign-in, OAuth (Google/GitHub)
│   │   │   ├── password-reset.feature        # Cognito forgot-password flow
│   │   │   └── role-access.feature           # Admin vs customer role enforcement
│   │   ├── catalog/
│   │   │   ├── browse-products.feature       # Filters: mythology, size, color, price, style
│   │   │   ├── product-detail.feature        # Image gallery, 30 color options, size selector
│   │   │   └── color-selection.feature       # 30 standard color display and selection
│   │   ├── design-session/
│   │   │   ├── session-payment.feature       # $2 session fee via Stripe (non-refundable)
│   │   │   ├── art-style-selection.feature   # User chooses "modern" or "anime"
│   │   │   ├── prompt-validation.feature     # Hindu/Greek mythology enforcement
│   │   │   ├── image-generation.feature      # DALL-E generation via SQS → Lambda worker
│   │   │   ├── design-modification.feature   # Iterative modifications (max 5)
│   │   │   ├── session-expiry.feature        # 1-hour TTL expiration
│   │   │   ├── print-placement.feature       # Front/back/both selection
│   │   │   ├── color-and-size.feature        # T-shirt color + size selection for custom
│   │   │   └── add-custom-to-cart.feature    # Finalize + pricing + add to cart
│   │   ├── cart/
│   │   │   ├── add-to-cart.feature           # Pre-designed and custom items
│   │   │   ├── update-cart.feature           # Quantity update, remove items
│   │   │   └── cart-persistence.feature      # DynamoDB-backed persistence
│   │   ├── checkout/
│   │   │   ├── checkout-flow.feature         # US shipping address, Stripe Elements
│   │   │   ├── payment-processing.feature    # Stripe PaymentIntent, stock validation
│   │   │   └── shipping-calculation.feature  # Flat rate + carrier rate
│   │   ├── orders/
│   │   │   ├── order-history.feature         # Customer order list + detail
│   │   │   ├── refund.feature                # Admin-initiated refund (excludes session fees)
│   │   │   └── order-fulfillment.feature     # Admin: processing → shipped → delivered
│   │   └── admin/
│   │       ├── inventory-management.feature  # CRUD products, variants, stock
│   │       ├── config-management.feature     # Parameter Store: session fee, max iterations, etc.
│   │       └── order-dashboard.feature       # Filter orders by status, bulk actions
│   ├── non-functional/
│   │   ├── performance/
│   │   │   ├── page-load.feature             # CloudFront + S3 static < 2s
│   │   │   ├── api-response-time.feature     # Lambda cold start + DynamoDB < 500ms
│   │   │   └── ai-generation-latency.feature # SQS → Lambda → DALL-E < 30s
│   │   ├── availability/
│   │   │   ├── graceful-degradation.feature  # AI service down → catalog still works
│   │   │   └── dynamodb-failover.feature     # DynamoDB on-demand scaling under load
│   │   └── security/
│   │       ├── cognito-rate-limiting.feature  # API Gateway throttling
│   │       ├── input-sanitization.feature     # NoSQL injection prevention
│   │       ├── jwt-expiry.feature             # Cognito token rotation
│   │       └── waf-protection.feature         # AWS WAF rules validation
│   └── load/
│       ├── concurrent-users.feature           # 500 simultaneous users
│       ├── checkout-tps.feature               # 50 TPS at checkout
│       ├── ai-session-throughput.feature      # SQS queue depth under load
│       └── dynamodb-throughput.feature        # On-demand capacity scaling
├── step-definitions/                # Cucumber.js step implementations
├── support/                         # Hooks, world, helpers (AWS SDK mocks)
├── unit/                            # Vitest unit tests (Lambda handlers)
├── e2e/                             # Playwright E2E tests
└── load/                            # k6 load test scripts (against API Gateway)
```

### 7.2 Example Functional Scenario

```gherkin
# features/functional/design-session/image-generation.feature

Feature: AI Design Image Generation
  As a customer
  I want to generate a mythology-themed design via AI (OpenAI DALL-E)
  So that I can create a custom t-shirt

  Background:
    Given I am logged in as a customer via Cognito
    And I have paid the $2.00 session fee via Stripe
    And I selected "anime" as my art style
    And I am in an active design session with 5 max iterations

  Scenario: Successfully generate an image from a valid prompt
    When I enter the prompt "Lord Shiva meditating on Mount Kailash"
    Then the system should validate the prompt against content rules
    And the prompt should be enqueued to SQS for DALL-E generation
    And the system should generate an image within 30 seconds
    And the image should be stored in S3
    And I should see the generated image displayed on a t-shirt mockup
    And the session iteration count should be "1 of 5"

  Scenario: Reject a prompt that does not reference Hindu or Greek mythology
    When I enter the prompt "A cool dragon in space"
    Then the system should reject the prompt
    And I should see the message "Design must relate to Hindu or Greek mythology"
    And the session iteration count should not change

  Scenario: Modify an existing design
    Given I have a generated design in the current session
    When I enter the prompt "Make the background a sunset with cherry blossoms"
    Then the system should generate a modified image within 20 seconds
    And I should see the updated image on the t-shirt mockup

  Scenario: Reach maximum iteration limit (5 iterations)
    Given I have used all 5 available iterations in the session
    When I try to enter a new modification prompt
    Then I should see the message "Maximum design iterations reached (5/5)"
    And I should be prompted to select color, size, and print placement

  Scenario: Session expires after 1 hour of inactivity
    Given my session was created 61 minutes ago
    When I try to enter a new prompt
    Then I should see the message "Session expired"
    And the session status should be "expired" in DynamoDB

  Scenario: Select t-shirt color and print placement after accepting design
    Given I have accepted a generated design
    When I select color "Navy" from the 30 standard options
    And I select size "L"
    And I select print placement "both"
    Then I should see a price breakdown showing base $20 + surcharge
    And I should be able to add the custom t-shirt to my cart
```

### 7.3 Example Non-Functional Scenario

```gherkin
# features/non-functional/performance/ai-generation-latency.feature

Feature: AI Image Generation Latency
  As a platform operator
  I need image generation to complete within acceptable time
  So that users have a responsive experience

  Scenario: Image generation completes within SLA
    Given the AI service is healthy
    When 10 concurrent users submit valid design prompts
    Then 95% of image generations should complete within 30 seconds
    And no generation should exceed 60 seconds
```

### 7.4 Example Load Test Scenario

```gherkin
# features/load/checkout-tps.feature

Feature: Checkout Throughput Under Load
  As a platform operator
  I need the checkout system to handle peak traffic
  So that revenue is not lost during high-demand periods

  Scenario: Sustain 50 TPS at checkout
    Given 500 simulated concurrent users with items in cart
    When users proceed to checkout simultaneously over a 60-second window
    Then the system should process at least 50 transactions per second
    And the P95 checkout response time should be under 2 seconds
    And the error rate should be below 1%
```

---

## 8. Windsurf Workflow Implementation Approach

The BPMN processes above map to the following implementation phases for a Windsurf Workflow.
Each phase follows BDD/TDD: write feature files → write failing tests → implement → pass tests.

### Phase 1: Foundation & Infrastructure

1. **Project scaffolding** — Next.js frontend (React + TailwindCSS + shadcn/ui), AWS CDK (TypeScript) for IaC
2. **AWS CDK stack** — DynamoDB table (EpicWeaveTable + GSIs), S3 buckets, CloudFront distribution, API Gateway (HTTP API), Cognito User Pool, SQS queues, Parameter Store defaults, Secrets Manager placeholders
3. **Authentication** — Cognito User Pool with email/password + OAuth (Google, GitHub), post-confirmation Lambda trigger to create DynamoDB user profile, Cognito authorizer on API Gateway
4. **BDD test harness** — Cucumber.js + Vitest + Playwright setup, AWS SDK mocks (aws-sdk-client-mock), k6 config

### Phase 2: Catalog & Inventory

5. **Product Lambda functions** — GET /products (list + filter via GSIs), GET /products/:id (detail + variants)
6. **Product listing page** — React page with filters (mythology, size, color, price, style), CloudFront image delivery
7. **Product detail page** — Image gallery, 30-color selector, size selector, add-to-cart button
8. **Admin inventory management** — Lambda CRUD for products + variants, admin-only routes (Cognito group check)
9. **Seed data** — Lambda or script to populate DynamoDB with pre-designed products

### Phase 3: AI Design Sessions

10. **Session fee payment** — Lambda: create Stripe PaymentIntent ($2), on success create DesignSession in DynamoDB with TTL
11. **Chat UI** — React conversational interface, art style selector (modern/anime), prompt input
12. **Content rule enforcement** — Lambda: mythology keyword check (from Parameter Store), style enforcement, safety filter
13. **AI image generation pipeline** — Lambda → SQS → Lambda worker → DALL-E API → S3 upload → DynamoDB message insert
14. **T-shirt mockup preview** — React component: overlay design on t-shirt template, 30-color picker, size selector, print placement (front/back/both)
15. **Design-to-cart flow** — Lambda: calculate price (base × complexity × size + placement surcharge from Parameter Store), add CartItem to DynamoDB

### Phase 4: Cart & Checkout

16. **Cart management** — Lambda CRUD: GET /cart, POST /cart/items, PATCH /cart/items/:id, DELETE /cart/items/:id (DynamoDB)
17. **Checkout flow** — React: shipping address form (US only), Stripe Elements, order summary with flat-rate + carrier shipping
18. **Order creation** — Lambda: DynamoDB TransactWriteItems (order + items + payment + stock decrement + cart clear)
19. **Order confirmation** — SES email via Lambda, React confirmation page

### Phase 5: Order Management & Admin

20. **Customer order history** — Lambda: GET /orders (query DynamoDB PK=USER#), React order list + detail pages
21. **Admin order dashboard** — Lambda: GET /admin/orders?status= (GSI2), PATCH status transitions, React admin panel
22. **In-house fulfillment workflow** — Admin: mark processing → enter tracking → mark shipped (SES notification) → mark delivered
23. **Refund/cancellation** — Lambda: Stripe Refund API (order payments only, not session fees), DynamoDB atomic update + stock restore

### Phase 6: Admin Configuration

24. **Parameter Store management** — Lambda: GET/PUT /admin/config (read/write Parameter Store values), React admin config page
25. **Dynamic pricing** — All pricing reads from Parameter Store (session fee, base price, surcharges, complexity multipliers)

### Phase 7: Non-Functional, Security & Load Testing

26. **Performance tests** — k6 scripts against API Gateway (page load, API response, AI generation latency)
27. **Security hardening** — AWS WAF rules on CloudFront + API Gateway, Cognito advanced security, input sanitization
28. **Observability** — CloudWatch Logs + X-Ray tracing on all Lambdas, CloudWatch Alarms (error rate, DLQ depth, latency), dashboard
29. **Load tests** — k6: 500 concurrent users, 50 TPS checkout, SQS queue depth under AI load

---

## 9. Resolved Clarification Questions

All 18 questions have been answered. Decisions are incorporated throughout this document.

### Product & Pricing

| #   | Question                   | Decision                                                                                                                                                            |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Session fee amount         | **$2.00 USD** (default), admin-configurable via Parameter Store                                                                                                     |
| 2   | Base t-shirt price         | **$20.00 USD** (default), admin-configurable. Pricing factors: size, color, complexity (low/medium/high). Both-placement surcharge: admin-configurable (default $8) |
| 3   | Pre-designed t-shirt price | **Varies per product**, preloaded in inventory database                                                                                                             |
| 4   | Currency                   | **USD only**                                                                                                                                                        |

### AI Design Session

| #   | Question                   | Decision                                                                                   |
| --- | -------------------------- | ------------------------------------------------------------------------------------------ |
| 5   | Max iterations per session | **5** (default), admin-configurable via Parameter Store                                    |
| 6   | Session expiry             | **1 hour** inactivity TTL (default), admin-configurable. DynamoDB TTL auto-expires records |
| 7   | AI provider                | **OpenAI DALL-E**                                                                          |
| 8   | Image resolution           | **1024×1024** (default), admin-configurable. Good quality standard for t-shirt printing    |
| 9   | T-shirt colors             | **30 standard color options** (user selects during design preview)                         |

### Business Rules

| #   | Question                  | Decision                                                                                                                     |
| --- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 10  | Mythology scope           | **Hindu & Greek** initially, **architected for expansion** (allowed types stored in Parameter Store as comma-separated list) |
| 11  | Art style enforcement     | **User explicitly chooses** between "modern" and "anime" at session start                                                    |
| 12  | Session fee refundability | **Non-refundable**                                                                                                           |

### Shipping & Fulfillment

| #   | Question            | Decision                                                                                                              |
| --- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 13  | Shipping regions    | **US domestic only** (expandable to international later)                                                              |
| 14  | Shipping cost model | **Flat rate base** ($5.99 default, admin-configurable) **+ real-time carrier rates**                                  |
| 15  | Print fulfillment   | **In-house printing**. Admin manages print jobs, updates inventory, and marks orders as shipped with tracking numbers |

### Technical

| #   | Question                | Decision                                                      |
| --- | ----------------------- | ------------------------------------------------------------- |
| 16  | Existing infrastructure | **Existing AWS account**. Stripe account needs to be set up   |
| 17  | Domain name             | **No domain yet** (will use CloudFront default URL initially) |
| 18  | Email service           | **AWS SES**                                                   |

---

## 10. Appendix: API Route Summary

| Method | Route                      | Auth       | Lambda             | Description                       |
| ------ | -------------------------- | ---------- | ------------------ | --------------------------------- |
| GET    | `/products`                | Public     | listProducts       | Browse catalog with filters       |
| GET    | `/products/:id`            | Public     | getProduct         | Product detail + variants         |
| POST   | `/cart/items`              | Cognito    | addToCart          | Add item to cart                  |
| GET    | `/cart`                    | Cognito    | getCart            | Get user's cart                   |
| PATCH  | `/cart/items/:id`          | Cognito    | updateCartItem     | Update quantity                   |
| DELETE | `/cart/items/:id`          | Cognito    | removeCartItem     | Remove from cart                  |
| GET    | `/config/session-fee`      | Public     | getSessionFee      | Get current session fee           |
| POST   | `/sessions/create`         | Cognito    | createSession      | Pay fee + create session          |
| POST   | `/sessions/:id/generate`   | Cognito    | generateDesign     | Submit prompt → SQS               |
| GET    | `/sessions/:id/status`     | Cognito    | getSessionStatus   | Poll generation status            |
| POST   | `/sessions/:id/finalize`   | Cognito    | finalizeDesign     | Calculate price, prepare for cart |
| POST   | `/checkout/calculate`      | Cognito    | calculateCheckout  | Totals + tax + shipping           |
| POST   | `/checkout/place-order`    | Cognito    | placeOrder         | Stripe charge + create order      |
| GET    | `/orders`                  | Cognito    | listOrders         | User's order history              |
| GET    | `/orders/:id`              | Cognito    | getOrder           | Order detail + items              |
| POST   | `/orders/:id/cancel`       | Cognito    | cancelOrder        | Request cancellation              |
| POST   | `/webhooks/stripe`         | Stripe sig | stripeWebhook      | Handle Stripe events              |
| GET    | `/admin/orders`            | Admin      | adminListOrders    | All orders (filterable)           |
| GET    | `/admin/orders/:id`        | Admin      | adminGetOrder      | Order detail for admin            |
| PATCH  | `/admin/orders/:id/status` | Admin      | adminUpdateOrder   | Status transitions                |
| POST   | `/admin/orders/:id/refund` | Admin      | adminRefundOrder   | Initiate refund                   |
| GET    | `/admin/products`          | Admin      | adminListProducts  | All products                      |
| POST   | `/admin/products`          | Admin      | adminCreateProduct | Create product                    |
| PATCH  | `/admin/products/:id`      | Admin      | adminUpdateProduct | Update product                    |
| DELETE | `/admin/products/:id`      | Admin      | adminDeleteProduct | Soft-delete product               |
| GET    | `/admin/config`            | Admin      | adminGetConfig     | Read Parameter Store              |
| PUT    | `/admin/config`            | Admin      | adminUpdateConfig  | Write Parameter Store             |

---

_End of Intent Document_
