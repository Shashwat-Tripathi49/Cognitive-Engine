# 📊 Domain Object Ownership & Access Matrix

> Authoritative ownership matrix defining read/write permissions, immutability, versioning, and evidence traceability for all core domain objects.

---

## Domain Ownership Matrix

| Domain Object | Owner Engine | Read Access (Engines) | Write Access (Owner Only) | Immutable? | Versioned? | Traceable? |
|---|---|---|---|---|---|---|
| **Cognitive Fragment** | `Capture Engine` | `Memory`, `Capture` | `Capture Engine` | **YES** | No | **YES** (Source) |
| **Source Reference** | `Capture Engine` | `Capture`, `Memory` | `Capture Engine` | **YES** | No | **YES** |
| **Session** | `Capture Engine` | `Capture`, `Orchestration` | `Capture Engine` | **YES** | No | No |
| **Memory Node** | `Memory Engine` | `Knowledge Graph`, `Cognitive`, `Reasoning`, `Reflection` | `Memory Engine` | **NO** (Metadata decays) | No | **YES** |
| **Embedding** | `Memory Engine` | `Memory`, `Cognitive` | `Memory Engine` | **YES** | No | **YES** |
| **Context** | `Memory Engine` | `Memory`, `Reasoning` | `Memory Engine` | **NO** (Transient) | No | No |
| **Graph Node** | `Knowledge Graph Engine` | `Cognitive`, `Reasoning`, `Reflection` | `Knowledge Graph Engine` | **NO** (Versioned) | **YES** | **YES** |
| **Graph Edge** | `Knowledge Graph Engine` | `Cognitive`, `Reasoning`, `Reflection` | `Knowledge Graph Engine` | **NO** (Versioned) | **YES** | **YES** |
| **Subgraph** | `Knowledge Graph Engine` | `Cognitive`, `Reasoning` | `Knowledge Graph Engine` | **YES** (Transient) | No | **YES** |
| **Cluster** | `Cognitive Engine` | `Reasoning`, `Reflection` | `Cognitive Engine` | **YES** (Computed) | No | **YES** |
| **Temporal Sequence** | `Cognitive Engine` | `Reasoning`, `Reflection` | `Cognitive Engine` | **YES** (Calculated) | No | **YES** |
| **Pattern** | `Cognitive Engine` | `Reasoning`, `Reflection` | `Cognitive Engine` | **YES** | No | **YES** |
| **Algorithmic Confidence** | `Cognitive Engine` | `Reasoning`, `Reflection` | `Cognitive Engine` | **YES** | No | **YES** |
| **Reasoning Artifact** | `Reasoning Engine` | `Reflection` | `Reasoning Engine` | **YES** | No | **YES** |
| **Evidence Chain** | `Reasoning Engine` | `Reflection`, `Presentation` | `Reasoning Engine` | **YES** | No | **YES** (Root) |
| **Evidence Reference** | `Reasoning Engine` | `Reflection`, `Presentation` | `Reasoning Engine` | **YES** | No | **YES** |
| **Evidence Provenance** | `Reasoning Engine` | `Reflection`, `Audit` | `Reasoning Engine` | **YES** | No | **YES** |
| **Metacognitive Reflection**| `Reflection Engine` | `Presentation`, `User` | `Reflection Engine` | **YES** | No | **YES** |
| **Reflection Report** | `Reflection Engine` | `Presentation`, `User` | `Reflection Engine` | **YES** | No | **YES** |

---

## Access Rules & Boundaries

1. **Strict Single-Writer Rule:** Only the designated **Owner Engine** may create, modify, or update a domain object. No cross-engine mutations are allowed.
2. **Read-Only Inter-Engine Access:** Consuming engines must access objects through domain interfaces. Direct state modification by external engines returns a domain exception.
3. **Immutability Enforcement:** Objects marked `Immutable: YES` cannot be edited after creation. Any change requires creating a new versioned object or linking a new child object.
4. **Traceability Requirement:** Objects marked `Traceable: YES` must contain direct or indirect UUID references leading back to a `CognitiveFragment`.
