/**
 * Cognitive Engine Design System Tokens & Constants
 * Source of truth: docs/ux/design-system.md
 * Palette: Alabaster Chalk & Bone Ink (Human-Made Constraints Framework)
 */

export const UI_VERSION = "0.2.0-beta";

export const tokens = {
  colors: {
    canvasAlabaster: "#F3F3F0",
    surfacePure: "#FFFFFF",
    surfaceRaised: "#E9E9E5",
    surfacePressed: "#DFDFD9",
    borderHairline: "rgba(20, 23, 26, 0.10)",
    borderStructural: "rgba(20, 23, 26, 0.24)",
    inkBone: "#14171A",
    inkZinc: "#5A626A",
    inkDust: "#8C949D",
    accentMoss: "#3A5A40",
    accentOchre: "#B85D36",
  },
  typography: {
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
    stamp: "2px",
    slip: "3px",
    pill: "9999px",
  },
  shadows: {
    slip: "2px 3px 0px rgba(0, 0, 0, 0.22)",
    entry: "1px 2px 0px rgba(0, 0, 0, 0.08)",
    dock: "2px 3px 0px rgba(0, 0, 0, 0.25)",
  },
} as const;

export type DesignTokens = typeof tokens;
