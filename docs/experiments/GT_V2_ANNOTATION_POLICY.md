# Cognitive Engine — Ground-Truth V2 Annotation Policy & Specification

> **Document Type:** Benchmark Annotation Policy & Operational Measurement Specification  
> **Target Scope:** Ground-Truth V2 Dataset for Entity Extraction & Entity Resolution  
> **Status:** Amended Policy Specification (Stage 2 Locked Candidate)  
> **Governing Principle:** Ground-truth definitions are established purely on formal cognitive ontology and operational measurement contracts, independent of model performance or benchmark scores.

---

## 1. Core Architectural Separation & Ingestion Boundaries

The Cognitive Engine ingestion pipeline strictly separates extraction from downstream canonical resolution:

```
[Journal Entry Raw Text]
          │
          ▼  [EXTRACTION STAGE]
┌────────────────────────────────────────────────────────┐
│  Task: Detect verbatim surface mentions & coarse type  │
│  Output Required: { surface_span, entity_type }        │
└────────────────────────────────────────────────────────┘
          │
          ▼  [RESOLUTION / LINKING STAGE]
┌────────────────────────────────────────────────────────┐
│  Task: Map surface mentions to Knowledge Graph nodes   │
│  Output: canonical_target (Pre-verified Dictionary)    │
└────────────────────────────────────────────────────────┘
```

### 1.1 Four-Way Boundary Definitions

1. **Surface Mention ($M_{\text{surface}}$)**: The literal, verbatim contiguous substring present in the source text that denotes an entity reference. **The extraction stage requires ONLY `surface_span + entity_type`.** The extractor is NEVER expected or scored on producing canonical targets.
2. **Canonical Entity ($E_{\text{canonical}}$)**: The persistent, normalized Knowledge Graph node representing a unique real-world person, place, organization, tool, topic, project, or goal (assigned an immutable entity ID).
3. **Alias ($A$)**: An explicitly registered, pre-verified alternative surface form, acronym, or established identity designation mapped to a Canonical Entity. **Alias mapping is permitted ONLY under an explicit pre-verified identity relationship, NEVER because an annotator judges two distinct phrases to be semantically similar or topical paraphrases.**
4. **Inferred Concept ($C_{\text{inferred}}$)**: An abstract domain category, nominalized verb, or lemma derived by semantic interpretation but **not occurring verbatim in the text**. Inferred concepts are strictly forbidden in extraction ground truth.

---

## 2. Ground-Truth V2 Data Schema Specification

The V2 Ground-Truth format cleanly separates the extraction evaluation contract from resolution metadata:

```json
{
  "entry_id": "entry_001",
  "text": "Met Rahul at the cafe to map out the transaction synchronization flow for the personal finance tool. We decided to prioritize ledger reconciliations over auto-categorization.",
  "entities": [
    {
      "surface_span": "Rahul",
      "entity_type": "Person",
      "start_offset": 4,
      "end_offset": 9,
      "canonical_target": "Person_Rahul_01",
      "alias_verification_rule": "EXACT_PROPER_NAME"
    },
    {
      "surface_span": "personal finance tool",
      "entity_type": "Project",
      "start_offset": 80,
      "end_offset": 101,
      "canonical_target": "Project_ExpenseTracker_01",
      "alias_verification_rule": "REGISTERED_PROJECT_DESCRIPTIVE_ALIAS"
    }
  ],
  "negative_control_rationale": null
}
```

* **Extraction Evaluation Target:** Evaluated strictly against `surface_span` and `entity_type`.
* **Resolution Evaluation Target:** Evaluated against `canonical_target` only in downstream entity resolution benchmarks.

---

## 3. Operational Entity Taxonomy Rules & Boundaries

---

### 3.1 `Goal` vs. `Activity` (Target & Commitment Semantics)

* **Operational Definition:** A `Goal` is an explicit, bounded **target state, milestone, or formal commitment** defined by structured completion criteria, measurable standards, or dedicated preparation targets.
* **Activity Distinction:** An `Activity` is the **process, execution, or routine action** performed in time. Activities do NOT qualify as `Goal` entities unless framed around a specific target/milestone noun phrase.

#### Inclusion Criteria:
1. Target state possesses explicit completion/success criteria (e.g., passing a standardized exam, hitting a specific race milestone, launching a version).
2. Grammatically framed as a milestone noun phrase or target entity rather than a transient action.

#### Exclusion Criteria:
1. Routine, recurring bodily movements or daily fitness actions lacking milestone target criteria (*"morning run"*, *"yoga session"*, *"heavy leg day"*).
2. Transient daily intentions or task actions (*"need to clean desk"*, *"drink water"*).

#### Positive Examples (Valid `Goal` Entities):
1. *"Started intensive preparation for **CAT 2026**."* $\to$ `surface_span: "CAT 2026"`, `entity_type: "Goal"` (Standardized exam target).
2. *"Logged 15km towards our **half-marathon training** milestone."* $\to$ `surface_span: "half-marathon training"`, `entity_type: "Goal"` (Structured race commitment target).
3. *"Committed to our Q3 **MVP Launch** deadline."* $\to$ `surface_span: "MVP Launch"`, `entity_type: "Goal"` (Bounded organizational target milestone).

#### Negative & Edge Examples:
1. *"Pushed through a crisp **5km morning run** along the lake."* $\to$ **EXCLUDED** (Daily execution activity, lacks bounded milestone target).
2. *"Heavy **leg day at the gym**; squats felt solid."* $\to$ **EXCLUDED** (Routine exercise session).
3. *"Need to **slow down and declutter my mind**."* $\to$ **EXCLUDED** (General aspirational reflection, lacks structured commitment criteria).
4. *Edge Case:* *"Completed a full-length **CAT mock exam**."* $\to$ `surface_span: "CAT"`, `entity_type: "Goal"` (Identifies the target exam framework; *"mock exam"* is the testing instrument).

---

### 3.2 `Topic` vs. `Activity` / Task (Knowledge Concept vs. Execution Action)

* **Operational Definition:** A `Topic` is a **structured domain discipline, field of study, named algorithm, theoretical concept, or architectural pattern** representing a body of knowledge.
* **Activity / Task Distinction:** An engineering action (e.g., *debugging*, *code review*, *optimization*, *migration*, *refactoring*, *testing*) is an **operational process** applied to code, NOT a domain entity.

#### Inclusion Criteria:
1. Represents an established body of knowledge, computational methodology, mathematical theory, or formal architectural standard (e.g., `ACID Compliance`, `System Design`, `Dynamic Programming`, `Louvain algorithm`, `Linear Algebra`, `Vector Indexing`).
2. Capable of being indexed as a permanent conceptual node in a domain graph.

#### Exclusion Criteria:
1. Operational engineering workflows, task descriptions, or maintenance actions (*"code review"*, *"debugging memory leaks"*, *"database migration"*, *"refactoring components"*, *"writing unit tests"*).
2. Abstract psychological or emotional states (*"clarity"*, *"burnout"*, *"overwhelmed"*, *"motivation"*).

#### Positive Examples (Valid `Topic` Entities):
1. *"Studied **Linear Algebra** and **Calculus** for machine learning."* $\to$ `surface_span: "Linear Algebra"`, `entity_type: "Topic"`; `surface_span: "Calculus"`, `entity_type: "Topic"`.
2. *"Reviewed our database design for strict **ACID Compliance**."* $\to$ `surface_span: "ACID Compliance"`, `entity_type: "Topic"`.
3. *"Practiced system design questions on **Rate Limiting** and **Load Balancing**."* $\to$ `surface_span: "Rate Limiting"`, `entity_type: "Topic"`; `surface_span: "Load Balancing"`, `entity_type: "Topic"`.

#### Negative & Edge Examples:
1. *"Spent the afternoon on **code review** with the team."* $\to$ **EXCLUDED** (Engineering task workflow).
2. *"Spent three hours on **debugging memory leaks**."* $\to$ **EXCLUDED** (Operational maintenance activity).
3. *"Planning our upcoming **database migration strategy**."* $\to$ **EXCLUDED** (Generic engineering planning task).
4. *Edge Case:* *"Investigating **Race Conditions** in asynchronous batch handlers."* $\to$ `surface_span: "Race Conditions"`, `entity_type: "Topic"` (Identifies a formal computational concurrency concept, not merely the act of debugging).

---

### 3.3 Surface Mention vs. Canonical Target Field (Strict Separation)

* **Operational Rule:** The extraction evaluation contract requires **ONLY** `surface_span` and `entity_type`.
* **Zero-Embellishment Contract:** The ground truth `surface_span` must match the contiguous text character-for-character. Synthetic suffixes (e.g., turning `"HNSW"` into `"HNSW Indexing"`), canonical replacements (e.g., turning `"finance tool"` into `"Expense Tracker"`), and grammatical corrections are strictly prohibited.
* **Downstream Metadata:** `canonical_target` is resolution metadata stored for Phase 2 graph construction and has zero bearing on whether an extraction model achieved a true positive surface span.

#### Positive Examples (Verbatim Extraction Targets):
1. Text: *"Studied vector indexing: HNSW vs IVFFlat."* $\to$ `surface_span: "HNSW"`, `entity_type: "Topic"`; `surface_span: "IVFFlat"`, `entity_type: "Topic"`. (Extracts exact verbatim spans).
2. Text: *"Building the personal finance tool with Drizzle."* $\to$ `surface_span: "personal finance tool"`, `entity_type: "Project"`.
3. Text: *"Synced with Rahul."* $\to$ `surface_span: "Rahul"`, `entity_type: "Person"`.

#### Negative & Edge Examples:
1. Synthetically modified: `surface_span: "HNSW Indexing"` on text *"HNSW vs IVFFlat"* $\to$ **INVALID ANNOTATION** (Violates verbatim surface grounding).
2. Canonical replacement: `surface_span: "Expense Tracker"` on text *"personal finance tool"* $\to$ **INVALID ANNOTATION** (Forces resolution into extraction).
3. *Edge Case:* Substring punctuation in *"Node.js"* $\to$ `surface_span: "Node.js"`, `entity_type: "Tool"` (Preserve literal punctuation when part of official tool naming).

---

### 3.4 Alias vs. Paraphrase Boundary (Pre-Verified Identity Constraint)

* **Operational Rule:** A surface mention may be mapped to a `canonical_target` if and only if there is an **explicit, pre-verified identity or registered project/person/tool alias**.
* **Anti-Paraphrase Constraint:** Two phrases that merely discuss similar topics, share semantic intent, or describe general themes MUST NEVER be linked to the same canonical target.

#### Criteria for Valid Alias Mapping:
1. **Registered Domain Alias:** An established acronym, brand synonym, or formal project alias defined in the project registry (e.g., `"CAT Prep"` $\equiv$ `Goal_CAT2026`, `"personal finance tool"` in context $\equiv$ `Project_ExpenseTracker_01`).
2. **Deterministic Identity:** The mention points uniquely to a singular persistent node without semantic ambiguity.

#### Prohibited Paraphrase Mappings:
1. Mapping two different projects together because they both involve finance.
2. Mapping a generic description (e.g., *"building charts"*) to a project entity.

#### Positive Examples (Valid Pre-Verified Aliases):
1. *"transaction flow for the **personal finance tool**"* $\to$ `surface_span: "personal finance tool"`, `canonical_target: "Project_ExpenseTracker_01"`.
2. *"Working on the **ledger synchronization**"* $\to$ `surface_span: "ledger synchronization"`, `canonical_target: "Project_ExpenseTracker_01"`.
3. *"Preparing for **CAT mock tests**"* $\to$ `surface_span: "CAT"`, `canonical_target: "Goal_CAT2026"`.

#### Negative & Edge Examples:
1. Text: *"Designed charts for our application."* $\to$ Linking *"charts"* to `Project_ExpenseTracker_01` $\to$ **PROHIBITED** (Semantic paraphrase/component, not a verified project alias).
2. Text: *"Read a book on money management."* $\to$ Linking *"money management"* to `Project_ExpenseTracker_01` $\to$ **PROHIBITED** (General domain theme, not an identity alias).
3. *Edge Case:* Text: *"Sync with **the finance repo**."* $\to$ Permitted as alias ONLY IF `"the finance repo"` is explicitly registered in the project canonical dictionary.

---

### 3.5 `Place` Entities: Generic Spatial Nouns vs. Stable / User-Specific References

* **Operational Definition:** A `Place` entity is a **specific, identifiable geographic location, named geopolitical territory, or distinct stable personal anchor facility**.
* **Indefinite Spatial Nouns:** Common, indefinite spatial nouns that denote temporary settings or unanchored common nouns (*"the lake"*, *"a cafe"*, *"balcony"*, *"the street"*, *"hills"*) are excluded.
* **Stable Anchor References:** Specific named facilities, distinct venues with fixed identity, or stable user-specific anchor nodes (*"Bangalore"*, *"Himachal"*, *"Mumbai"*, *"IIM Campus"*, *"Parental Home"*) qualify when functioning as a persistent location node.

#### Positive Examples (Valid `Place` Entities):
1. *"Flight to **Bangalore** was delayed."* $\to$ `surface_span: "Bangalore"`, `entity_type: "Place"`, `canonical_target: "Place_Bangalore"`.
2. *"Booked summer hiking itinerary in **Himachal**."* $\to$ `surface_span: "Himachal"`, `entity_type: "Place"`, `canonical_target: "Place_Himachal"`.
3. *"Studied in the **IIM Ahmedabad Library**."* $\to$ `surface_span: "IIM Ahmedabad Library"`, `entity_type: "Place"`, `canonical_target: "Place_IIMA_Library"`.

#### Negative & Edge Examples:
1. *"Ran 5km along **the lake**."* $\to$ **EXCLUDED** (Indefinite common spatial setting).
2. *"Grabbed coffee at **a cafe**."* $\to$ **EXCLUDED** (Generic common noun).
3. *"Sat on the **balcony** reading code."* $\to$ **EXCLUDED** (Everyday domestic furniture/fixture).
4. *Edge Case:* *"Drove down to my **parents' house** in Pune."* $\to$ `surface_span: "Pune"`, `entity_type: "Place"`. (*"parents' house"* is a relational residence reference, whereas `"Pune"` is the grounded geopolitical place).

---

### 3.6 `Tool`: Case-Agnostic Software & Ecosystem Suffix Rules

* **Operational Definition:** Executable software systems, databases, programming languages, libraries, protocols, and standard data interchange formats.
* **Case Agnosticism:** Case formatting does NOT alter entity validity. Lowercase software tools (`pgvector`, `drizzle-orm`, `postgres`, `fastapi`, `node.js`, `docker`, `git`, `csv`) are valid `Tool` entities.
* **Compound Suffix Rule:** If a technology is conventionally referred to with its category or specification descriptor in a contiguous noun phrase (e.g., `"Drizzle ORM"`, `"Tailwind CSS"`, `"Node.js"`), annotate the complete unified span. If mentioned by base name alone (*"Drizzle"*), annotate only the base span.

#### Positive Examples (Valid `Tool` Entities):
1. *"Migrated data using **Drizzle ORM** and **PostgreSQL**."* $\to$ `surface_span: "Drizzle ORM"`, `entity_type: "Tool"`; `surface_span: "PostgreSQL"`, `entity_type: "Tool"`.
2. *"Indexed vectors using **pgvector** extensions."* $\to$ `surface_span: "pgvector"`, `entity_type: "Tool"`.
3. *"Designed responsive UI using **Tailwind CSS** and **Framer Motion**."* $\to$ `surface_span: "Tailwind CSS"`, `entity_type: "Tool"`; `surface_span: "Framer Motion"`, `entity_type: "Tool"`.

#### Negative & Edge Examples:
1. *"Bought a mechanical **keyboard** and **monitor**."* $\to$ **EXCLUDED** (Generic hardware devices).
2. *"Wrote a custom **for-loop** in our script."* $\to$ **EXCLUDED** (Generic programming language syntax construct).
3. *"Reviewed the **pull request** on GitHub."* $\to$ `surface_span: "GitHub"`, `entity_type: "Tool"` (or `Organization`); *"pull request"* is **EXCLUDED** (generic workflow artifact).

---

## 4. Operational Summary: Taxonomy & Boundary Matrix

| Ontology Type | Operational Core Definition | Positive Examples (Include) | Negative Examples (Exclude) |
| :--- | :--- | :--- | :--- |
| **`Person`** | Explicit named individuals | `"Rahul"`, `"Priya"`, `"Dr. Sharma"` | `"mom"`, `"sister"`, `"manager"`, `"friends"` |
| **`Project`** | Named initiatives, apps under construction | `"Cognitive Engine"`, `"personal finance tool"` | `"code review"`, `"meal prep"`, `"an app"` |
| **`Organization`** | Formal corporate, academic, institutional bodies | `"Google"`, `"Clerk"`, `"IIM Ahmedabad"` | `"the cafe"`, `"gym"`, `"family dinner"` |
| **`Place`** | Named geopolitical & stable location anchors | `"Bangalore"`, `"Himachal"`, `"Mumbai"` | `"the lake"`, `"balcony"`, `"a cafe"`, `"home"` |
| **`Tool`** | Executable software, DBs, libraries (case-agnostic) | `"pgvector"`, `"Drizzle ORM"`, `"FastAPI"`, `"Node.js"` | `"keyboard"`, `"monitor"`, `"chair"`, `"for-loop"` |
| **`Topic`** | Formal knowledge domains, algorithms, theories | `"System Design"`, `"ACID Compliance"`, `"Louvain"` | `"debugging"`, `"optimization"`, `"clarity"` |
| **`Goal`** | Explicit milestone targets, standardized exams | `"CAT 2026"`, `"half-marathon training"`, `"MVP Launch"` | `"5km morning run"`, `"yoga"`, `"cleaning desk"` |

---

## 5. Next Step Gate Condition

* **Status:** Stage 2 policy amendments finalized and documented in [`docs/experiments/GT_V2_ANNOTATION_POLICY.md`](file:///c:/Users/SHASHWAT%20TRIPATHI/OneDrive/Documents/Desktop/cognitive-engine/Cognitive-Engine/docs/experiments/GT_V2_ANNOTATION_POLICY.md).
* **Gate Requirement:** STOP and wait for explicit user review and approval before proceeding to **Stage 3 — Adversarial Policy Audit**.
