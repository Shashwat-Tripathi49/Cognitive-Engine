# ⚙️ Shared Configurations

> `@cognitive-engine/config` — Shared tooling configurations for the monorepo.

---

## Purpose

Centralized configurations for development tools, ensuring every package and app uses the same standards.

## Planned Configs

| Config | Purpose |
|---|---|
| `eslint/` | ESLint configurations (base, React, Node) |
| `typescript/` | TSConfig presets (base, React, Node) |
| `prettier/` | Prettier configuration |
| `vitest/` | Vitest configuration presets |

## Usage

```json
// apps/web/tsconfig.json
{
  "extends": "@cognitive-engine/config/typescript/nextjs"
}

// apps/web/.eslintrc.js
module.exports = {
  extends: ["@cognitive-engine/config/eslint/react"]
}
```

## Status

⏳ **Not yet initialized.** Will be scaffolded during Phase 1.

---

> _One config to rule them all. Changes here propagate across the entire monorepo._
