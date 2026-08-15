/**
 * Cognitive Engine Design System Tokens & Constants
 * Source of truth: docs/ux/design-system.md
 */

export const UI_VERSION = "0.1.0-alpha";

export const tokens = {
  colors: {
    obsidian: "#0A0A0F",
    nebula: "#6C5CE7",
    synapse: "#00D2FF",
    cognition: "#A29BFE",
    ivory: "#F8F9FA",
    graphite: "#2D3436",
    surface: "#161A22",
    surfaceAlt: "#1A1A2E",
    surfaceHover: "#1E232F",
    border: "rgba(255, 255, 255, 0.08)",
    borderHover: "rgba(255, 255, 255, 0.16)",
    textPrimary: "#F8F9FA",
    textSecondary: "#9E9E9E",
    textMuted: "#757575",
    success: "#00B894",
    warning: "#FDCB6E",
    error: "#E17055",
    info: "#74B9FF",
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
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px rgba(0, 0, 0, 0.07)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    glow: "0 0 20px rgba(108, 92, 231, 0.3)",
    glowFocus: "0 0 0 2px rgba(108, 92, 231, 0.4)",
  },
  motion: {
    durationFast: "100ms",
    durationNormal: "200ms",
    durationSlow: "300ms",
    durationSlower: "500ms",
  },
} as const;

export type DesignTokens = typeof tokens;
