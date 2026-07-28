# 🎨 UI Component Library

> `@cognitive-engine/ui` — Shared UI components used across web and mobile.

---

## Purpose

A design-system-driven component library that ensures visual consistency across all Cognitive Engine interfaces.

## Planned Components

| Component | Description | Priority |
|---|---|---|
| Button | Primary, secondary, ghost, danger variants | P0 |
| Input | Text, textarea, search with validation | P0 |
| Card | Entry card, insight card, connection card | P0 |
| Modal | Accessible dialog/modal | P1 |
| Toast | Non-blocking notifications | P1 |
| Tag | Tag/badge component with colors | P1 |
| Tooltip | Contextual information | P2 |
| Skeleton | Loading placeholder | P1 |
| EmptyState | Empty state illustrations | P2 |

## Planned Structure

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── ...
│   ├── tokens/           → Design tokens as CSS custom properties
│   └── index.ts          → Package entry point
├── tsconfig.json
└── package.json
```

## Usage

```typescript
import { Button, Card, Input } from '@cognitive-engine/ui';
```

## Design Reference

All components must follow the [Design System](../../docs/ux/design-system.md).

## Status

⏳ **Not yet initialized.** Will be scaffolded during Phase 1.

---

> _Every component must be accessible (WCAG 2.2 AA), tested, and documented._
