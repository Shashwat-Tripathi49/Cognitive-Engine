# 🔧 Scripts

> Development automation scripts for Cognitive Engine.

---

## Purpose

This directory contains scripts that automate common development tasks:

| Script              | Purpose                                  | Status     |
| ------------------- | ---------------------------------------- | ---------- |
| `setup.sh`          | First-time project setup                 | ⏳ Planned |
| `seed.ts`           | Seed development database                | ⏳ Planned |
| `generate-types.ts` | Generate TypeScript types from DB schema | ⏳ Planned |
| `health-check.ts`   | Verify all services are running          | ⏳ Planned |

## Usage

Scripts are invoked via pnpm:

```bash
pnpm run setup        # First-time setup
pnpm run db:seed      # Seed development data
pnpm run healthcheck  # Verify services
```

---

## Writing Scripts

- Use TypeScript (with `tsx` for execution)
- Include error handling and helpful output
- Make scripts idempotent (safe to run multiple times)
- Document usage in this README

---

> _Scripts will be added as development progresses through Phase 1._
