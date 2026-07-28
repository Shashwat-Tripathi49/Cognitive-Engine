# ⚡ API Server

> Cognitive Engine's backend API.

---

## Technology

| Technology | Purpose |
|---|---|
| **Hono** | Lightweight, edge-ready HTTP framework |
| **TypeScript** | Type safety |
| **Drizzle ORM** | Type-safe database queries |
| **Zod** | Request/response validation |
| **Vercel AI SDK** | LLM integration (server-side) |

## Directory Structure (Planned)

```
apps/api/
├── src/
│   ├── routes/           → Route handlers (by resource)
│   │   ├── entries.ts
│   │   ├── tags.ts
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── intelligence.ts
│   ├── middleware/        → Auth, logging, error handling
│   ├── services/          → Business logic layer
│   ├── lib/               → Utilities, DB client, AI client
│   ├── validators/        → Zod schemas
│   └── index.ts           → App entry point
├── tests/
│   ├── integration/
│   └── fixtures/
├── tsconfig.json
└── package.json
```

## Status

⏳ **Not yet initialized.** Will be scaffolded during Phase 1.

## Getting Started

```bash
# From project root
pnpm dev --filter @cognitive-engine/api

# Or from this directory
pnpm dev
```

## API Documentation

- [API Overview](../../docs/api/api-overview.md)
- [Endpoints](../../docs/api/endpoints.md)
- [Authentication](../../docs/api/authentication.md)
- [Error Handling](../../docs/api/error-handling.md)

---

> _See [docs/architecture/system-overview.md](../../docs/architecture/system-overview.md) for system architecture._
