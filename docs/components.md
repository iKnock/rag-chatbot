graph LR
    subgraph Frontend
        UI[Interactive Test]
    end

    subgraph Backend
        subgraph Services
            OS[Ollama Service]
            CA[Conversation Analyzer]
        end

        subgraph Config
            CF[Configuration]
        end
    end

    subgraph External
        LLM[Ollama LLM]
    end

    UI <--> OS
    OS <--> CA
    OS <--> LLM
    OS --> CF
    CA --> CF

    style OS fill:#f9f
    style CA fill:#f9f
    style UI fill:#fbb
    style CF fill:#bfb
    style LLM fill:#bbf 