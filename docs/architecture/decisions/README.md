# Architecture Decision Records (ADRs)

## What Are ADRs?

Architecture Decision Records capture significant architectural decisions along with their context, rationale, and consequences. They serve as a historical record of **why** the system looks the way it does.

## Index

| ADR                              | Title                             | Status      | Date       |
| -------------------------------- | --------------------------------- | ----------- | ---------- |
| [001](001-monorepo-structure.md) | Monorepo Structure with Turborepo | ✅ Accepted | 2026-07-28 |

## ADR Template

When creating a new ADR, use this template:

```markdown
# ADR-XXX: [Title]

**Status**: [Proposed | Accepted | Deprecated | Superseded by ADR-YYY]
**Date**: YYYY-MM-DD
**Authors**: [Names]

## Context

What is the issue that we're seeing that motivates this decision?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

### Positive

- ...

### Negative

- ...

### Neutral

- ...

## Alternatives Considered

What other options were evaluated?
```

## Process

1. Copy the template above
2. Number it sequentially (e.g., `002-decision-name.md`)
3. Submit via PR for team review
4. Once approved, merge and update the index above
