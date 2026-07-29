# Capture Engine

> The ingestion boundary of the Cognitive Engine. Every piece of information enters the system through the Capture Engine.

---

## Purpose

The Capture Engine transforms **raw, unstructured user input** into **structured Cognitive Fragments** — the atomic unit that all downstream engines operate on.

Journaling is one input modality. The Capture Engine is designed to accept any form of human thought expression — text, voice transcription, web highlights, image annotations, structured prompts — and normalize them into a uniform representation.

The Capture Engine does **not** interpret meaning. It captures, normalizes, enriches with structural metadata, and emits. Interpretation is the responsibility of downstream engines.

---

## Responsibilities

| #   | Responsibility             | Description                                                                                   |
| --- | -------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | **Input Acceptance**       | Accept input from any supported modality (text, voice, link, highlight, image)                |
| 2   | **Validation**             | Ensure input meets minimum quality thresholds (non-empty, within size limits, valid encoding) |
| 3   | **Normalization**          | Transform modality-specific input into a uniform Cognitive Fragment structure                 |
| 4   | **Metadata Enrichment**    | Attach structural metadata: timestamp, source modality, language, word count, content hash    |
| 5   | **Initial Classification** | Assign a preliminary content type (freeform, question, decision, observation, reference)      |
| 6   | **Fragment Emission**      | Emit a `FragmentCaptured` Domain Event containing the completed Cognitive Fragment            |

### What It Does NOT Do

- ❌ Semantic analysis (that's the Memory Engine + Reasoning Engine)
- ❌ Storage (that's the Memory Engine)
- ❌ Pattern detection (that's the Reasoning Engine)
- ❌ User interaction (that's the presentation layer)

---

## Sprint 1C-A Hardening Specifications

### 1. Production Authentication Baseline
* **Provider Decision:** **Clerk** is frozen as the primary authentication provider.
* **Token Verification:** API middleware (`requireAuth`) verifies Clerk JWTs / Session Bearer tokens and extracts the user identity (`userId`).
* **Multi-Tenant Ownership:** Every `CognitiveFragment` belongs to an authenticated `userId`. Clients are **strictly prohibited** from passing `userId` in payloads. Backend middleware extracts `userId` directly from verified context.
* **Authorization Isolation:** Database queries enforce `WHERE user_id = :userId` on all reads (`GET /capture/:id`, `GET /capture`). Users can never access another user's fragments.

### 2. Typed & Versioned `CaptureMetadata` (Schema v1)
All fragments carry structured provenance metadata conforming to `captureMetadataSchema` v1:
```json
{
  "schemaVersion": 1,
  "source": "api",
  "clientTimezone": "Asia/Kolkata",
  "clientPlatform": "iOS 18.2"
}
```

### 3. Content Hash Policy (`contentHash`)
* **Primary Purpose:** Cryptographic SHA-256 fingerprint of normalized text for evidence binding and tamper detection.
* **Idempotency Window (10 Seconds):** Exact duplicate requests (`same userId` + `same contentHash`) submitted within 10 seconds are de-duplicated and return the existing fragment. This protects against network retry storms.
* **Multi-Temporal Captures:** Identical text submitted at different times (>10s) or by different users represents distinct thoughts and creates a new fragment with its own timestamp.

---

## Inputs

| Input             | Source                   | Description                         |
| ----------------- | ------------------------ | ----------------------------------- |
| Raw text          | User (manual entry)      | Free-form text of any length        |
| Voice transcript  | User (voice capture)     | Transcribed audio input             |
| Web highlight     | User (browser extension) | Highlighted text + source URL       |
| Linked reference  | User (paste/import)      | URL with optional annotation        |
| Structured prompt | System (guided capture)  | Response to a system-posed question |
| Image annotation  | User (image + text)      | Image with descriptive caption      |

---

## Outputs

### Cognitive Fragment

The sole output of the Capture Engine. A Cognitive Fragment is **immutable once emitted**.

```
CognitiveFragment {
  id:               Unique identifier (UUID)
  userId:           Owner identifier (UUID)
  content:          Normalized text content
  modality:         text | voice_transcript | web_highlight | structured_prompt | image_annotation
  contentHash:      SHA-256 of normalized content
  capturedAt:       ISO 8601 timestamp
  metadata:         Typed CaptureMetadata (schemaVersion, source, clientTimezone, clientPlatform)
}
```

---

## API Specification (Sprint 1C-A)

* `POST /capture` $\rightarrow$ Accepts `{ "text": "...", "modality": "text", "metadata": {...} }`. Returns `201 Created` with `CognitiveFragment`.
* `GET /capture` $\rightarrow$ Accepts query params `page`, `limit`, `modality`, `startDate`, `endDate`. Returns `200 OK` with paginated `{ "data": [...], "pagination": {...} }`.
* `GET /capture/:id` $\rightarrow$ Accepts fragment ID. Returns `200 OK` if owned by user, `404 Not Found` if non-existent or owned by another user.

---

> _The Capture Engine is deliberately simple. Its power is in its discipline: accept everything, normalize everything, enrich everything, lose nothing._
