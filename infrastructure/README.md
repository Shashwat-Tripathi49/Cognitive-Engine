# ☁️ Infrastructure

> Infrastructure-as-Code, Docker configurations, and deployment manifests.

---

## Contents

| Directory    | Purpose                              | Status     |
| ------------ | ------------------------------------ | ---------- |
| `docker/`    | Docker Compose for local development | ⏳ Planned |
| `terraform/` | Cloud infrastructure provisioning    | 🔮 Future  |

## Local Development Infrastructure

Docker Compose will provide:

- **PostgreSQL 16** with pgvector extension
- **Redis 7** for caching and job queues

```bash
# Start infrastructure
docker compose up -d

# Stop infrastructure
docker compose down

# Reset (destroy volumes)
docker compose down -v
```

## Cloud Infrastructure (Future)

Cloud deployment will be managed via Terraform or Pulumi:

- **Compute**: AWS ECS / Fargate or Vercel
- **Database**: AWS RDS (PostgreSQL) or Neon
- **Cache**: AWS ElastiCache (Redis) or Upstash
- **Storage**: AWS S3 for user uploads
- **CDN**: CloudFront or Vercel Edge Network

---

> _Infrastructure will be set up during Phase 1, Milestone 1.1._
