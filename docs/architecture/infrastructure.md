# Infrastructure

> Cloud infrastructure, deployment strategy, and operational architecture.

---

## Deployment Strategy

### Phase 1: Simple & Fast

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel      │     │   Railway /  │     │  Neon /       │
│   (Frontend)  │     │   Fly.io     │     │  Supabase     │
│               │     │   (API)      │     │  (Database)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Rationale**: Minimize operational overhead during early development. Focus engineering time on product, not infrastructure.

### Phase 2: Production-Ready

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel      │     │   AWS ECS /  │     │  AWS RDS     │
│   (Frontend)  │     │   Fargate    │     │  (PostgreSQL) │
│               │     │   (API)      │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                                          ┌──────────────┐
                                          │  ElastiCache │
                                          │  (Redis)     │
                                          └──────────────┘
```

---

## Environment Strategy

| Environment  | Purpose                | Deployment                     |
| ------------ | ---------------------- | ------------------------------ |
| `local`      | Developer machines     | Docker Compose                 |
| `preview`    | PR previews            | Auto-deploy on PR              |
| `staging`    | Pre-production testing | Deploy from `develop`          |
| `production` | Live users             | Deploy from `main` via release |

---

## Docker Architecture

```yaml
# docker-compose.yml (development)
services:
  postgres: # PostgreSQL 16 + pgvector
  redis: # Redis 7
  api: # Backend API (hot reload)
  web: # Frontend (hot reload)
```

> Docker configurations will be added in `infrastructure/docker/` during Phase 1.

---

## Monitoring & Observability

| Concern                | Tool             | Status  |
| ---------------------- | ---------------- | ------- |
| Error tracking         | Sentry           | Planned |
| Application monitoring | Vercel Analytics | Planned |
| Log aggregation        | Axiom / Datadog  | Planned |
| Uptime monitoring      | BetterStack      | Planned |
| Performance            | Web Vitals       | Planned |

---

## Security Infrastructure

| Layer              | Measure                                                       |
| ------------------ | ------------------------------------------------------------- |
| **Network**        | HTTPS everywhere, HSTS headers                                |
| **Application**    | Input validation, CSRF protection, rate limiting              |
| **Data**           | Encryption at rest (AES-256), encryption in transit (TLS 1.3) |
| **Authentication** | OAuth 2.0, secure token storage, session rotation             |
| **Secrets**        | Environment variables, never in code                          |
| **Dependencies**   | Automated vulnerability scanning (Dependabot / Renovate)      |

---

## Backup & Recovery

| Data         | Strategy                                    | RPO    | RTO     |
| ------------ | ------------------------------------------- | ------ | ------- |
| PostgreSQL   | Automated daily backups + WAL archiving     | 1 hour | 4 hours |
| Redis        | AOF persistence (non-critical, rebuildable) | N/A    | Minutes |
| User uploads | Object storage with versioning              | 0      | 1 hour  |

---

> _Infrastructure decisions will be formalized as the product approaches deployment. See [tech-stack.md](tech-stack.md) for technology choices._
