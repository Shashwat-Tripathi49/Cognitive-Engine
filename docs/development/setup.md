# Local Development Setup

> Get Cognitive Engine running locally in under 15 minutes.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Node.js** | ≥ 20.x | [nvm](https://github.com/nvm-sh/nvm) recommended |
| **pnpm** | ≥ 9.x | `npm install -g pnpm` |
| **Git** | ≥ 2.x | [git-scm.com](https://git-scm.com/) |
| **Docker** | ≥ 24.x | [docker.com](https://www.docker.com/) |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/cognitive-engine.git
cd cognitive-engine

# 2. Use the correct Node.js version
nvm use

# 3. Install dependencies
pnpm install

# 4. Start infrastructure (PostgreSQL, Redis)
docker compose up -d

# 5. Set up environment variables
cp .env.example .env.local

# 6. Run database migrations
pnpm db:migrate

# 7. Seed development data
pnpm db:seed

# 8. Start all services in development mode
pnpm dev
```

---

## Services

| Service | URL | Port |
|---|---|---|
| Web app | http://localhost:3000 | 3000 |
| API server | http://localhost:3001 | 3001 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cognitive_engine

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
AUTH_SECRET=your-dev-secret-change-in-production
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
OPENAI_API_KEY=your-openai-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:3001
```

> ⚠️ Never commit `.env.local`. It's in `.gitignore`.

---

## Common Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all services in dev mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files with Prettier |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm db:generate` | Generate migrations from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed development data |
| `pnpm db:studio` | Open Drizzle Studio (database GUI) |
| `pnpm clean` | Clean all build artifacts and node_modules |

---

## Troubleshooting

### Port already in use

```bash
# Find and kill the process
npx kill-port 3000 3001
```

### Database connection refused

```bash
# Ensure Docker containers are running
docker compose ps
docker compose up -d
```

### pnpm install fails

```bash
# Clear pnpm store and retry
pnpm store prune
pnpm install
```

---

## IDE Setup

### VS Code (Recommended)

Install recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense (if used)
- Error Lens
- GitLens

### JetBrains (WebStorm)

- Enable ESLint integration
- Configure Prettier as default formatter
- Enable TypeScript language service

---

> _If you encounter issues not covered here, please open a GitHub Discussion._
