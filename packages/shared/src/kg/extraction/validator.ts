import { VALID_ENTITY_TYPES, EntityType, REJECTED_ENTITY_TYPES } from '../types.js';
import { ExtractedEntityMention } from './types.js';

export class ExtractionValidationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'ExtractionValidationError';
  }
}

/**
 * Normalizes and validates raw LLM output into strictly typed ExtractedEntityMentions.
 */
export class ExtractionValidator {
  private static readonly VALID_TYPE_MAP = new Map<string, EntityType>(
    VALID_ENTITY_TYPES.map((t) => [t.toLowerCase(), t])
  );

  private static readonly REJECTED_TYPES = new Set<string>(
    REJECTED_ENTITY_TYPES.map((t) => t.toLowerCase())
  );

  /**
   * Validates and parses raw model output payload
   */
  static validate(
    rawInput: unknown,
    sourceText?: string
  ): ExtractedEntityMention[] {
    if (!rawInput) {
      return [];
    }

    let parsedObj: any = rawInput;
    if (typeof rawInput === 'string') {
      try {
        parsedObj = JSON.parse(rawInput);
      } catch (err) {
        throw new ExtractionValidationError('Invalid JSON emitted by extractor', {
          raw: rawInput,
        });
      }
    }

    if (typeof parsedObj !== 'object' || parsedObj === null) {
      return [];
    }

    const rawList = Array.isArray(parsedObj.entities)
      ? parsedObj.entities
      : Array.isArray(parsedObj)
        ? parsedObj
        : [];

    const validated: ExtractedEntityMention[] = [];
    const seen = new Set<string>();

    for (const item of rawList) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const rawName = typeof item.name === 'string' ? item.name : '';
      const cleanName = rawName.trim().replace(/^["']|["']$/g, '');

      if (!cleanName || cleanName.length < 2) {
        continue;
      }

      const rawType = typeof item.type === 'string' ? item.type.trim().toLowerCase() : '';
      
      // Check for explicitly rejected ontology types
      if (this.REJECTED_TYPES.has(rawType)) {
        continue;
      }

      const mappedType = this.VALID_TYPE_MAP.get(rawType);
      if (!mappedType) {
        // Unknown or out-of-ontology type -> reject safely
        continue;
      }

      const dedupeKey = `${mappedType}:${cleanName.toLowerCase()}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      let startOffset: number | undefined;
      let endOffset: number | undefined;
      if (sourceText) {
        const idx = sourceText.toLowerCase().indexOf(cleanName.toLowerCase());
        if (idx !== -1) {
          startOffset = idx;
          endOffset = idx + cleanName.length;
        }
      }

      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
      if (
        item.confidence === 'HIGH' ||
        item.confidence === 'MEDIUM' ||
        item.confidence === 'LOW'
      ) {
        confidence = item.confidence;
      }

      validated.push({
        name: cleanName,
        type: mappedType,
        confidence,
        startOffset,
        endOffset,
      });
    }

    return validated;
  }
}
