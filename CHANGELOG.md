# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-alpha.2] - 2026-07-29

### Added

- **Sprint 1B — Cognitive Fragment & Capture Engine Vertical Slice**:
  - `CognitiveFragment` Domain Model: Immutable raw cognitive thought representation (`id`, `userId`, `content`, `modality`, `contentHash`, `capturedAt`, `metadata`).
  - Drizzle PostgreSQL Database Schema: Created `cognitive_fragments` table in `packages/shared/src/db/schema.ts` with B-Tree indexes on `user_id`, `content_hash`, and `captured_at`.
  - Drizzle SQL Migration: Generated `drizzle/0000_tidy_firedrake.sql`.
  - Repository Layer: `ICognitiveFragmentRepository` interface and `DrizzleCognitiveFragmentRepository` implementation (`create`, `findById`).
  - Capture Engine Application Service: Deterministic `CaptureEngine` performing input validation, whitespace normalization, and SHA-256 cryptographic hashing.
  - API Endpoints: `POST /capture` and `GET /capture/:id` with Zod schema validation and structured HTTP error responses (400 `INVALID_INPUT`, 404 `NOT_FOUND`, 500 `PERSISTENCE_ERROR`).
  - Test Suite: 14/14 unit & integration tests passing in Vitest (`pnpm test`).

- **Sprint 1A — Monorepo & Project Foundation**:
  - Turborepo v2.10 + pnpm v9.15 workspace layout (`apps/web`, `apps/api`, `packages/shared`, `packages/config`, `packages/ui`).
  - Next.js 15 App Router client (`apps/web`).
  - Hono API Server (`apps/api`) with `GET /` and `GET /health` endpoints.
  - PostgreSQL 16 + `pgvector` Docker Compose setup (`docker-compose.yml`).
  - Drizzle ORM client, Drizzle Kit config, and Zod environment schema validation (`@cognitive-engine/shared/env`).
  - Shared TypeScript, ESLint, and Prettier configuration presets (`@cognitive-engine/config`).

---

## [0.1.0-alpha.1] - 2026-07-28

### Added

- **Repository Scaffold & Engineering Baseline**: Monorepo structure (Turborepo + pnpm), CI workflow, issue/PR templates, coding standards, and development guidelines.
- **Product & System Documentation**: Product vision, 5-phase roadmap, user stories, system overview, tech stack, and ADRs (`docs/product/`, `docs/architecture/`, `docs/ux/`, `docs/ai/`, `docs/database/`, `docs/api/`, `docs/development/`).
- **Core Cognitive Architecture**: Complete architecture for the 6 core domain engines in `docs/cognitive/`:
  - `Capture Engine` (Ingestion & normalization)
  - `Memory Engine` (Persistence & vector retrieval)
  - `Knowledge Graph Engine` (Canonical entities, typed relationships, graph topology)
  - `Cognitive Engine` (100% deterministic spatial clustering, time-series math, pattern discovery)
  - `Reasoning Engine` (Logical validation & Evidence Chain construction)
  - `Reflection Engine` (Metacognitive prose synthesis constrained to validated evidence)
- **Domain Model Specification**: Technology-agnostic domain model in `docs/domain/`:
  - Bounded Context definitions across all 6 engines (`domain-model.md`)
  - Full specifications for 19 core domain objects (`domain-objects.md`)
  - Traceability & Evidence System architecture (`evidence-model.md`)
  - 7-step evolutionary lifecycle & state diagrams (`object-lifecycle.md`)
  - Ownership & Access Matrix (`ownership-matrix.md`)
  - Domain Events catalog with schemas (`domain-events.md`)
  - 10 Non-Negotiable System Invariants (`domain-invariants.md`)
  - Authoritative Domain Glossary (`glossary.md`)
