flowchart TD
  %% =========================
  %% E-Commerce + AI Design Session User Journey (Revised)
  %% =========================

  A[User opens web app] --> B{Authenticated?}
  B -- No --> C[Sign up / Login]
  B -- Yes --> D[Home / Shop Page]
  C --> D

  %% Choose path
  D --> E{What do you want to do?}
  E -- Buy pre-designed item --> F[Browse pre-designed inventory]
  E -- Create custom design --> L[Pay session access fee\n(predetermined price)]

  %% -------------------------
  %% Pre-designed item flow
  %% -------------------------
  F --> G[View product details\nImages / description]
  G --> TP1[Choose print placement\nFront / Back / Both]
  TP1 --> H[Choose size + other options]
  H --> I[Pricing calculated]
  I --> J[Add item to cart]
  J --> K[Cart]
  K --> Z[Checkout & Payment]
  Z --> AA[Order confirmed]

  %% -------------------------
  %% AI custom design flow
  %% -------------------------
  L --> M[Start Chat Session\n(ChatGPT-like UI)]
  M --> N[Enter prompt]
  N --> O{Validate rules}
  O -- Not Hindu/Greek --> OX[Reject prompt\nShow rule message] --> N
  O -- Valid --> P[Generate image from prompt]

  P --> Q[Render design on T-shirt mockup]
  Q --> R{Modify design?}
  R -- Yes --> S[User enters modification prompt] --> P
  R -- No --> TP2[Choose print placement\nFront / Back / Both]

  TP2 --> U[Choose size + other options]
  U --> V[Pricing calculated]
  V --> W[Add custom T-shirt to cart]
  W --> K

