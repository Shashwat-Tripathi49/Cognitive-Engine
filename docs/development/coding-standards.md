# Coding Standards

> TypeScript style guide, patterns, and anti-patterns for Cognitive Engine.

---

## TypeScript Configuration

- **Strict mode**: Always enabled (`"strict": true`)
- **No `any`**: Use `unknown` + type guards instead
- **Explicit return types**: Required for exported functions
- **Path aliases**: Use `@/` for clean imports

---

## Code Style

### General Principles

1. **Readability over cleverness** — Code is read 10x more than it's written
2. **Document _why_, not _what_** — Code shows what; comments explain why
3. **Single Responsibility** — Each function/module does one thing well
4. **Max ~300 lines per file** — Split if larger
5. **Max 3 levels of nesting** — Extract functions to flatten

### Functions

```typescript
// ✅ Pure functions preferred
function calculateStrength(similarity: number, recency: number): number {
  return similarity * 0.7 + recency * 0.3;
}

// ✅ Explicit return types for exports
export function formatEntry(entry: Entry): FormattedEntry {
  // ...
}

// ❌ Avoid: implicit any, no return type
export function formatEntry(entry) {
  // ...
}
```

### Error Handling

```typescript
// ✅ Typed errors
class EntryNotFoundError extends Error {
  constructor(public readonly entryId: string) {
    super(`Entry not found: ${entryId}`);
    this.name = 'EntryNotFoundError';
  }
}

// ✅ Never silently catch
try {
  await saveEntry(entry);
} catch (error) {
  logger.error('Failed to save entry', { error, entryId: entry.id });
  throw error; // re-throw or handle explicitly
}

// ❌ Never do this
try {
  await saveEntry(entry);
} catch (e) {
  // silent catch
}
```

### Imports

```typescript
// ✅ Order: external → internal → types
import { Hono } from 'hono';
import { z } from 'zod';

import { db } from '@/lib/db';
import { validateEntry } from '@/lib/validation';

import type { Entry, EntryCreateInput } from '@cognitive-engine/shared';
```

### Constants

```typescript
// ✅ Centralized, typed constants
export const LIMITS = {
  MAX_ENTRY_LENGTH: 50_000,
  MAX_TITLE_LENGTH: 500,
  MAX_TAGS_PER_ENTRY: 20,
  EMBEDDING_DIMENSIONS: 1_536,
} as const;

// ❌ Avoid magic numbers
if (content.length > 50000) { ... }
```

---

## React / Frontend Standards

### Components

```tsx
// ✅ Functional components with explicit props
interface EntryCardProps {
  entry: Entry;
  onSelect: (id: string) => void;
  isHighlighted?: boolean;
}

export function EntryCard({ entry, onSelect, isHighlighted = false }: EntryCardProps) {
  return (
    // ...
  );
}
```

### Hooks

```typescript
// ✅ Custom hooks for shared logic
export function useEntries(filters?: EntryFilters) {
  // encapsulate data fetching, caching, error handling
}
```

### State Management

- **Server state**: React Query / SWR (cache, revalidation, optimistic updates)
- **Client state**: React `useState` / `useReducer` for local state
- **Global state**: Zustand (if needed — avoid premature global state)

---

## Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|---|---|
| `any` type | `unknown` + type guard |
| `console.log` in production | Structured logger |
| Nested ternaries | `if/else` or early returns |
| `!important` in CSS | Fix specificity properly |
| Index as React key | Use stable unique ID |
| Barrel exports everywhere | Direct imports for tree-shaking |
| God components (500+ lines) | Compose smaller components |

---

> _These standards are enforced by ESLint and Prettier. Run `pnpm lint` before every commit._
