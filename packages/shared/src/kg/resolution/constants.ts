/**
 * Validated Production Constants for Layered Hybrid Resolver V2
 * Empirically frozen based on Experiment 004C Pareto frontier analysis
 */
export const RESOLVER_CONSTANTS = {
  STRING_SIM_THRESHOLD: 0.85,
  EMBED_SIM_THRESHOLD: 0.80,
  SEPARATION_MARGIN: 0.04,
  CONFIRMATION_BAND_LOWER: 0.75,
  MODIFIER_TRAP_MIN_DELTA: 3,
  RESOLVER_VERSION: 'v2.0.0',
} as const;

/**
 * Regex patterns for Layer 1 Ambiguity & Generic Anaphora Gatekeeper
 */
export const GENERIC_ANAPHORA_PATTERNS: RegExp[] = [
  /^(the|a|an)\s+(project|tool|app|system|database|client|manager|module)$/i,
  /^(my|our)\s+(manager|boss|client|professor|roommate|friend|mom|dad)$/i,
  /^(he|she|they|it|this|that|these|those)$/i,
  /^5k\s+goal$/i,
  /^dashboard$/i,
];
