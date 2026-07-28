# Accessibility Standards

> Cognitive Engine is committed to being accessible to all users. This document defines our accessibility standards and requirements.

---

## Compliance Target

**WCAG 2.2 Level AA** — Our baseline for all features.

---

## Core Requirements

### Perceivable

- [ ] All images have descriptive `alt` text
- [ ] Color is never the sole means of conveying information
- [ ] Minimum contrast ratio: **4.5:1** (text), **3:1** (large text, UI components)
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] Media includes captions/transcripts where applicable

### Operable

- [ ] All functionality is accessible via keyboard
- [ ] No keyboard traps — users can always navigate away
- [ ] Focus indicators are always visible
- [ ] Skip navigation links for repetitive content
- [ ] Adequate time limits (or ability to extend)
- [ ] No flashing content (> 3 flashes/second)

### Understandable

- [ ] Language is declared in HTML (`lang` attribute)
- [ ] Form inputs have visible labels
- [ ] Error messages are descriptive and suggest corrections
- [ ] Navigation is consistent across pages
- [ ] Predictable behavior — no unexpected context changes

### Robust

- [ ] Valid, semantic HTML5
- [ ] ARIA attributes used correctly (not as a substitute for semantic HTML)
- [ ] Tested with screen readers (VoiceOver, NVDA)
- [ ] Works without JavaScript for core content (progressive enhancement)

---

## Implementation Guidelines

### Focus Management

```css
/* Always visible focus indicators */
:focus-visible {
  outline: 2px solid var(--color-synapse);
  outline-offset: 2px;
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Semantic HTML

```html
<!-- ✅ Do this -->
<button onClick={handleSave}>Save thought</button>
<nav aria-label="Main navigation">...</nav>

<!-- ❌ Not this -->
<div onClick={handleSave} class="button">Save thought</div>
<div class="nav">...</div>
```

### Color Contrast

All color combinations must pass contrast checks:

| Combination | Ratio | Status |
|---|---|---|
| Ivory text on Obsidian bg | 18.3:1 | ✅ AAA |
| Nebula (#6C5CE7) on Obsidian | 4.6:1 | ✅ AA |
| Synapse (#00D2FF) on Obsidian | 10.4:1 | ✅ AAA |
| Graphite text on Ivory bg | 14.7:1 | ✅ AAA |

---

## Testing Strategy

| Method | Frequency | Tool |
|---|---|---|
| Automated scans | Every PR | axe-core, Lighthouse |
| Screen reader testing | Monthly | VoiceOver, NVDA |
| Keyboard-only testing | Every feature | Manual |
| Color contrast checks | Every design change | WebAIM Contrast Checker |

---

> _Accessibility is not a feature — it's a requirement. Every PR should consider accessibility impact._
