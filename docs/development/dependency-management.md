# Dependency Management

> How we manage packages, updates, and security across the monorepo.

---

## Package Manager

**pnpm** (v9+) with workspace support.

### Why pnpm?

- **Strict mode** — Prevents phantom dependencies (importing undeclared packages)
- **Disk efficient** — Content-addressable storage deduplicates packages
- **Fast** — Parallel installation, hard links instead of copies
- **Workspace native** — First-class monorepo support

---

## Workspace Structure

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

## Dependency Placement

| Dependency Type | Location | Example |
|---|---|---|
| Shared dev tools | Root `package.json` | TypeScript, ESLint, Prettier |
| App-specific | `apps/<app>/package.json` | Next.js, Hono |
| Shared library | `packages/<pkg>/package.json` | Zod, date-fns |
| Internal packages | Workspace reference | `"@cognitive-engine/shared": "workspace:*"` |

---

## Rules

1. **Always use exact versions** in `package.json` — pnpm lock file handles the rest
2. **Never install globally** — Everything runs via `pnpm` or `npx`
3. **Commit lock file** — `pnpm-lock.yaml` is always committed
4. **No duplicate dependencies** — Same package at same version across workspaces
5. **Review before adding** — New dependencies require justification in PR description

---

## Adding Dependencies

```bash
# Add to a specific app
pnpm --filter @cognitive-engine/web add react-query

# Add to a specific package
pnpm --filter @cognitive-engine/shared add zod

# Add a dev dependency to root
pnpm add -D -w typescript

# Add an internal package dependency
pnpm --filter @cognitive-engine/web add @cognitive-engine/shared
```

---

## Automated Updates

We use **Renovate Bot** for automated dependency updates:

- **Patch updates**: Auto-merge after CI passes
- **Minor updates**: PR created, requires 1 approval
- **Major updates**: PR created, requires team discussion
- **Security updates**: Auto-merge (critical), PR (others)

---

## Security

| Measure | Implementation |
|---|---|
| Vulnerability scanning | `pnpm audit` in CI pipeline |
| License compliance | Allowlisted licenses (MIT, Apache-2.0, BSD) |
| Supply chain security | Renovate Bot for timely updates |
| Lock file integrity | CI verifies lock file consistency |

---

## Node.js Version

Pinned in `.nvmrc`:

```
20
```

All contributors must use this version. CI enforces it.

---

> _Dependency decisions that affect architecture should be documented as ADRs._
