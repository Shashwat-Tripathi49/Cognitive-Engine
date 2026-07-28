# Design System

> The single source of truth for Cognitive Engine's visual language.

---

## Color Palette

### Brand Colors

| Name      | Hex       | Usage                               |
| --------- | --------- | ----------------------------------- |
| Obsidian  | `#0A0A0F` | Primary background (dark mode)      |
| Nebula    | `#6C5CE7` | Primary accent, CTAs                |
| Synapse   | `#00D2FF` | Secondary accent, links, highlights |
| Cognition | `#A29BFE` | Tertiary accent, hover states       |
| Ivory     | `#F8F9FA` | Primary background (light mode)     |
| Graphite  | `#2D3436` | Primary text (light mode)           |

### Semantic Colors

| Name    | Hex       | Usage                          |
| ------- | --------- | ------------------------------ |
| Success | `#00B894` | Confirmations, positive states |
| Warning | `#FDCB6E` | Caution, pending states        |
| Error   | `#E17055` | Errors, destructive actions    |
| Info    | `#74B9FF` | Informational messages         |

### Neutral Scale

```
50:  #FAFAFA
100: #F5F5F5
200: #EEEEEE
300: #E0E0E0
400: #BDBDBD
500: #9E9E9E
600: #757575
700: #616161
800: #424242
900: #212121
950: #0A0A0F
```

---

## Typography

### Font Stack

| Usage    | Font             | Fallback                |
| -------- | ---------------- | ----------------------- |
| Headings | `Inter`          | `system-ui, sans-serif` |
| Body     | `Inter`          | `system-ui, sans-serif` |
| Code     | `JetBrains Mono` | `monospace`             |

### Type Scale

| Level   | Size            | Weight | Line Height | Usage            |
| ------- | --------------- | ------ | ----------- | ---------------- |
| Display | 48px / 3rem     | 700    | 1.1         | Hero sections    |
| H1      | 36px / 2.25rem  | 700    | 1.2         | Page titles      |
| H2      | 28px / 1.75rem  | 600    | 1.3         | Section headers  |
| H3      | 22px / 1.375rem | 600    | 1.4         | Sub-sections     |
| H4      | 18px / 1.125rem | 600    | 1.4         | Card headers     |
| Body    | 16px / 1rem     | 400    | 1.6         | Default text     |
| Small   | 14px / 0.875rem | 400    | 1.5         | Secondary text   |
| Caption | 12px / 0.75rem  | 400    | 1.4         | Labels, metadata |

---

## Spacing

Based on a **4px grid system**:

| Token        | Value | Usage           |
| ------------ | ----- | --------------- |
| `--space-1`  | 4px   | Tight spacing   |
| `--space-2`  | 8px   | Element padding |
| `--space-3`  | 12px  | Small gaps      |
| `--space-4`  | 16px  | Default gap     |
| `--space-5`  | 20px  | Medium spacing  |
| `--space-6`  | 24px  | Section padding |
| `--space-8`  | 32px  | Large gaps      |
| `--space-10` | 40px  | Section margins |
| `--space-12` | 48px  | Page margins    |
| `--space-16` | 64px  | Hero spacing    |

---

## Border Radius

| Token           | Value  | Usage                 |
| --------------- | ------ | --------------------- |
| `--radius-sm`   | 4px    | Small elements (tags) |
| `--radius-md`   | 8px    | Cards, inputs         |
| `--radius-lg`   | 12px   | Modals, panels        |
| `--radius-xl`   | 16px   | Large containers      |
| `--radius-full` | 9999px | Pills, avatars        |

---

## Shadows

| Token           | Value                           | Usage               |
| --------------- | ------------------------------- | ------------------- |
| `--shadow-sm`   | `0 1px 2px rgba(0,0,0,0.05)`    | Subtle elevation    |
| `--shadow-md`   | `0 4px 6px rgba(0,0,0,0.07)`    | Cards               |
| `--shadow-lg`   | `0 10px 15px rgba(0,0,0,0.1)`   | Dropdowns           |
| `--shadow-xl`   | `0 20px 25px rgba(0,0,0,0.15)`  | Modals              |
| `--shadow-glow` | `0 0 20px rgba(108,92,231,0.3)` | Focus / accent glow |

---

## Motion

| Token               | Duration | Easing                         | Usage            |
| ------------------- | -------- | ------------------------------ | ---------------- |
| `--duration-fast`   | 100ms    | `ease-out`                     | Hover states     |
| `--duration-normal` | 200ms    | `ease-in-out`                  | Transitions      |
| `--duration-slow`   | 300ms    | `ease-in-out`                  | Panel slides     |
| `--duration-slower` | 500ms    | `cubic-bezier(0.4, 0, 0.2, 1)` | Page transitions |

### Motion Principles

1. **Purposeful** — Every animation communicates something
2. **Quick** — Never make the user wait for an animation
3. **Consistent** — Same type of action = same type of motion
4. **Respectful** — Honor `prefers-reduced-motion`

---

## Component Patterns

> Component specifications will be detailed as the UI library is built in `packages/ui/`.

### Planned Components

- Button (primary, secondary, ghost, danger)
- Input (text, textarea, search)
- Card (entry card, insight card, connection card)
- Modal / Dialog
- Toast / Notification
- Navigation (sidebar, topbar)
- Tag / Badge
- Tooltip
- Skeleton loader
- Empty state

---

## Dark Mode

Dark mode is the **default** experience for Cognitive Engine. Light mode is supported as an alternative.

| Element        | Dark Mode                | Light Mode         |
| -------------- | ------------------------ | ------------------ |
| Background     | `#0A0A0F`                | `#F8F9FA`          |
| Surface        | `#1A1A2E`                | `#FFFFFF`          |
| Text primary   | `#F8F9FA`                | `#2D3436`          |
| Text secondary | `#9E9E9E`                | `#757575`          |
| Border         | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` |

---

> _This design system will evolve as components are built. All values should be implemented as CSS custom properties or design tokens._
