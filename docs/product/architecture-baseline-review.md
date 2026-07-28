# Architecture Baseline Review (v0.1)

> **Document Status:** Baseline Review v0.1 — Subject to implementation feedback through RFCs
> **Scope:** Architectural terminology realignment, evolutionary framing, and drift prevention.

---

## 1. Evolutionary Language Alignment

To encourage disciplined evolution without architectural drift, all references to rigid or immovable concepts across the repository must be aligned with an **RFC-driven evolutionary model**.

### Terminology Mapping

| Legacy Term | Baseline v0.1 Term | Rationale |
|---|---|---|
| Frozen | Architecture Baseline v0.1 | Allows structured evolution via RFCs while preserving baseline stability. |
| Final | Current Baseline | Clarifies that the current state is the reference design for Phase 1 validation. |
| Permanent | System Invariant (v0.1) | Distinguishes core philosophical rules from implementation details. |
| Immutable Architecture | Evolving Foundation | Indicates that contracts may evolve through empirical feedback. |

---

## 2. Review of Core Domain Invariants

The 10 Domain Invariants defined in `docs/domain/domain-invariants.md` represent the **Current Baseline** for Phase 1. They are not permanent dogma; they are testable design constraints.

### Invariant Status in Baseline v0.1

1. **Evidence Lineage Invariant:** *Active Baseline.* Required for trust verification.
2. **Evidence Fragment Integrity Invariant:** *Active Baseline.* Protects against orphan evidence.
3. **Confidence Origin Invariant:** *Active Baseline.* Prevents LLMs from fabricating certainty scores.
4. **Deterministic Discovery Invariant:** *Target for Validation.* Currently undergoing algorithmic experimentation (`experiments/journal-clustering/`).
5. **Immutable Memory Invariant:** *Active Baseline.* Ensures historical thought preservation.
6. **Graph Node Versioning Invariant:** *Active Baseline.* Preserves topology history.
7. **Minimum Evidence Threshold Invariant ($N \ge 3$):** *Subject to RFC Validation.* Threshold will be evaluated against entry counts (20, 50, 100 entries).
8. **LLM Boundary Invariant:** *Active Baseline.* Restricts LLMs to explaining validated evidence.
9. **Separation of Storage and Graph Invariant:** *Active Baseline.* Decouples vector search from property graph traversal.
10. **Non-Destructive Decay Invariant:** *Active Baseline.* Prevents accidental data loss.

---

## 3. RFC Process for Architectural Evolution

Any proposed change to the Architecture Baseline v0.1 must follow the **Request for Comments (RFC)** process:

1. **Problem Statement:** Identify empirical friction or failure in the current baseline during implementation or experimentation.
2. **Evidence:** Provide test data or benchmark results (e.g., from `experiments/journal-clustering/`).
3. **Proposed Revision:** Detail the exact contract or architecture change.
4. **Impact Assessment:** Map downstream effects on Evidence Chains and LLM boundaries.
5. **Approval:** Require lead architect review before updating `docs/cognitive/` or `docs/domain/`.
