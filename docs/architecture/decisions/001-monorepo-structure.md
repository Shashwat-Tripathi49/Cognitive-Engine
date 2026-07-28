# ADR-001: Monorepo Structure with Turborepo

**Status**: ✅ Accepted
**Date**: 2026-07-28
**Authors**: Cognitive Engine Architecture Team

---

## Context

Cognitive Engine will consist of multiple applications (web frontend, API backend, mobile app) and shared packages (types, UI components, configs). We need to decide how to organize the codebase.

The options are:

1. **Monorepo** — All code in a single repository
2. **Polyrepo** — Each application/package in its own repository

## Decision

We will use a **monorepo** structure managed by **Turborepo** with **pnpm workspaces**.

```
cognitive-engine/
├── apps/
│   ├── web/        → Next.js frontend
│   ├── api/        → Hono backend
│   └── mobile/     → React Native app
├── packages/
│   ├── shared/     → Shared types, utils
│   ├── ui/         → Shared components
│   └── config/     → Shared configs
```

## Consequences

### Positive

- **Shared code**: Types, utilities, and components are shared without publishing packages
- **Atomic changes**: A single PR can update the API, shared types, and frontend together
- **Consistent tooling**: One ESLint config, one Prettier config, one TypeScript config
- **Simplified CI**: Single pipeline tests everything affected by a change
- **Developer experience**: One `git clone`, one `pnpm install`, one `pnpm dev`

### Negative

- **Repository size**: Will grow larger over time
- **Build complexity**: Need Turborepo to manage build ordering and caching
- **CI time**: Without proper caching, CI runs everything (mitigated by Turborepo)
- **Access control**: All contributors see all code (not an issue for small teams)

### Neutral

- **Learning curve**: Team needs to understand Turborepo and pnpm workspaces
- **Migration path**: If we outgrow monorepo, extraction to polyrepo is straightforward

## Alternatives Considered

### Polyrepo

- **Pro**: Clear ownership boundaries, independent versioning
- **Con**: Dependency hell, version synchronization overhead, fragmented DX
- **Verdict**: Rejected — overhead too high for a small team building a tightly integrated product

### Nx

- **Pro**: More features than Turborepo (generators, plugins, graph visualization)
- **Con**: More complex, heavier, enterprise-oriented
- **Verdict**: Rejected — Turborepo is simpler and sufficient for our needs
