/**
 * Cognitive Engine Design System Tokens & Constants
 * Source of truth: docs/ux/design-system.md
 * Palette: Stitch Archival Ledger (Warm Parchment & Espresso Ink)
 * Direction History: Direction 5 (Finalized Archival Ledger)
 */

export const UI_VERSION = "0.4.0";

export const tokens = {
  colors: {
    // Canvas & Core Surfaces
    canvasParchment: "#F6F4EE",
    surfacePure: "#FFFFFF",
    surfaceRaised: "#EFECE4",
    surfaceHover: "#E5E1D7",
    surfacePressed: "#DCD8CD",

    // Hairline & Structural Borders
    borderHairline: "rgba(26, 22, 18, 0.10)",
    borderStructural: "rgba(26, 22, 18, 0.22)",
    borderFocus: "#1A1612",

    // Ink Hierarchy
    inkBone: "#1A1612",
    inkStone: "#4A463F",
    inkDust: "#8C887F",
    inkInverse: "#F6F4EE",

    // Tactile Actions
    actionEspresso: "#2B231A",
    actionEspressoHover: "#3D3227",

    // Taxonomy & Mark
    tagBg: "#EFECE4",
    highlightBg: "rgba(26, 22, 18, 0.08)",

    // Semantic Status Tokens (Muted, Restrained, Non-SaaS)
    statusSuccess: "#3A5A40",
    statusSuccessBg: "rgba(58, 90, 64, 0.08)",
    statusSuccessBorder: "rgba(58, 90, 64, 0.28)",

    statusWarning: "#B85D36",
    statusWarningBg: "rgba(184, 93, 54, 0.08)",
    statusWarningBorder: "rgba(184, 93, 54, 0.28)",

    statusError: "#8B3A2B",
    statusErrorBg: "rgba(139, 58, 43, 0.08)",
    statusErrorBorder: "rgba(139, 58, 43, 0.28)",

    statusInfo: "#4D5C6A",
    statusInfoBg: "rgba(77, 92, 106, 0.08)",
    statusInfoBorder: "rgba(77, 92, 106, 0.25)",
  },
  typography: {
    fontHeadline: "'Playfair Display', Georgia, serif",
    fontDisplay: "'Space Grotesk', -apple-system, sans-serif",
    fontSerif: "'Newsreader', Georgia, serif",
    fontBody: "'Inter', -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', monospace",
  },
  semanticTypography: {
    human: "'Newsreader', Georgia, serif",
    editorial: "'Playfair Display', Georgia, serif",
    system: "'Space Grotesk', -apple-system, sans-serif",
    utility: "'Inter', -apple-system, sans-serif",
    provenance: "'JetBrains Mono', monospace",
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
    16: "64px",
  },
  radius: {
    sharp: "0px",
    stamp: "1px",
    slip: "2px",
    pill: "9999px",
  },
  shadows: {
    slip: "2px 3px 0px rgba(26, 22, 18, 0.20)",
    card: "2px 3px 0px rgba(0, 0, 0, 0.12)",
    dock: "2px 4px 0px rgba(0, 0, 0, 0.28)",
  },
  motion: {
    duration: {
      micro: "120ms",
      standard: "220ms",
      emphasis: "350ms",
    },
    easing: {
      precise: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
  },
} as const;

export type DesignTokens = typeof tokens;

// Reusable Primitive Components
export * from "./Button";
export * from "./Badge";
export * from "./Surface";
export * from "./EmptyState";
export * from "./LoadingSkeleton";
