# Cognitive Engine — Agent Instructions

Operating manual for coding agents working in this repository.

This file tells you what the project is, where the authoritative rules live, and how to
make changes without accidentally weakening a validated architectural guarantee.

It does **not** restate the architecture. When a rule matters, this file points at the
document that defines it. Read the source document before acting on its summary.

---

## 1. Project Identity

Cognitive Engine is an AI-native platform for human thought augmentation: it captures,
structures, and reflects on connected thought patterns so a user can think more clearly
and decide with more confidence.

It is **not** a journaling application. Entries are not the unit of value; the connected
evidence graph is. `README.md` states this explicitly, and the architectural consequence
is real — features that only make sense for a note-taking app (folders, tags, note
search as a primary interface) are out of scope unless they serve the cognitive pipeline.

- License: MIT. Version: `0.1.0-alpha`.
- Upstream: `https://github.com/Shashwat-Tripathi49/Cognitive-Engine`

## 2. Mission and Architectural Intent

The long-term objective, per `docs/architecture/ARCHITECTURE_BASELINE_V1.md`, is a
deterministic, evidence-bound cognitive partner that can always trace every generated
synthesis back to immutable source evidence **without LLM hallucination**.

Two consequences shape almost every decision in this codebase:

1. **Determinism before intelligence.** Discovery, scoring, clustering, and logical
   validation are computed by deterministic code. LLM usage is strictly bounded and
   explicitly approved by the architecture: Reflection for synthesis, and Knowledge Graph
   for the one approved entity-extraction path (§9). No other engine may introduce LLM
   usage (§8, Invariant 8).
2. **Traceability is structural, not best-effort.** Evidence lineage is enforced at the
   domain-object and database level, not by convention.

## 3. Source of Truth / Document Precedence

When sources disagree, use this order. Do not pick the convenient one.

| Priority | Source | Role |
|---|---|---|
| 1 | `docs/domain/domain-invariants.md` | The 10 non-negotiable invariants. Highest authority. Violating one is a defect, not a style choice. |
| 2 | `docs/architecture/ARCHITECTURE_BASELINE_V1.md` | Validated decisions, rejected assumptions, engine boundaries. |
| 3 | `docs/reviews/PHASE_1_FINAL_AUDIT.md` | Phase gate. Carries the standing constraint in §11. |
| 4 | `docs/architecture/ENTITY_RESOLVER_SPECIFICATION_V2.md` | Normative contract for Engine 3 identity, bitemporality, and schema. |
| 5 | `docs/cognitive/*.md` | Per-engine responsibility, including explicit "what it does NOT do" lists. |
| 6 | `docs/domain/*.md` | 19 domain objects, 9 domain events, evidence model, ownership matrix. |
| 7 | `docs/architecture/decisions/` | ADRs. Accepted decisions are binding; superseding one requires a new ADR. |
| 8 | Source code + tests | Implementation evidence and current executable behavior. |
| 9 | `.github/workflows/ci.yml` | The operational definition of "done". |
| 10 | `README.md`, `docs/product/roadmap.md`, `apps/web/README.md` | **Frequently stale.** See §12. Never use to override 1–9. |

### Where to Look First

| You are changing | Read first |
|---|---|
| Anything touching evidence, memory, or patterns | `docs/domain/domain-invariants.md` |
| Engine responsibilities or pipeline order | `docs/cognitive/README.md`, `docs/cognitive/cognitive-pipeline.md` |
| A domain object or event | `docs/domain/domain-objects.md`, `docs/domain/domain-events.md` |
| Entity identity, merge, alias, or bitemporal queries | `docs/architecture/ENTITY_RESOLVER_SPECIFICATION_V2.md` |
| Database schema or persistence | `docs/database/`, `packages/shared/src/db/` |
| TypeScript style, naming, error handling | `docs/development/coding-standards.md`, `docs/development/naming-conventions.md` |
| Commit or branch process | `docs/development/git-workflow.md`, `CONTRIBUTING.md` |
| Test layout and intent | `docs/development/testing-strategy.md` |

## 4. Repository Structure

pnpm workspaces + Turborepo. Workspace globs are `apps/*` and `packages/*`
(`pnpm-workspace.yaml`).

```
apps/
  web/            Next.js 15 App Router frontend. Dev port 3005. Clerk auth.
  api/            Hono backend. Port 3001 (env.PORT || 3001). Zod validation.
  mobile/         React Native / Expo. NOT at parity with web — see §12.
packages/
  shared/         Core domain implementation. All six engines live here.
  ui/             Shared React components and design tokens.
  config/         Shared tsconfig / eslint / prettier presets.
docs/             Architecture, domain, cognitive, AI, API, DB, UX, product, reviews.
experiments/      Empirical research spikes. Evidence behind validated decisions.
scripts/          Verification and benchmark tooling.
infrastructure/   IaC and deployment config.
tests/integration/ Cross-package integration test (single file).
```

**`packages/shared/src/` is where the domain actually lives**, one directory per engine:
`capture/`, `memory/`, `kg/`, `cognitive/`, `reasoning/`, `reflection/`, plus `db/` and
`env.ts`. Co-located tests live in each engine's `__tests__/`.

### Directories that are NOT project source

- **`Cognitive-Engine/`** — a nested duplicate Git repository with its own history,
  remote, and uncommitted work. Ignored by the root repo. **Do not read from it as
  evidence, edit it, or push from it.** Treat the root repo as the only project.
- **`.omo/`** — plugin runtime/session state. Rewritten continuously. Ignored.

## 5. Technology Stack

Full rationale and rejected alternatives: `docs/architecture/tech-stack.md`.

| Layer | Technology |
|---|---|
| Language | TypeScript 5.x, `strict: true` |
| Runtime | Node.js 20 (`.nvmrc`; CI uses `node-version-file`) |
| Frontend | Next.js 15 (App Router), React 19 |
| Backend | Hono 4 on `@hono/node-server` |
| Database | PostgreSQL 16 + pgvector (`docker-compose.yml`) |
| ORM | Drizzle ORM + drizzle-kit |
| Validation | Zod (env schema in `packages/shared/src/env.ts`) |
| Embeddings | `@xenova/transformers`, `all-MiniLM-L6-v2`, 384-dim |
| Auth | Clerk (`@clerk/nextjs`), JWT verified in API middleware |
| Monorepo | Turborepo 2.x |
| Package manager | pnpm 9.x (`packageManager` pinned; CI uses `--frozen-lockfile`) |
| Unit/integration tests | Vitest 3 |
| Lint/format | ESLint 8 + Prettier 3, via `@cognitive-engine/config` |

Never use `npm install -g`, and do not add dependencies casually — see
`docs/development/dependency-management.md`. Adding an LLM SDK to a deterministic engine
is an architectural change, not a dependency change (§8, Invariant 4).

## 6. Six Core Engines

Pipeline order is fixed. Each engine has an explicit "what it does NOT do" list in
`docs/cognitive/` — respect it, because boundary leakage is the most common regression
in this codebase.

| # | Engine | Responsibility | Implementation | Spec |
|---|---|---|---|---|
| 1 | **Capture** | Ingest and normalize any modality into immutable Cognitive Fragments. No interpretation. | `packages/shared/src/capture/` | `docs/cognitive/capture-engine.md` |
| 2 | **Memory** | Embed, index, retrieve. Vector similarity + decay metadata. No clustering. | `packages/shared/src/memory/` | `docs/cognitive/memory-engine.md` |
| 3 | **Knowledge Graph** | Canonical entities, typed edges, graph topology, identity resolution. | `packages/shared/src/kg/` | `docs/cognitive/knowledge-graph-engine.md` |
| 4 | **Cognitive** | Deterministic clusters, temporal sequences, patterns, confidence. Zero LLM. | `packages/shared/src/cognitive/` | `docs/cognitive/cognitive-engine.md` |
| 5 | **Reasoning** | Formal logic validation, hypothesis verification, Evidence Chain construction. | `packages/shared/src/reasoning/` | `docs/cognitive/reasoning-engine.md` |
| 6 | **Reflection** | Metacognitive prose synthesis from validated evidence. **Only engine permitted to perform LLM-based synthesis / prose generation.** | `packages/shared/src/reflection/` | `docs/cognitive/reflection-engine.md` |

Data flow: `Capture → Memory → Knowledge Graph → Cognitive → Reasoning → Reflection`.
Reflection additionally reads the Knowledge Graph's traceability chain.

Infrastructure (queues, scheduling, circuit breakers) coordinates execution but is **not**
a domain engine.

## 7. Domain Model

19 core domain objects, defined in `docs/domain/domain-objects.md`:

CognitiveFragment, MemoryNode, Embedding, GraphNode, GraphEdge, KnowledgeGraphSubgraph,
Cluster, TemporalSequence, Pattern, AlgorithmicConfidence, ReasoningArtifact,
EvidenceChain, EvidenceReference, EvidenceProvenance, MetacognitiveReflection,
ReflectionReport, SourceReference, Context, Session.

Nine domain events: `FragmentCaptured`, `MemoryEncoded`, `MemoryDecayed`,
`GraphNodeCreated`/`GraphEdgeCreated`, `ClusterFormed`, `PatternDiscovered`,
`ReasoningArtifactCreated`, `EvidenceChainVerified`, `ReflectionGenerated`
(`docs/domain/domain-events.md`).

Supporting specs: `docs/domain/evidence-model.md`, `docs/domain/object-lifecycle.md`,
`docs/domain/ownership-matrix.md`, `docs/domain/glossary.md`.

**Preserve these contracts.** Renaming, removing, or reshaping a domain object or event is
an architectural change requiring an ADR and explicit approval — not a refactor.

## 8. Non-Negotiable Invariants

Defined authoritatively in `docs/domain/domain-invariants.md`. Summarized here for
recognition only; **that document is binding and its exact wording and enforcement
mechanisms govern.** The file states any operation violating an invariant "is invalid and
must throw a domain boundary error" — so a violating path must fail loudly rather than
degrade gracefully.

1. **Evidence Lineage** — a Reflection cannot exist without a verified EvidenceChain.
2. **Evidence Fragment Integrity** — evidence cannot reference deleted or non-existent fragments.
3. **Confidence Origin** — confidence scores are computed deterministically, never emitted by an LLM.
4. **Deterministic Discovery** — clusters, sequences, patterns, and edges come from math and graph algorithms, never LLM prompting. *Verified in code: `packages/shared/src/cognitive/` imports no LLM SDK.*
5. **Immutable Memory** — `CognitiveFragment.raw_content` and `MemoryNode.content` never mutate. Updates alter decay metadata or create versioned nodes.
6. **Graph Node Versioning** — updates increment `version` and produce a new immutable record; nothing is overwritten.
7. **Minimum Evidence Threshold** — a Pattern requires `N_samples >= 3`. Fewer is noise.
8. **LLM Boundary** — LLMs read pre-validated data to write prose. They do not invent facts, edges, or scores. Generated prose is verified against the linked EvidenceChain.
9. **Storage/Graph Separation** — vector space and graph topology stay decoupled. Traversal uses explicit edges, never similarity thresholds.
10. **Non-Destructive Decay** — decay to 0.00 transitions a MemoryNode to `Archived`. Hard deletion is prohibited at the domain level.

Invariants 3, 4, 7, and 8 are covered by dedicated tests
(`cognitive/__tests__/determinism.test.ts`, `anti-leakage.test.ts`,
`kg/__tests__/invariants.test.ts`, `reasoning/__tests__/contracts.test.ts`,
`reflection/__tests__/validator.test.ts`). If you break an invariant, expect these to
fail — do not "fix" the test.

## 9. Architectural Boundaries

- **Pipeline order is fixed.** Downstream engines consume upstream domain events. Do not
  invert dependencies or let an engine reach around its predecessor.
- **One engine, one concern.** Each `docs/cognitive/*.md` has a "What It Does NOT Do"
  table. Adding a neighboring engine's responsibility is a boundary violation even if
  tests pass.
- **The LLM boundary is narrow and real.** LLM usage is strictly bounded and explicitly
  approved by the architecture. It exists in exactly two places:
  - **Reflection synthesis** (`reflection/transport/`, a dual-provider transport with Groq
    primary and Gemini fallback) — Reflection is the only engine permitted to perform
    LLM-based synthesis or prose generation.
  - **Knowledge Graph entity extraction** (`kg/extraction/groq-provider.ts`, guarded by
    `validator.ts` and a deterministic mock provider). This is the specifically approved
    path and it may only operate inside its validated deterministic extraction and
    validation boundary, subject to the standing Phase 2 constraint in §11.

  No other engine may introduce LLM usage, and no existing path may be widened. LLMs must
  never become the authoritative source of facts, graph edges, confidence scores, or any
  other deterministic domain value (§8, Invariants 3 and 8).
- **Multi-tenancy is enforced at the backend.** `userId` comes from the verified Clerk
  context, never from a client payload, and reads filter on it. This is a validated
  Sprint 1C-A decision — do not relax it.
- **Evidence must remain traceable to raw fragments** at every layer.

## 10. Current Implementation Baseline

Verified by inspection on the `feature/CE-xxx-agents-md` branch at `70bef9c`.

| Area | State | Notes |
|---|---|---|
| Capture Engine | Implemented | `capture/engine.ts`, repositories, `POST /capture`, `GET /capture/:id` |
| Memory Engine | Implemented | 384-dim MiniLM embeddings, pgvector storage, similarity search |
| Knowledge Graph Engine | Implemented, **partially diverging from V2 spec** | `kg/extraction/`, `kg/resolution/resolver.ts`. See §11. |
| Cognitive Engine | Implemented, deterministic | `kg`-independent; determinism and anti-leakage tests present |
| Reasoning Engine | Implemented, deterministic | `rules/`, Evidence Chain construction, multi-tenancy tests |
| Reflection Engine | Implemented | Dual-provider transport, validator, adversarial + fallback tests |
| Web frontend | Functional | Next.js App Router; `page.tsx` is a full journal composer. Clerk-gated. Routes: `/`, `/archives`, `/search`, `/insights`, `/sign-in`, `/sign-up` |
| API | Functional | Six route modules, one per engine |
| Entity Resolver V2 | **Specified, not implemented** | See §11 |
| Mobile | Scaffold only | No `apps/mobile/package.json`. Excluded from the pnpm workspace. |

Test inventory: 27 co-located test files under `packages/shared/src/**/__tests__/`
(including `m7b-pipeline.e2e.test.ts`) plus `tests/integration/semantic-retrieval.test.ts`.

**No `vitest.config.*` exists in the repo.** Vitest runs on defaults despite
`docs/development/testing-strategy.md` referencing `packages/config/vitest`. Tests resolve
via the package `exports` map in `packages/shared/package.json`, which points at `./src`
TypeScript directly — so this works in dev and can break under a different runner config.
Do not add a config file casually; it changes module resolution for all 27 test files.

## 11. Frozen / Validated Areas

Treat these as frozen. Changes require explicit human approval, and architectural ones
require an ADR.

**Architecture Baseline v1.0** (`docs/architecture/ARCHITECTURE_BASELINE_V1.md`) records
validated decisions and, importantly, **rejected assumptions with numeric disproof**. Do
not reintroduce them:

- Lexical TF-IDF for theme discovery — ARI `0.038` at N=20, `0.220` at N=100. Dense
  embeddings achieved ARI `0.42–0.54`. Dense embeddings only.
- DBSCAN / density clustering on sparse cold-start data — 90% noise at N=20, 61.3% at
  N=50. **Spatial clustering UI must stay suppressed until N >= 50.**
- Knowledge Graph node creation derived from vector spatial clusters — rejected; boundary
  ambiguity. Nodes come from deterministic extraction on individual Memory items.

**Standing Phase 2 constraint** (`docs/reviews/PHASE_1_FINAL_AUDIT.md`): un-guided entity
extraction is **disqualified** after a measured 38.10% hallucination rate against a 2.0%
ceiling. Engine 3 is permitted **only** under the condition that entity creation requires
human confirmation or a strict deterministic canonical resolution layer. Any change that
lets a model create entities without one of those violates an approved audit gate.

**Entity Resolver V2 — specification ahead of implementation.**
`docs/architecture/ENTITY_RESOLVER_SPECIFICATION_V2.md` is authoritative for the intended
design and states its own status as "SPECIFIED (NOT IMPLEMENTED)". Confirmed on
inspection:

- The spec targets `packages/shared/src/entities/resolver.ts`. **That path does not exist.**
- A resolver exists at `packages/shared/src/kg/resolution/resolver.ts`, but it contains
  none of the V2 bitemporal vocabulary (`effective_from`, `decided_at`,
  `entity_mutation_log`, reclassification, supersession). It is not a V2 implementation.
- The spec's normative SQL functions and six-table schema are not deployed.

Therefore: **inspect before assuming V2 semantics exist.** Do not build on
`resolveAsEffectiveAt` / `resolveAsKnownAt` as though they were callable. Do not silently
replace, weaken, or bypass the resolver architecture — if a task touches entity identity,
merge/split, aliases, or point-in-time queries, stop and surface the spec/implementation
gap before writing code.

## 12. Known Gaps and Documentation Drift

Stale claims you will encounter. Code and tests are the tiebreaker for *current state*;
architecture docs remain authoritative for *contract*.

- `README.md` and `docs/product/roadmap.md` state no application code has been written and
  that Phase 0 is current. Both engines and a working frontend exist.
- `apps/web/README.md` says "Not yet initialized."
- `docs/development/testing-strategy.md` cites coverage targets (≥90% shared, ≥80% api,
  ≥70% web) and config paths that do not exist. **CI enforces no coverage gate.** Treat
  the percentages as aspirational; verify with a run.
- No Playwright config or E2E suite exists despite the documented E2E layer.
- `apps/mobile` is referenced by `README.md` and ADR-001 but has no manifest.
- Several docs contain `file:///C:/Users/...` absolute links from another machine. Broken;
  use repo-relative paths.

Do not "fix" drift in an unrelated task. Report it, or file it separately. Silently
rewriting architecture docs to match code destroys the record of why a decision was made.

## 13. Development Workflow

```bash
pnpm install                # workspace install
nvm use                     # Node 20 per .nvmrc
docker compose up -d        # PostgreSQL 16 + pgvector on 5432
pnpm db:generate && pnpm db:migrate
pnpm dev                    # all services (web :3005, api :3001)
```

Full onboarding: `docs/development/setup.md`.

Root scripts (from `package.json`):

| Command | Does |
|---|---|
| `pnpm dev` | All dev servers via Turborepo |
| `pnpm build` | `turbo build` |
| `pnpm lint` | `turbo lint` |
| `pnpm typecheck` | `turbo typecheck` |
| `pnpm test` | `turbo test` |
| `pnpm test:integration` | `vitest run tests/integration` |
| `pnpm format` / `format:check` | Prettier |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Drizzle |
| `pnpm verify:m7b` | Milestone 7B verification script |

Scope to one workspace with pnpm filters:
`pnpm --filter @cognitive-engine/web dev`.

`pnpm dev` is a **persistent** Turborepo task. If you launch it through a non-interactive
harness it will be killed at timeout — run it detached (`nohup ... &`) and verify with
`lsof -i :3005` plus `curl -s -o /dev/null -w '%{http_code}' http://localhost:3005/`.
Note `/` returns `307` to `/sign-in` because of Clerk middleware.

Husky pre-commit hooks run lint-staged (Prettier + ESLint `--fix` on `*.ts,tsx`;
Prettier on json/md/yaml).

## 14. Testing and Verification

CI (`.github/workflows/ci.yml`) runs three gated jobs on pushes and PRs to `main` and
`develop`: **lint + typecheck → test → build**. Each is a gate; a red earlier job blocks
later ones.

Run the narrowest relevant check first, then broaden:

```bash
pnpm --filter @cognitive-engine/shared test          # one package
pnpm --filter @cognitive-engine/shared typecheck
pnpm --filter @cognitive-engine/web test
pnpm typecheck && pnpm test && pnpm build            # full gate before commit
```

**Verification breadth should match blast radius:**

| Change touches | Minimum verification |
|---|---|
| One function, no contract change | package-level `typecheck` + `test` |
| A domain object or event | `shared` tests, incl. reasoning contracts + reflection validator |
| Engine boundary or pipeline order | all of `shared`, plus full `typecheck`, `lint`, `build` |
| Invariants, persistence, or schema | `shared` tests, `pnpm build`, and say explicitly which invariant is enforced by which test |
| Cross-package or `packages/shared` exports | full gate: `pnpm typecheck && pnpm test && pnpm build` |

There is no coverage gate in CI, so passing tests is the floor, not proof. If you claim
verification, name the command and its result. Do not report success from a command that
timed out or was interrupted.

## 15. Git and Change Management

Documented conventions: `docs/development/git-workflow.md`, `CONTRIBUTING.md`.

- **Actual branch state:** only `main` exists locally and remotely. There is **no
  `develop` branch today**, despite the workflow doc and CI both referencing one. Branch
  from `main` and say so when the divergence matters.
- Branch naming: `feature/CE-xxx-description`, `fix/CE-xxx-description`, `chore/...`,
  `hotfix/...`, `release/vX.Y.Z`. The `CE-xxx` is a placeholder for a ticket id.
- Commits follow Conventional Commits: `type(scope): description`. Existing history is
  mostly free-form — do not imitate the recent commits, follow the documented convention.
- `main` is described as protected in docs. Treat it that way: work on a branch.

Rules:

- **Never commit or push unless explicitly instructed.**
- **Never rewrite history** (`rebase`, `reset --hard`, `filter-repo`, force push) without
  explicit instruction.
- Review `git status --short` and `git diff` before every commit.
- Stage only intended files. Never `git add -A` here — the root tree contains nested
  repositories and build artifacts that must not be staged.
- Root `main` and the ignored nested clone have unrelated histories pointing at the same
  remote. Never push from `Cognitive-Engine/`.

## 16. Security and Secrets

- `.env` and `.env.local` are sensitive. `.env*` is gitignored (`.gitignore`).
- **Never print, copy, commit, or paste API keys, tokens, or credentials into code,
  docs, tests, chat, or logs.** Redact in output.
- Do not inspect secret values unless the task requires it. Prefer confirming *presence*
  and *shape* (env var name, length, prefix) over reading values.
- `.env.example` contains placeholders and one local-dev `DATABASE_URL`. Keep it
  placeholder-only. If a real credential appears in any tracked file, treat it as
  compromised and report it — do not commit a fix alongside unrelated work.
- The repo is **public**. Anything pushed is disclosed.
- Report vulnerabilities per `SECURITY.md`.

## 17. Agent Operating Rules

For any non-trivial change:

1. **Inspect before editing.** Read the implementation, its tests, and the governing doc.
   Do not infer architecture from file names.
2. **Locate the contract.** Which invariant, ADR, or engine spec governs this change?
   If none does, say so — that is itself a finding.
3. **Decide whether the change crosses a boundary.** If it touches an engine boundary,
   invariant, domain contract, persistence, or the Entity Resolver, treat it as
   architectural: propose it, get approval, do not just implement it.
4. **Make the smallest correct change.** Preserve public APIs and domain contracts unless
   the task explicitly changes them. Prefer a focused fix to a broad refactor.
5. **Preserve invariants.** Never weaken, bypass, or re-scope an invariant to make a test
   pass. Never use `as any`, `@ts-ignore`, or `@ts-expect-error` to silence a real type
   error.
6. **Verify.** Run the narrowest relevant checks, then broaden per §14. Report actual
   command output.
7. **Review the diff.** Confirm only intended files changed and no secrets or build
   artifacts are staged.
8. **Report honestly.** State what changed, what was verified and how, and any
   unresolved contradiction, risk, or unverified claim.

### Handling disagreement between code, tests, and docs

- **Doc contradicts code (stale README/roadmap):** the architectural document governs the
  contract; the code governs current behavior. Report the drift. Do not edit architecture
  docs to match code as a side effect.
- **Test contradicts a documented invariant:** the invariant wins. A failing invariant test
  is the system working. Do not relax the assertion.
- **Code contradicts a documented invariant:** this is a real defect. Report it
  prominently. Do not "fix" it by adjusting the doc.
- **Two authoritative docs conflict:** do not choose silently. Surface both with citations
  and ask.
- **A spec describes unimplemented behavior** (as with Entity Resolver V2): treat it as a
  design target, not existing capability. Verify against code before building on it.

### Do not

- Redesign an engine, rename a domain object, or restructure the pipeline unprompted.
- Introduce an LLM call where an invariant requires determinism.
- Add a dependency to change behavior the invariants govern.
- Edit `docs/architecture/`, `docs/domain/`, or `docs/reviews/` as incidental cleanup.
- Create or modify `AGENTS.md` content rules without being asked to.

## 18. Quick Reference

```bash
pnpm install && nvm use
docker compose up -d && pnpm db:generate && pnpm db:migrate
pnpm dev                      # web :3005, api :3001

pnpm --filter @cognitive-engine/shared test
pnpm --filter @cognitive-engine/shared typecheck
pnpm typecheck && pnpm test && pnpm build
```

| Path | What it governs |
|---|---|
| `docs/domain/domain-invariants.md` | The 10 invariants — read before touching evidence, memory, patterns |
| `docs/architecture/ARCHITECTURE_BASELINE_V1.md` | Validated decisions, rejected assumptions, engine boundaries |
| `docs/reviews/PHASE_1_FINAL_AUDIT.md` | Phase 2 gate; entity-extraction constraint |
| `docs/architecture/ENTITY_RESOLVER_SPECIFICATION_V2.md` | Engine 3 identity contract — specified, not implemented |
| `docs/cognitive/README.md` | Engine map and "what it does NOT do" tables |
| `docs/domain/domain-objects.md` | 19 domain objects |
| `docs/domain/domain-events.md` | 9 domain events |
| `docs/development/coding-standards.md` | TypeScript rules, error handling |
| `docs/development/git-workflow.md` | Branching and commit convention |
| `.github/workflows/ci.yml` | The three gates that define "done" |
| `packages/shared/src/` | All six engine implementations |
