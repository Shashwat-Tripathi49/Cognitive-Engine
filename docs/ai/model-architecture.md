# Model Architecture

> How AI is integrated into Cognitive Engine at a systems level.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Orchestrator                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐ │
│  │  Embedding   │  │  Analysis   │  │  Generation        │ │
│  │  Service     │  │  Service    │  │  Service           │ │
│  │             │  │             │  │                    │ │
│  │ - Text→Vec  │  │ - Patterns  │  │ - Summaries       │ │
│  │ - Similarity│  │ - Themes    │  │ - Connections     │ │
│  │ - Clustering│  │ - Biases    │  │ - Digest          │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────┬──────────┘ │
│         │                │                    │            │
└─────────┼────────────────┼────────────────────┼────────────┘
          │                │                    │
  ┌───────▼────────┐ ┌────▼──────┐  ┌──────────▼───────────┐
  │   Vector DB    │ │  LLM      │  │  LLM Gateway         │
  │  (pgvector)    │ │  Gateway  │  │  (Multi-provider)    │
  └────────────────┘ └───────────┘  └──────────────────────┘
```

---

## AI Services

### 1. Embedding Service

**Purpose**: Convert text into semantic vector representations.

| Property   | Value                                           |
| ---------- | ----------------------------------------------- |
| Model      | `text-embedding-3-small` (OpenAI) or equivalent |
| Dimensions | 1536                                            |
| Storage    | pgvector extension in PostgreSQL                |
| Trigger    | Async on thought creation/update                |

**Capabilities**:

- Text-to-vector embedding
- Semantic similarity search
- Clustering related thoughts
- Cross-entry connection detection

### 2. Analysis Service

**Purpose**: Identify patterns, themes, and cognitive biases in user's thinking.

| Property       | Value                                         |
| -------------- | --------------------------------------------- |
| Model          | GPT-4o / Claude 3.5 (via gateway)             |
| Trigger        | Scheduled (daily digest) + on-demand          |
| Context window | User's recent + historically relevant entries |

**Capabilities**:

- Theme extraction across entries
- Recurring pattern detection
- Cognitive bias identification
- Temporal thinking analysis

### 3. Generation Service

**Purpose**: Create summaries, connections, and insights.

| Property  | Value                             |
| --------- | --------------------------------- |
| Model     | GPT-4o / Claude 3.5 (via gateway) |
| Streaming | Yes (via Vercel AI SDK)           |
| Trigger   | User-initiated + scheduled        |

**Capabilities**:

- Daily cognitive digest
- Entry summarization
- Connection explanations
- Thought expansion suggestions

---

## LLM Gateway

The LLM Gateway abstracts provider-specific APIs behind a unified interface.

```typescript
// Conceptual interface
interface LLMGateway {
  generate(prompt: string, options: GenerateOptions): AsyncIterable<string>;
  embed(text: string): Promise<number[]>;
  analyze(entries: Entry[], task: AnalysisTask): Promise<Analysis>;
}
```

### Supported Providers (Planned)

| Provider  | Models                                | Priority           |
| --------- | ------------------------------------- | ------------------ |
| OpenAI    | GPT-4o, GPT-4o-mini, text-embedding-3 | Primary            |
| Anthropic | Claude 3.5 Sonnet, Claude 3.5 Haiku   | Secondary          |
| Local     | Ollama (Llama, Mistral)               | Self-hosted option |

### Fallback Strategy

```
Primary Provider → Secondary Provider → Cached Response → Graceful Degradation
```

---

## Data Flow

```
User creates thought
       │
       ▼
  Save to PostgreSQL (immediate)
       │
       ▼
  Queue embedding job (async)
       │
       ├──▶ Generate embedding vector
       │         │
       │         ▼
       │    Store in pgvector
       │
       ├──▶ Find similar entries (background)
       │         │
       │         ▼
       │    Create connection records
       │
       └──▶ Update knowledge graph (background)
                 │
                 ▼
            Notify user of new connections (if significant)
```

---

## Performance Targets

| Operation            | Target Latency      | Strategy                |
| -------------------- | ------------------- | ----------------------- |
| Embedding generation | < 200ms             | Async, non-blocking     |
| Semantic search      | < 500ms             | pgvector HNSW index     |
| Connection detection | < 2s                | Background processing   |
| Digest generation    | < 10s               | Scheduled, cached       |
| Streaming response   | First token < 500ms | Vercel AI SDK streaming |

---

## Cost Management

| Strategy      | Implementation                                                  |
| ------------- | --------------------------------------------------------------- |
| Model tiering | Use cheaper models for embeddings, powerful models for analysis |
| Caching       | Cache frequent prompts and their responses                      |
| Batching      | Batch embedding requests where possible                         |
| Rate limiting | Per-user AI request quotas                                      |
| Token budgets | Maximum token limits per request type                           |

---

> _Model choices are provisional and will be validated through evaluation. See [evaluation.md](evaluation.md) for quality metrics._
