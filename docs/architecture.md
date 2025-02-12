graph TD
    subgraph User_Interface
        UI[Interactive Test Interface]
    end

    subgraph Core_Services
        OS[Ollama Service]
        CA[Conversation Analyzer]
    end

    subgraph External_Services
        OL[Ollama LLM]
    end

    subgraph Configuration
        CF[Config]
    end

    %% User Interface Flow
    UI -->|User Input| OS
    OS -->|Response| UI

    %% Service Dependencies
    OS -->|Uses| CF
    CA -->|Uses| CF
    
    %% External Communication
    OS -->|API Request| OL
    OL -->|API Response| OS

    %% Analysis Flow
    OS -->|Messages| CA
    CA -->|Analysis| OS

    %% Styling
    classDef service fill:#f9f,stroke:#333,stroke-width:2px
    classDef external fill:#bbf,stroke:#333,stroke-width:2px
    classDef config fill:#bfb,stroke:#333,stroke-width:2px
    classDef interface fill:#fbb,stroke:#333,stroke-width:2px

    class OS,CA service
    class OL external
    class CF config
    class UI interface 