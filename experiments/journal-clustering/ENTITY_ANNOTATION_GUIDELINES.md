# Entity Annotation Guidelines & Standard (v1.0)

> **Workspace:** `experiments/journal-clustering/`  
> **Date:** 2026-08-01  
> **Status:** Canonical Specification  
> **Scope:** Defines the ground-truth entity annotation taxonomy, inclusion/exclusion criteria, disambiguation rules, and scoring policies for Cognitive Engine entity extraction benchmarks.

---

## Executive Purpose

To evaluate entity extraction models (regex, LLM, or hybrid) scientifically, we require an unbiased, exhaustive, human-curated ground truth dataset. This document defines the formal annotation protocol applied to all 100 journal entries in `synthetic_journal_entities_ground_truth.json`.

---

## 1. Core Policy Decisions (Pre-Registered)

The following 4 policy questions govern all annotation and evaluation decisions. These rules were established **prior** to ground-truth dataset creation and must be applied consistently without post-hoc modification.

### Question A: Entity Type Mismatch Policy

> **Scenario:** Model predicts `"React"` as `Topic`, but Ground Truth classifies `"React"` as `Tool`.

* **Decision:** **Type Mismatch (Partial Match / Strict Miss)**.
* **Justification:** In a Knowledge Graph engine, node types determine graph schema, valid edge relationships, and search indexing (e.g., `(Project)-[USES_TECHNOLOGY]->(Tool)` vs `(Project)-[BELONGS_TO]->(Topic)`). Assigning an incorrect entity type breaks graph invariants and edge constraints.
* **Scoring Impact:**
  * **Strict Metric (Primary Benchmark):** A type mismatch is scored as a **False Positive** for the predicted category (`Topic`) and a **False Negative** for the target category (`Tool`).
  * **Surface Metric (Secondary Diagnostic):** We separately track **Entity Surface Recall** (name match regardless of type) to isolate entity boundary identification from taxonomy classification.

---

### Question B: Generic References & Role Nouns

> **Scenario:** Text contains `"mom"`, `"dad"`, `"my manager"`, `"the project"`, `"the client"`, `"my professor"`, `"my roommate"`.

* **Decision:** **INTENTIONALLY EXCLUDED** from Ground Truth Entities.
* **Justification:**
  1. Generic nouns, relational roles, and indefinite descriptions lack proper naming. Treating `"mom"` or `"the project"` as a named entity creates node fragmentation, duplicate identity collisions across entries, and invalid graph representations.
  2. Relational roles belong to coreference resolution or edge properties (e.g., `(User)-[RELATION:child_of]->(Person:UnNamed)`), not first-class named entity nodes.
* **Rule:** Only explicitly named proper entities (e.g., `"Rahul"`, `"Priya"`, `"Bangalore"`) or explicitly named project titles (e.g., `"Expense Tracker"`, `"CAT 2026"`) qualify as Ground Truth entities.

---

### Question C: Entity Alias & Synonym Policy

> **Scenario:** Text references `"personal finance tool"`, `"budgeting module"`, or `"ledger"` when referring to the `"Expense Tracker"` project.

* **Decision:** **Canonical Mapping with In-Text Mention Boundary**.
* **Rule:**
  1. The ground truth entry records the **canonical entity name** (e.g., `"Expense Tracker"`) AND the **exact text span** present in the journal entry (e.g., `"personal finance tool"`).
  2. If the model extracts either the exact text span OR the registered canonical entity name, it is scored as a **Valid Match**.
  3. If two distinct entities exist in the domain (e.g., `"Expense Tracker"` vs `"CAT Prep"`), they remain separate entities.

---

### Question D: Tool / Technology vs Topic Boundary

> **Scenario:** Distinguishing between `"React"`, `"Node.js"`, `"PostgreSQL"` vs `"System Design"`, `"Machine Learning"`, `"ACID Compliance"`.

* **Decision:** **Concrete Instrument vs Abstract Domain Discipline**.
* **Boundary Rules:**
  * **`Tool` (Technology / Framework / Product):** Specific, executable software products, libraries, frameworks, databases, tools, or programming languages (e.g., `React`, `Node.js`, `PostgreSQL`, `Drizzle ORM`, `pgvector`, `HDBSCAN`, `DBSCAN`, `Rust`, `Hono`).
  * **`Topic` (Subject / Field / Concept):** Abstract fields of study, domain disciplines, algorithmic methodologies, architectural patterns, or subject matters (e.g., `System Design`, `Machine Learning`, `Density-Based Clustering`, `Hierarchical Clustering`, `ACID Compliance`, `Vector Indexing`, `HNSW`, `Louvain Algorithm`, `Cognitive Science`).

---

## 2. Entity Type Taxonomy & Annotation Rules

The ground truth dataset recognizes 7 first-class entity types matching the Knowledge Graph Ontology (`KNOWLEDGE_GRAPH_ONTOLOGY_V1.md`).

### 2.1 `Person`
* **Definition:** Named human individuals.
* **Inclusion Criteria:** Proper names of individuals (e.g., `Rahul`, `Priya`, `Amit`, `Sneha`, `Karan`, `Neha`, `Rohan`, `Ananya`).
* **Exclusion Criteria:** Generic roles (`mom`, `dad`, `sister`, `colleagues`, `friends`, `client`, `manager`).
* **Representative Examples:** `"Met Rahul at the cafe"` $\rightarrow$ `Person: Rahul`.
* **Ambiguous Example:** `"Called mom for her birthday"` $\rightarrow$ *Excluded* (Generic role).

### 2.2 `Project`
* **Definition:** Named engineering, personal, or professional initiatives spanning multiple tasks.
* **Inclusion Criteria:** Explicitly named projects, tools being built, or exam prep initiatives (e.g., `Expense Tracker`, `CAT 2026`). Also includes explicit descriptive aliases in context (e.g., `personal finance tool`, `budgeting dashboard` when referencing Expense Tracker).
* **Exclusion Criteria:** Generic nouns (`"the project"`, `"the tool"`, `"the app"` without specific descriptive context).
* **Representative Examples:** `"transaction synchronization flow for the personal finance tool"` $\rightarrow$ `Project: Expense Tracker`.

### 2.3 `Organization`
* **Definition:** Companies, institutions, universities, or formal groups.
* **Inclusion Criteria:** Proper names of corporate entities, universities, or providers (e.g., `Clerk`, `Tech Corp`, `University`).
* **Exclusion Criteria:** Generic terms (`"tech cafes"`, `"restaurant"`, `"farmers market"`).
* **Representative Examples:** `"Clerk as the primary auth provider"` $\rightarrow$ `Organization: Clerk`.

### 2.4 `Place`
* **Definition:** Named geographic locations, cities, regions, or specific venues.
* **Inclusion Criteria:** Proper geographic names (e.g., `Bangalore`, `Himachal`, `Mumbai`).
* **Exclusion Criteria:** Generic locations (`"the lake"`, `"cafe"`, `"the woods"`, `"balcony"`, `"hills"`).
* **Representative Examples:** `"Flight to Bangalore"` $\rightarrow$ `Place: Bangalore`.

### 2.5 `Tool` / `Technology`
* **Definition:** Executable software libraries, languages, databases, or algorithms implemented as tools.
* **Inclusion Criteria:** `Node.js`, `React`, `PostgreSQL`, `pgvector`, `Drizzle`, `Hono`, `HDBSCAN`, `DBSCAN`, `Rust`, `WebSocket`, `CSV`.
* **Exclusion Criteria:** Theoretical concepts or abstract subjects without specific tool implementation.
* **Representative Examples:** `"pgvector index build times"` $\rightarrow$ `Tool: pgvector`.

### 2.6 `Topic`
* **Definition:** Subjects of study, academic concepts, or technical domains.
* **Inclusion Criteria:** `Density-Based Hierarchical Clustering`, `Vector Indexing`, `HNSW`, `IVFFlat`, `Louvain Community Detection`, `Transformer Attention Mechanism`, `Cognitive Science`, `ACID Compliance`, `EXPLAIN ANALYZE`.
* **Exclusion Criteria:** Specific software libraries (`React` is Tool, not Topic).
* **Representative Examples:** `"Read the HDBSCAN paper on density-based hierarchical clustering"` $\rightarrow$ `Tool: HDBSCAN`, `Topic: density-based hierarchical clustering`.

### 2.7 `Goal`
* **Definition:** Explicit target objectives, milestones, or exams.
* **Inclusion Criteria:** Explicit milestone targets (e.g., `CAT 2026 Preparation`, `Marathon Training`).
* **Exclusion Criteria:** General feelings or un-targeted activities (`"running 5km"` is fitness activity, not a structured Goal entity unless framed as a milestone).
* **Representative Examples:** `"CAT 2026 preparation"` $\rightarrow$ `Goal: CAT 2026`.

---

## 3. Ground Truth Data Schema

The canonical ground truth dataset `synthetic_journal_entities_ground_truth.json` follows this strict JSON schema:

```json
[
  {
    "id": "entry_001",
    "text": "Met Rahul at the cafe to map out the transaction synchronization flow for the personal finance tool. We decided to prioritize ledger reconciliations over auto-categorization.",
    "entities": [
      {
        "name": "Rahul",
        "type": "Person",
        "text_span": "Rahul"
      },
      {
        "name": "Expense Tracker",
        "type": "Project",
        "text_span": "personal finance tool",
        "aliases": ["personal finance tool", "ledger"]
      }
    ],
    "category": "clean"
  }
]
```

---

## 4. Evaluation Metrics Definition

To evaluate an extraction model against the Ground Truth dataset:

1. **True Positive ($TP$):** Predicted entity matches a Ground Truth entity in both `name/text_span` AND `type`.
2. **False Positive ($FP$):** Predicted entity does NOT match any Ground Truth entity in the entry (or matches name with wrong type).
3. **False Negative ($FN$):** Ground Truth entity was NOT extracted by the model.
4. **Precision ($P$):** $\frac{TP}{TP + FP}$
5. **Recall ($R$):** $\frac{TP}{TP + FN}$
6. **F1 Score ($F_1$):** $\frac{2 \cdot P \cdot R}{P + R}$
7. **Hallucination:** Predicted entity is NOT present in text as a literal substring OR valid semantic match AND has no grounding in the entry.
8. **Hallucination Rate:** $\frac{\text{Hallucinated Entities}}{\text{Total Predictions}}$
9. **Parse Failure Rate:** $\frac{\text{Malformed Responses}}{\text{Total API Calls}}$
