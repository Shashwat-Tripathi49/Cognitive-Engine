export * from './env.js';
export * from './db/index.js';
export * from './capture/index.js';
export * from './memory/index.js';
export * from './kg/index.js';
export * from './reasoning/index.js';
export * from './cognitive/index.js';

/**
 * Common shared constants — Sprint 1C-B Baseline
 */
export const CONSTANTS = {
  APP_NAME: 'Cognitive Engine',
  API_VERSION: 'v1',
  DEFAULT_PORT: 3001,
} as const;
