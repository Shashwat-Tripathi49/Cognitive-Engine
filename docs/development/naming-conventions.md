# Naming Conventions

> Consistent naming across all layers of the application.

---

## Files & Directories

| Element | Convention | Example |
|---|---|---|
| React components | PascalCase | `EntryCard.tsx` |
| Hooks | camelCase, `use` prefix | `useEntries.ts` |
| Utilities | camelCase | `tokenizer.ts` |
| Constants | camelCase (file), SCREAMING_SNAKE (exports) | `limits.ts` → `MAX_TOKEN_LENGTH` |
| Types / interfaces | camelCase (file), PascalCase (exports) | `entry.ts` → `EntryCreateInput` |
| Test files | Match source + `.test` | `tokenizer.test.ts` |
| CSS modules | camelCase + `.module` | `entryCard.module.css` |
| Directories | kebab-case | `user-settings/` |
| API route files | kebab-case | `cognitive-digest.ts` |

---

## TypeScript

| Element | Convention | Example |
|---|---|---|
| Variables | camelCase | `sessionContext` |
| Functions | camelCase | `calculateStrength()` |
| Classes | PascalCase | `EntryService` |
| Interfaces | PascalCase, no `I` prefix | `EntryProps` (not `IEntryProps`) |
| Types | PascalCase | `UserProfile` |
| Enums | PascalCase (name + members) | `CognitionType.Reflection` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_ENTRY_LENGTH` |
| Generics | Single uppercase letter or descriptive | `T`, `TEntry`, `TResponse` |
| Boolean vars | `is`, `has`, `should` prefix | `isLoading`, `hasPermission` |
| Async functions | Verb-first | `fetchEntries()`, `createEntry()` |

---

## Database

| Element | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `user_sessions` |
| Columns | snake_case | `created_at` |
| Primary keys | `id` | `id` |
| Foreign keys | `<singular_table>_id` | `user_id`, `entry_id` |
| Indexes | `idx_<table>_<columns>` | `idx_entries_user_id` |
| Unique constraints | `uq_<table>_<columns>` | `uq_users_email` |
| Junction tables | `<table1>_<table2>` | `entry_tags` |
| Timestamps | `created_at`, `updated_at`, `deleted_at` | — |

---

## API

| Element | Convention | Example |
|---|---|---|
| URL paths | kebab-case, plural nouns | `/api/v1/cognitive-entries` |
| Query params | camelCase | `?pageSize=20&sortBy=createdAt` |
| Request body | camelCase JSON | `{ "entryContent": "..." }` |
| Response body | camelCase JSON | `{ "createdAt": "..." }` |
| Error codes | SCREAMING_SNAKE | `VALIDATION_ERROR` |
| Headers | Title-Case | `X-Request-ID` |

---

## Git

| Element | Convention | Example |
|---|---|---|
| Branch names | kebab-case with type prefix | `feature/CE-001-auth-flow` |
| Commit messages | Conventional Commits | `feat(api): add user endpoints` |
| Tags | Semantic versioning with `v` prefix | `v1.0.0` |

---

## Environment Variables

| Convention | Example |
|---|---|
| SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| Grouped by prefix | `AUTH_SECRET`, `AUTH_PROVIDER` |
| Client-exposed: `NEXT_PUBLIC_` prefix | `NEXT_PUBLIC_APP_URL` |

---

> _These conventions are non-negotiable. Consistency across the codebase is more valuable than any individual preference._
