/**
 * Cognitive Engine Design System Tokens & Constants
 * Source of truth: docs/ux/design-system.md
 * Palette: Stitch Archival Ledger (Warm Parchment & Espresso Ink)
 * Direction History: Direction 5 (Finalized Archival Ledger)
 */

export const UI_VERSION = "0.3.0";

export const tokens = {
  colors: {
    canvasParchment: "#F6F4EE",
    surfacePure: "#FFFFFF",
    surfaceRaised: "#EFECE4",
    surfacePressed: "#E5E1D7",
    borderHairline: "rgba(26, 22, 18, 0.10)",
    borderStructural: "rgba(26, 22, 18, 0.22)",
    borderFocus: "#1A1612",
    inkBone: "#1A1612",
    inkStone: "#4A463F",
    inkDust: "#8C887F",
    inkInverse: "#F6F4EE",
    actionEspresso: "#2B231A",
    actionEspressoHover: "#3D3227",
    tagBg: "#EFECE4",
    highlightBg: "rgba(26, 22, 18, 0.08)",
  },
  typography: {
    fontHeadline: "'Playfair Display', Georgia, serif",
    fontDisplay: "'Space Grotesk', -apple-system, sans-serif",
    fontSerif: "'Newsreader', Georgia, serif",
    fontBody: "'Inter', -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', monospace",
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
} as const;

export type DesignTokens = typeof tokens;
