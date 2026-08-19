# Design System — Archival Ledger & Espresso Ink

> The single source of truth for Cognitive Engine's tactile editorial visual language.

## Direction History Log
> **Direction 5 (Final — Current)**: *Stitch Archival Ledger & Espresso Ink* (`#F6F4EE` warm parchment, high-contrast serif headlines, `REF: ####` index tags, corner framing marks `┌ ┐ └ ┘`, espresso leather action buttons, full-screen adaptive workbench).  
> *Supersedes*:  
> - **Direction 4** (`deff424` / `b385ed8`): *Alabaster Chalk & Bone Ink* (`#F3F3F0` canvas, `#14171A` bone ink, mobile-centered stream).  
> - **Direction 3** (`81cfaf3`): *Basalt / Celadon Tactile Ledger* (dark slate / pale celadon accents).  
> - **Direction 2**: *Warm Terracotta Journal* (early editorial concept).  
> - **Direction 1**: *Default Clean Slate Minimalist*.  
>  
> *Governance Rule*: Any future palette, typography, or component visual direction change MUST be recorded in this history log before being designated as active.

---

## 1. Palette Philosophy

The visual system is built on **Archival Parchment & Espresso Ink** — an academic, historical, and cyber-editorial catalog aesthetic. It evokes tactile physical library index slips, vintage scientific ledgers, and architectural catalog registries without clinical or cyberpunk tropes.

### Named Color Palette

| Token Name | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--canvas-bg` | `#F6F4EE` | Primary warm archival parchment canvas |
| `--surface-pure` | `#FFFFFF` | Primary writing card and index slip surface |
| `--surface-raised` | `#EFECE4` | Tilted backing slip, secondary card surfaces & hover states |
| `--surface-pressed` | `#E5E1D7` | Active pressed button feedback state |
| `--border-hairline` | `rgba(26, 22, 18, 0.10)` | Delicate catalog grid line |
| `--border-structural` | `rgba(26, 22, 18, 0.22)` | Crisp card frame and bounding box |
| `--ink-bone` | `#1A1612` | Deep espresso black for reading and headlines |
| `--ink-stone` | `#4A463F` | Secondary supporting text and subtitles |
| `--ink-dust` | `#8C887F` | Microcopy, timestamps, and sequence labels |
| `--ink-inverse` | `#F6F4EE` | Inverted warm text for espresso action buttons |
| `--action-espresso` | `#2B231A` | Primary high-contrast tactile action button |
| `--action-espresso-hover` | `#3D3227` | Hover state for primary action buttons |
| `--tag-bg` | `#EFECE4` | Subtle taxonomy tag and badge background |
| `--highlight-bg` | `rgba(26, 22, 18, 0.08)` | Search query keyword highlight background |

---

## 2. Typography

| Role | Font Family | Style / Weight | Usage |
| :--- | :--- | :--- | :--- |
| **Headline & Titles** | `Playfair Display` | Bold (700 / 800) | Screen titles ("Retrieved Entries", "Capture a thought"), Entry titles |
| **Display & Monogram** | `Space Grotesk` | 600 / 700 | Masthead brand text, stamp badges |
| **Editorial & Prompts** | `Newsreader` | Normal / Italic (400 / 500) | Thought bodies, reflective subtitles |
| **Body & Content** | `Inter` | Regular (400 / 500) | Thought contents (max 65ch measure, 1.68 leading) |
| **Technical Metadata** | `JetBrains Mono` | Medium (500 / 600) | `SYS.INDEX // AWAITING INPUT`, `REF: 8492`, `SUBJECT / KEYWORD`, `[01] RECORD`, tags |

---

## 3. Signature Architectural Elements

1. **Corner Crop Marks**: `┌ ┐ └ ┘` framing major headers, query registry surfaces, and cards.
2. **Archival Reference Stamping**: Every card features an archival identifier (`REF: ####`) in the upper-right corner.
3. **Category Icon Box**: Square framed icon badge (e.g. 📄 Document, 🧪 Observation/Hypothesis, ⚡ Spark/Idea) on index cards.
4. **Framed Action Stamp Buttons**: High-contrast dark espresso leather buttons with warm gold/ivory uppercase text (`RECORD`, `SEARCH`, `ARCHIVE`).
5. **Floating Bottom Dock**: Tactile floating tool dock with Note/Capture (`✍️`), active espresso Search lens (`🔍`), and Archive box (`🗃️`).
6. **Full-Screen Responsive Coverage**: Layout fills the full viewport (`100vw` / `100vh`) with multi-column responsive desktop workbench and fluid mobile views.

---

## 4. Tactile Geometry & Depth

* **Border Radius**:
  * Outer structural frames & dock: `0px` (sharp architectural precision)
  * Writing slips & memory cards: `1px` – `2px` (subtle tactile paper slip)
  * Action buttons & micro-tags: `1px` (tactile stamp)
* **Directional Shadows**:
  * `--shadow-slip`: `2px 3px 0px rgba(26, 22, 18, 0.20)`
  * `--shadow-card`: `2px 3px 0px rgba(0, 0, 0, 0.12)`
  * `--shadow-dock`: `2px 4px 0px rgba(0, 0, 0, 0.28)`

---

## 5. Microcopy & Interaction Tenets

* **Calm & Non-Clinical Register**: Avoid aggressive terminal/computational language like "EXECUTE". Use intentional, reflective terms:
  * Capture: **"RECORD"** or **"FILE"**
  * Search: **"SEARCH"**
  * Subtitles: **"SYS.INDEX // AWAITING INPUT"**, **"Personal Memory Retrieval"**, **"Retrieved Entries"**
