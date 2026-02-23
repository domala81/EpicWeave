flowchart TD
    A[User] -->|User Login| B[HomePage]
    B -->|Browse Catalog| C[Catalog]
    B -->|Start Custom Design Session| D[AI Session]
    C -->|Select Design| E[Modal Page: Select Color, Size]
    E -->|Show Preview| G
    D -->|Prompting|D
    D -->|Finalize Design| F[Modal PageAI: Select Color, Size]
    F -->|Show Preview| G[Preview]
    G -->|Add to Cart| C
    G -->|Add to Cart| D



  