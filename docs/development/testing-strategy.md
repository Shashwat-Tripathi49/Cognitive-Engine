# Testing Strategy

> Testing philosophy, tooling, coverage targets, and best practices.

---

## Testing Pyramid

```
        ╱╲
       ╱  ╲        E2E Tests (Playwright)
      ╱    ╲       Few, critical user journeys
     ╱──────╲
    ╱        ╲     Integration Tests (Vitest)
   ╱          ╲    API routes, DB queries, AI pipeline
  ╱────────────╲
 ╱              ╲  Unit Tests (Vitest)
╱                ╲ Pure functions, utils, components
╱──────────────────╲
```

---

## Tooling

| Type | Tool | Config Location |
|---|---|---|
| Unit & Integration | Vitest | `packages/config/vitest` |
| E2E | Playwright | `apps/web/playwright.config.ts` |
| API testing | Vitest + supertest | `apps/api/tests/` |
| Component testing | Vitest + Testing Library | `apps/web/tests/` |

---

## Coverage Targets

| Package | Target | Required for Merge |
|---|---|---|
| `packages/shared` | ≥ 90% | ✅ |
| `apps/api` | ≥ 80% | ✅ |
| `apps/web` | ≥ 70% | ✅ |
| E2E (critical paths) | 100% of user stories | ✅ |

---

## Test File Structure

```
src/
├── utils/
│   ├── tokenizer.ts
│   └── tokenizer.test.ts     ← Co-located unit test
├── services/
│   ├── entry.service.ts
│   └── entry.service.test.ts ← Co-located integration test
tests/
├── e2e/                       ← E2E tests (separate directory)
│   ├── auth.spec.ts
│   └── entry-capture.spec.ts
└── fixtures/                  ← Shared test data
    └── entries.ts
```

---

## Writing Good Tests

```typescript
// ✅ Descriptive test names
describe('EntryService', () => {
  describe('createEntry', () => {
    it('should create an entry with the given content and return it with a generated ID', async () => {
      // ...
    });

    it('should throw ValidationError when content is empty', async () => {
      // ...
    });
  });
});

// ✅ Arrange-Act-Assert pattern
it('should calculate connection strength correctly', () => {
  // Arrange
  const similarity = 0.8;
  const recency = 0.6;

  // Act
  const strength = calculateStrength(similarity, recency);

  // Assert
  expect(strength).toBeCloseTo(0.74);
});
```

---

## What to Test

| ✅ Test | ❌ Don't Test |
|---|---|
| Business logic | Framework internals |
| API contracts | Third-party library behavior |
| Error handling paths | CSS styling |
| Edge cases | Implementation details |
| User interactions (E2E) | Private methods directly |

---

> _Testing is not optional. PRs without appropriate tests will be returned for revision._
