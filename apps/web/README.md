# 🌐 Web Application

> Cognitive Engine's frontend application.

---

## Technology

| Technology        | Purpose                         |
| ----------------- | ------------------------------- |
| **Next.js 15**    | React framework with App Router |
| **TypeScript**    | Type safety                     |
| **CSS Modules**   | Scoped styling                  |
| **React Query**   | Server state management         |
| **Vercel AI SDK** | AI streaming on the client      |

## Directory Structure (Planned)

```
apps/web/
├── src/
│   ├── app/              → Next.js App Router pages
│   │   ├── (auth)/       → Auth-related routes
│   │   ├── (dashboard)/  → Authenticated routes
│   │   ├── layout.tsx    → Root layout
│   │   └── page.tsx      → Landing page
│   ├── components/       → Page-specific components
│   ├── hooks/            → Custom React hooks
│   ├── lib/              → Utilities, API client
│   ├── styles/           → Global styles, tokens
│   └── types/            → Frontend-specific types
├── public/               → Static assets
├── tests/                → E2E tests
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Status

⏳ **Not yet initialized.** Will be scaffolded during Phase 1.

## Getting Started

```bash
# From project root
pnpm dev --filter @cognitive-engine/web

# Or from this directory
pnpm dev
```

---

> _See [docs/ux/design-system.md](../../docs/ux/design-system.md) for design guidelines._
