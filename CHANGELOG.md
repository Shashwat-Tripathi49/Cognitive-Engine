# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-alpha] - 2026-07-28

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

---
