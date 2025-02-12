sequenceDiagram
    participant User
    participant UI as Test Interface
    participant OS as Ollama Service
    participant CA as Conversation Analyzer
    participant LLM as Ollama LLM

    User->>UI: Enter message
    UI->>OS: Send message + context
    OS->>CA: Analyze conversation
    CA-->>OS: Analysis results
    OS->>LLM: Generate response
    LLM-->>OS: Response
    OS->>UI: Formatted response
    UI->>User: Display response

    Note over OS,LLM: API Communication
    Note over OS,CA: Internal Processing 