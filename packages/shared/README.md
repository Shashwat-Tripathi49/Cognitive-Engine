# 📦 Shared Package

> `@cognitive-engine/shared` — Shared types, utilities, and constants used across all apps.

---

## Purpose

This package is the **single source of truth** for:

- TypeScript types and interfaces shared between frontend, backend, and mobile
- Database schema definitions (Drizzle ORM)
- Utility functions used across apps
- Constants and configuration values
- Validation schemas (Zod)

## Planned Structure

```
packages/shared/
├── src/
│   ├── types/            → Shared TypeScript types
│   │   ├── entry.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── db/               → Database schema (Drizzle)
│   │   ├── schema/
│   │   └── index.ts
│   ├── validators/       → Zod validation schemas
│   ├── utils/            → Shared utility functions
│   ├── constants/        → Shared constants
│   └── index.ts          → Package entry point
├── tsconfig.json
└── package.json
```

## Usage

```typescript
import type { Entry, UserProfile } from '@cognitive-engine/shared';
import { LIMITS, validateEntry } from '@cognitive-engine/shared';
```

## Status

⏳ **Not yet initialized.** Will be scaffolded during Phase 1.

---

> _This package must remain dependency-light. Only add deps that are truly needed across all apps._
