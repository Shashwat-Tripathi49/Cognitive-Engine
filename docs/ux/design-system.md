# Design System — Alabaster Chalk & Bone Ink

> The single source of truth for Cognitive Engine's tactile editorial visual language.

---

## 1. Palette Philosophy

The visual system is built on **Alabaster Chalk & Bone Ink** — an architectural broadsheet and field ledger aesthetic that avoids both generic AI tech tropes (cyberpunk neon/purple) and generic AI journal tropes (cream/terracotta).

### Named Color Palette

| Token Name | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--canvas-alabaster` | `#F3F3F0` | Primary application canvas background |
| `--surface-pure` | `#FFFFFF` | Primary writing card and input surface |
| `--surface-raised` | `#E9E9E5` | Secondary ledger containers & hover states |
| `--surface-pressed` | `#DFDFD9` | Active pressed feedback state |
| `--border-hairline` | `rgba(20, 23, 26, 0.10)` | Delicate architectural grid line |
| `--border-structural` | `rgba(20, 23, 26, 0.24)` | Firm card boundary and frame |
| `--ink-bone` | `#14171A` | Primary reading and headline text (16.2:1 AAA) |
| `--ink-zinc` | `#5A626A` | Secondary supporting text and subtitles |
| `--ink-dust` | `#8C949D` | Microcopy, timestamps, and sequence labels |
| `--accent-moss` | `#3A5A40` | Subtle organic anchor for active session/entry tags |
| `--accent-ochre` | `#B85D36` | Restrained warning and error indicator |

---

## 2. Typography

Pairing distinctive, high-character typefaces with purpose:

| Role | Font Family | Style / Weight | Usage |
| :--- | :--- | :--- | :--- |
| **Display & Masthead** | `Space Grotesk` | 600 / 700 | Brand mark, section headers, button labels |
| **Editorial Prompt** | `Newsreader` | Italic (400 / 500) | Thought prompts and reflective questions |
| **Body & Longform** | `Inter` | Regular (400) | Thought contents (max 65ch measure, 1.68 leading) |
| **Ledger & Metadata** | `JetBrains Mono` | Medium (500) | Sequence `#001`, session tags, hotkeys |

---

## 3. Tactile Geometry & Depth

* **Varied Border Radius**:
  * Outer structural frames & dock: `0px` (sharp, architectural precision)
  * Writing slips & memory cards: `3px` (subtle tactile paper slip)
  * Action buttons & micro-tags: `2px` (tactile stamp)
* **Directional Shadows**:
  * `--shadow-slip`: `2px 3px 0px rgba(0, 0, 0, 0.22)`
  * `--shadow-entry`: `1px 2px 0px rgba(0, 0, 0, 0.08)`
  * `--shadow-dock`: `2px 3px 0px rgba(0, 0, 0, 0.25)`

---

## 4. Motion & Tactile Feedback

* **Physical Button Press**:
  * `:active { transform: translate(1px, 1px); box-shadow: none; }`
* **Respect User Motion**:
  * All animations disabled under `prefers-reduced-motion: reduce`.
