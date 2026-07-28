# System Overview

> High-level architecture of Cognitive Engine.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Web App    │  │  Mobile App  │  │   Browser Extension      │  │
│  │  (Next.js)   │  │ (React Native│  │   (Future)               │  │
│  │              │  │    / Expo)   │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                       │                 │
└─────────┼─────────────────┼───────────────────────┼─────────────────┘
          │                 │                       │
          └─────────────────┼───────────────────────┘
                            │
                     ┌──────▼───────┐
                     │   API Gateway │
                     │   / Edge      │
                     └──────┬───────┘
                            │
┌───────────────────────────┼─────────────────────────────────────────┐
│                      API LAYER                                      │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │    Auth      │  │   Core API   │  │    AI Service            │  │
│  │   Service    │  │   (Hono)     │  │    (Orchestrator)        │  │
│  │              │  │              │  │                          │  │
│  └──────────────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│                           │                       │                 │
└───────────────────────────┼───────────────────────┼─────────────────┘
                            │                       │
┌───────────────────────────┼───────────────────────┼─────────────────┐
│                    DATA LAYER                     │                 │
│                                                   │                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────▼──────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │   Vector DB              │  │
│  │  (Primary)   │  │   (Cache)    │  │   (Embeddings)           │  │
│  │              │  │              │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────────┐
│                   INTELLIGENCE LAYER                                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Embedding   │  │   LLM        │  │   Knowledge Graph        │  │
│  │  Pipeline    │  │   Gateway    │  │   Engine                 │  │
│  │              │  │  (Multi-     │  │                          │  │
│  │              │  │   provider)  │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Client Layer

| Component | Responsibility |
|---|---|
| **Web App** | Primary user interface. Server-rendered with Next.js for performance and SEO. |
| **Mobile App** | Native mobile experience. React Native + Expo for cross-platform code sharing. |
| **Browser Extension** | Future. Quick capture from any webpage. |

### API Layer

| Component | Responsibility |
|---|---|
| **Auth Service** | Authentication, authorization, session management (OAuth 2.0, magic links). |
| **Core API** | Business logic, CRUD operations, data validation, real-time subscriptions. |
| **AI Service** | Orchestrates AI operations — embedding, analysis, insight generation. |

### Data Layer

| Component | Responsibility |
|---|---|
| **PostgreSQL** | Primary data store. Relational data, user accounts, entries, metadata. |
| **Redis** | Caching, session store, rate limiting, real-time pub/sub. |
| **Vector DB** | Semantic search via embedding vectors. Integrated with AI pipeline. |

### Intelligence Layer

| Component | Responsibility |
|---|---|
| **Embedding Pipeline** | Converts text to semantic vectors for similarity search. |
| **LLM Gateway** | Model-agnostic interface to LLM providers (OpenAI, Anthropic, local models). |
| **Knowledge Graph Engine** | Builds and queries the user's personal knowledge graph. |

---

## Key Design Principles

1. **Separation of Concerns** — Each layer has a clear, bounded responsibility
2. **API-First** — All data flows through well-defined API contracts
3. **Model Agnostic** — AI layer abstracts provider-specific details
4. **Horizontal Scalability** — Stateless services that can scale independently
5. **Edge-Ready** — Backend designed for edge deployment (Hono)

---

## Data Flow

```
User Input → API Gateway → Core API → PostgreSQL (persist)
                                    → Embedding Pipeline (async)
                                    → Vector DB (index)
                                    → Knowledge Graph Engine (connect)
                                    → LLM Gateway (analyze)
                                    → Client (respond)
```

---

## Cross-Cutting Concerns

| Concern | Approach |
|---|---|
| **Authentication** | JWT + refresh tokens, OAuth 2.0 |
| **Authorization** | Role-based (RBAC) with resource-level policies |
| **Logging** | Structured JSON logs, centralized aggregation |
| **Monitoring** | Health checks, metrics, distributed tracing |
| **Rate Limiting** | Token bucket algorithm at API gateway |
| **Error Handling** | Typed errors, consistent error response format |

---

> _This document will be updated as the architecture evolves. See [ADRs](decisions/) for the rationale behind major decisions._
