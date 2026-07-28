# Local Development Setup

> Get Cognitive Engine running locally in under 10 minutes.

---

## Prerequisites

| Tool                    | Version Requirement           | Verification Command |
| ----------------------- | ----------------------------- | -------------------- |
| **Node.js**             | ≥ 20.x (see `.nvmrc`)         | `node -v`            |
| **pnpm**                | ≥ 9.x                         | `pnpm -v`            |
| **Git**                 | ≥ 2.x                         | `git -v`             |
| **Docker / PostgreSQL** | PostgreSQL 16 with `pgvector` | `docker --version`   |

---

## Quick Start (Fresh Clone Onboarding)

```bash
# 1. Clone the repository
git clone https://github.com/Shashwat-Tripathi49/Cognitive-Engine.git
cd Cognitive-Engine

# 2. Use correct Node.js version
nvm use

# 3. Install workspace dependencies
pnpm install

# 4. Copy environment configuration
cp .env.example .env.local

# 5. Start infrastructure (PostgreSQL 16 + pgvector)
docker compose up -d

# 6. Verify database health and apply baseline migration infrastructure
pnpm db:generate
pnpm db:migrate

# 7. Start all services in development mode
pnpm dev
```

---

## Service URLs

| Service                     | Application Path           | URL                          | Port |
| --------------------------- | -------------------------- | ---------------------------- | ---- |
| **Web Frontend**            | `apps/web`                 | http://localhost:3000        | 3000 |
| **Hono API Server**         | `apps/api`                 | http://localhost:3001        | 3001 |
| **API Root Endpoint**       | `apps/api`                 | http://localhost:3001/       | 3001 |
| **API Health Check**        | `apps/api`                 | http://localhost:3001/health | 3001 |
| **Drizzle Studio (DB GUI)** | `@cognitive-engine/shared` | http://localhost:4983        | 4983 |

---

## Workspace Management Commands

All development commands work consistently from the repository root:

| Command             | Action                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`          | Run all applications (`apps/web`, `apps/api`) concurrently with hot reload |
| `pnpm build`        | Build all packages and applications in dependency order via Turborepo      |
| `pnpm lint`         | Run ESLint across all workspaces                                           |
| `pnpm typecheck`    | Run TypeScript type checking (`tsc --noEmit`) across all workspaces        |
| `pnpm format`       | Automatically format all files with Prettier                               |
| `pnpm format:check` | Verify formatting without modifying files                                  |
| `pnpm db:generate`  | Generate SQL migration files from Drizzle schema                           |
| `pnpm db:migrate`   | Apply pending migrations to the PostgreSQL database                        |
| `pnpm db:studio`    | Launch Drizzle Studio database manager UI                                  |
| `pnpm clean`        | Clean all build artifacts, `.next` caches, and `node_modules`              |

---

## Infrastructure Verification

After running `pnpm dev`, verify that the system infrastructure is running properly:

1. **Verify API Root:**

   ```bash
   curl http://localhost:3001/
   # Returns: {"status":"ok"}
   ```

2. **Verify API & Database Health:**

   ```bash
   curl http://localhost:3001/health
   # Returns: {"healthy":true,"services":{"api":"ok","database":"ok"},...}
   ```

3. **Verify Web App:**
   Open http://localhost:3000 in your browser.

---

> _For coding standards, git workflows, and naming conventions, see the other guides in `docs/development/`._
