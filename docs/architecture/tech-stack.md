# Tech Stack

> Comprehensive breakdown of every technology choice and the reasoning behind it.

---

## Stack Overview

| Layer               | Technology                      | Version  | License    |
| ------------------- | ------------------------------- | -------- | ---------- |
| **Language**        | TypeScript                      | 5.x      | Apache-2.0 |
| **Runtime**         | Node.js                         | 20.x LTS | MIT        |
| **Frontend**        | Next.js (App Router)            | 15.x     | MIT        |
| **Backend**         | Hono                            | 4.x      | MIT        |
| **Database**        | PostgreSQL                      | 16.x     | PostgreSQL |
| **ORM**             | Drizzle ORM                     | Latest   | Apache-2.0 |
| **Cache**           | Redis                           | 7.x      | BSD-3      |
| **AI SDK**          | Vercel AI SDK                   | 4.x      | Apache-2.0 |
| **AI Framework**    | LangChain.js                    | Latest   | MIT        |
| **Vector DB**       | pgvector (PostgreSQL extension) | Latest   | PostgreSQL |
| **Mobile**          | React Native (Expo)             | SDK 52+  | MIT        |
| **Monorepo**        | Turborepo                       | 2.x      | MIT        |
| **Package Manager** | pnpm                            | 9.x      | MIT        |
| **Testing (Unit)**  | Vitest                          | 2.x      | MIT        |
| **Testing (E2E)**   | Playwright                      | Latest   | Apache-2.0 |
| **CI/CD**           | GitHub Actions                  | N/A      | N/A        |

---

## Decision Rationale

### TypeScript (Language)

**Why**: Type safety across the entire stack eliminates an entire class of runtime errors. Shared types between frontend, backend, and mobile via the monorepo.

**Alternatives considered**: JavaScript (too error-prone at scale), Go (great for backend but fragments the stack), Python (strong for AI but weak for full-stack).

### Next.js 15 (Frontend)

**Why**: React Server Components reduce client bundle size. App Router provides a modern routing model. Built-in API routes for BFF (Backend for Frontend) patterns. Excellent DX with fast refresh.

**Alternatives considered**: Vite + React (no SSR by default), Remix (smaller ecosystem), SvelteKit (team would need to learn Svelte).

### Hono (Backend)

**Why**: Ultralight (14KB), edge-ready, TypeScript-native, Web Standards-based. Perfect for a modern API that may deploy to edge functions. Middleware ecosystem is growing fast.

**Alternatives considered**: Express (dated, no native TS), Fastify (heavier, Node-only), tRPC (great but locks to specific patterns).

### PostgreSQL + Drizzle ORM (Database)

**Why**: PostgreSQL is battle-tested, supports JSONB for flexible AI metadata, and pgvector extension enables vector similarity search without a separate vector DB. Drizzle provides type-safe queries with zero runtime overhead.

**Alternatives considered**: MongoDB (schema flexibility but weaker for relational data), Prisma (heavier, slower queries), raw SQL (no type safety).

### pgvector (Vector Search)

**Why**: Keeps vector search in the same database as relational data. Simplifies infrastructure. Sufficient performance for early-stage product.

**Alternatives considered**: Pinecone (managed but expensive), Weaviate (feature-rich but separate infra), Qdrant (performant but adds operational complexity).

### Vercel AI SDK + LangChain (AI Layer)

**Why**: Vercel AI SDK provides streaming, tool calling, and model-agnostic abstractions. LangChain provides chains, agents, and RAG patterns. Together they cover the full AI development surface.

**Alternatives considered**: Direct API calls (no abstraction), LlamaIndex (Python-first), custom abstraction (too early to build our own).

### Turborepo + pnpm (Monorepo)

**Why**: Turborepo provides intelligent caching and parallel execution. pnpm provides strict dependency resolution and disk efficiency. Together they make the monorepo fast and reliable.

**Alternatives considered**: Nx (more complex, enterprise-oriented), Lerna (maintenance mode), Yarn workspaces (less strict than pnpm).

---

## Version Pinning Strategy

| Level              | Strategy                                                |
| ------------------ | ------------------------------------------------------- |
| **Node.js**        | Pinned via `.nvmrc` — all contributors use same version |
| **pnpm**           | Pinned via `packageManager` in `package.json`           |
| **Dependencies**   | Exact versions in `pnpm-lock.yaml`                      |
| **Major upgrades** | Require ADR and team discussion                         |

---

> _Tech stack decisions are documented as ADRs in [decisions/](decisions/). Revisit when requirements fundamentally change._
