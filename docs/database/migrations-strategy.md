# Migrations Strategy

> How we manage database schema changes safely and reproducibly.

---

## Tool

**Drizzle Kit** — the migration tooling companion to Drizzle ORM.

## Workflow

```
1. Modify schema in TypeScript (packages/shared/src/db/schema/)
2. Generate migration: pnpm db:generate
3. Review generated SQL
4. Apply to dev: pnpm db:migrate
5. Test thoroughly
6. Commit migration files
7. CI applies to staging automatically
8. Production: manual approval + apply
```

---

## Migration File Naming

```
XXXX_description.sql

Examples:
0001_create_users_table.sql
0002_create_entries_table.sql
0003_add_entry_embeddings.sql
```

---

## Rules

1. **Never modify an applied migration** — Create a new migration instead
2. **Always test rollback** — Every migration should be reversible
3. **No data loss** — Schema changes must preserve existing data
4. **Review SQL** — Auto-generated SQL is reviewed before committing
5. **One concern per migration** — Keep migrations atomic and focused

---

## Environment Strategy

| Environment | Migration Mode            | Approval |
| ----------- | ------------------------- | -------- |
| Local dev   | Auto-apply on start       | None     |
| CI/Preview  | Auto-apply                | None     |
| Staging     | Auto-apply from `develop` | None     |
| Production  | Manual apply              | Required |

---

## Seeding

Development seed data will be maintained in `scripts/seed.ts`:

- Default test user
- Sample entries with various moods and topics
- Pre-computed embeddings for testing
- Sample connections and tags

---

> _Migration tooling will be configured during Phase 1 infrastructure setup._
