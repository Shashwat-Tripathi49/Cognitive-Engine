import { EntityType } from '../types.js';

/**
 * Extracted Entity Mention from unstructured text
 */
export interface ExtractedEntityMention {
  name: string;
  type: EntityType;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  startOffset?: number;
  endOffset?: number;
}

/**
 * Metadata recorded during extraction
 */
export interface ExtractionMetadata {
  providerName: string;
  model: string;
  promptVersion: string;
  extractionRunId: string;
  promptTokens?: number;
  completionTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  latencyMs: number;
}

/**
 * Structured Output of the Extraction Provider
 */
export interface StructuredExtractionResult {
  entities: ExtractedEntityMention[];
  metadata: ExtractionMetadata;
  rawResponse?: string;
}

/**
 * Entity Extraction Provider Interface
 *
 * Pluggable abstraction decoupling entity extraction from downstream resolution and graph persistence.
 */
export interface EntityExtractionProvider {
  readonly providerName: string;
  readonly modelName: string;

  extractEntities(
    text: string,
    context?: {
      fragmentId?: string;
      userId?: string;
      capturedAt?: Date;
    }
  ): Promise<StructuredExtractionResult>;
}
