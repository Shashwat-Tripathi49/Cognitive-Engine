import { EntityType, ResolutionResult, CanonicalEntity } from '../types.js';
import { normalizeText } from './normalizer.js';
import { stringSimilarity } from './string-similarity.js';
import { RESOLVER_CONSTANTS, GENERIC_ANAPHORA_PATTERNS } from './constants.js';
import { EmbeddingProvider } from '../../memory/types.js';

export interface ResolverOptions {
  stringThreshold?: number;
  embedThreshold?: number;
  margin?: number;
  ambLowerThreshold?: number;
  modifierTrapMinDelta?: number;
}

export interface CachedEntityEmbeddings {
  canonical: number[];
  aliases: number[][];
}

/**
 * Computes cosine similarity between two numeric vectors
 */
export function cosineSimilarity(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length !== v2.length) {
    return 0.0;
  }
  let dot = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB) + 1e-9;
  return dot / denom;
}

/**
 * Layered Hybrid Entity Resolver V2
 *
 * Implements the 8-layer waterfall operating at the Experiment 004C Pareto frontier.
 */
export class LayeredHybridEntityResolver {
  private strThreshold: number;
  private embedThreshold: number;
  private margin: number;
  private ambLowerThreshold: number;
  private modifierTrapMinDelta: number;

  constructor(
    private embeddingProvider?: EmbeddingProvider,
    options: ResolverOptions = {}
  ) {
    this.strThreshold =
      options.stringThreshold ?? RESOLVER_CONSTANTS.STRING_SIM_THRESHOLD;
    this.embedThreshold =
      options.embedThreshold ?? RESOLVER_CONSTANTS.EMBED_SIM_THRESHOLD;
    this.margin = options.margin ?? RESOLVER_CONSTANTS.SEPARATION_MARGIN;
    this.ambLowerThreshold =
      options.ambLowerThreshold ?? RESOLVER_CONSTANTS.CONFIRMATION_BAND_LOWER;
    this.modifierTrapMinDelta =
      options.modifierTrapMinDelta ?? RESOLVER_CONSTANTS.MODIFIER_TRAP_MIN_DELTA;
  }

  /**
   * Resolves an extracted entity mention against active canonical entities for a tenant
   */
  async resolve(
    mention: string,
    entityType: EntityType,
    canonicalEntities: CanonicalEntity[],
    precomputedEmbeddings?: Map<string, CachedEntityEmbeddings>,
    mentionEmbedding?: number[]
  ): Promise<ResolutionResult> {
    const normM = normalizeText(mention);

    if (!normM) {
      return {
        outcome: 'NO_MATCH',
        confidence: 0.0,
        similarityScore: 0.0,
        resolutionMethod: 'L8_DEFAULT_FALLBACK',
      };
    }

    // Filter to active candidate entities of the matching entity type
    const typedCandidates = canonicalEntities.filter(
      (e) => e.entityType === entityType && e.status === 'ACTIVE'
    );

    // =========================================================================
    // Layer 1: Ambiguity & Generic Anaphora Gatekeeper
    // =========================================================================
    for (const pattern of GENERIC_ANAPHORA_PATTERNS) {
      if (pattern.test(normM)) {
        return {
          outcome: 'AMBIGUOUS',
          confidence: 1.0,
          similarityScore: 1.0,
          resolutionMethod: 'L1_ANAPHORA_GATEKEEPER',
        };
      }
    }

    // Polysemous / shared active aliases check
    const matchingExactIds: string[] = [];
    for (const ent of typedCandidates) {
      const entNorm = normalizeText(ent.canonicalName);
      const aliasNorms = (ent.aliases || []).map((a) => normalizeText(a));
      if (normM === entNorm || aliasNorms.includes(normM)) {
        matchingExactIds.push(ent.id);
      }
    }

    if (matchingExactIds.length > 1) {
      return {
        outcome: 'AMBIGUOUS',
        confidence: 0.95,
        similarityScore: 0.95,
        resolutionMethod: 'L1_POLYSEMOUS_AMBIGUITY',
      };
    }

    // =========================================================================
    // Layer 2: Exact & Normalized Match
    // =========================================================================
    for (const ent of typedCandidates) {
      if (normM === normalizeText(ent.canonicalName)) {
        return {
          outcome: 'RESOLVED',
          canonicalId: ent.id,
          confidence: 1.0,
          similarityScore: 1.0,
          resolutionMethod: 'L2_EXACT_NORMALIZED_MATCH',
        };
      }
    }

    // =========================================================================
    // Layer 3: Verified Active Alias Dictionary Lookup
    // =========================================================================
    for (const ent of typedCandidates) {
      const aliasNorms = (ent.aliases || []).map((a) => normalizeText(a));
      if (aliasNorms.includes(normM)) {
        return {
          outcome: 'RESOLVED',
          canonicalId: ent.id,
          confidence: 1.0,
          similarityScore: 1.0,
          resolutionMethod: 'L3_VERIFIED_ALIAS_MATCH',
        };
      }
    }

    // =========================================================================
    // Layer 4: Hard Negative Modifier / Extension Trap Gatekeeper
    // =========================================================================
    for (const ent of typedCandidates) {
      const cNorm = normalizeText(ent.canonicalName);
      if (
        cNorm &&
        normM.includes(cNorm) &&
        normM.length > cNorm.length + (this.modifierTrapMinDelta - 1)
      ) {
        return {
          outcome: 'NO_MATCH',
          confidence: 0.2,
          similarityScore: 0.2,
          resolutionMethod: 'L4_MODIFIER_TRAP_GATEKEEPER',
        };
      }
      for (const alias of ent.aliases || []) {
        const aNorm = normalizeText(alias);
        if (
          aNorm &&
          normM.includes(aNorm) &&
          normM.length > aNorm.length + (this.modifierTrapMinDelta - 1)
        ) {
          return {
            outcome: 'NO_MATCH',
            confidence: 0.2,
            similarityScore: 0.2,
            resolutionMethod: 'L4_MODIFIER_TRAP_GATEKEEPER',
          };
        }
      }
    }

    // =========================================================================
    // Layer 5: High-Precision String Similarity
    // =========================================================================
    let bestStrId: string | undefined;
    let bestStrSim = 0.0;

    for (const ent of typedCandidates) {
      const sim = stringSimilarity(mention, ent.canonicalName);
      if (sim > bestStrSim) {
        bestStrSim = sim;
        bestStrId = ent.id;
      }
      for (const alias of ent.aliases || []) {
        const aSim = stringSimilarity(mention, alias);
        if (aSim > bestStrSim) {
          bestStrSim = aSim;
          bestStrId = ent.id;
        }
      }
    }

    if (bestStrSim >= this.strThreshold && bestStrId) {
      return {
        outcome: 'RESOLVED',
        canonicalId: bestStrId,
        confidence: bestStrSim,
        similarityScore: bestStrSim,
        resolutionMethod: 'L5_STRING_SIMILARITY',
      };
    }

    // =========================================================================
    // Layer 6 & Layer 7: Guarded Local Embedding Candidate Generation & Margin Check
    // =========================================================================
    if (this.embeddingProvider || mentionEmbedding || precomputedEmbeddings) {
      let mVec = mentionEmbedding;
      if (!mVec && this.embeddingProvider) {
        mVec = await this.embeddingProvider.generateEmbedding(mention);
      }

      if (mVec && typedCandidates.length > 0) {
        const ranked: { id: string; similarity: number }[] = [];

        for (const ent of typedCandidates) {
          let entEmbedding = precomputedEmbeddings?.get(ent.id)?.canonical;
          if (!entEmbedding && this.embeddingProvider) {
            entEmbedding = await this.embeddingProvider.generateEmbedding(
              ent.canonicalName
            );
          }

          if (entEmbedding) {
            const sim = cosineSimilarity(mVec, entEmbedding);
            ranked.push({ id: ent.id, similarity: sim });
          }

          const aliasEmbeddings = precomputedEmbeddings?.get(ent.id)?.aliases;
          if (aliasEmbeddings) {
            for (const aVec of aliasEmbeddings) {
              const aSim = cosineSimilarity(mVec, aVec);
              ranked.push({ id: ent.id, similarity: aSim });
            }
          } else if (this.embeddingProvider && ent.aliases) {
            for (const alias of ent.aliases) {
              const aVec = await this.embeddingProvider.generateEmbedding(alias);
              const aSim = cosineSimilarity(mVec, aVec);
              ranked.push({ id: ent.id, similarity: aSim });
            }
          }
        }

        ranked.sort((a, b) => b.similarity - a.similarity);

        if (ranked.length > 0) {
          const top1 = ranked[0];
          const top2Sim = ranked.length > 1 ? ranked[1].similarity : 0.0;
          const sepMargin = top1.similarity - top2Sim;

          if (
            top1.similarity >= this.embedThreshold &&
            sepMargin >= this.margin
          ) {
            return {
              outcome: 'RESOLVED',
              canonicalId: top1.id,
              confidence: top1.similarity,
              similarityScore: top1.similarity,
              separationMargin: sepMargin,
              resolutionMethod: 'L6_GUARDED_EMBEDDING_MARGIN',
            };
          } else if (top1.similarity >= this.ambLowerThreshold) {
            return {
              outcome: 'AMBIGUOUS',
              suggestedCanonicalId: top1.id,
              confidence: top1.similarity,
              similarityScore: top1.similarity,
              separationMargin: sepMargin,
              resolutionMethod: 'L7_CONFIRMATION_BAND',
            };
          }
        }
      }
    }

    // =========================================================================
    // Layer 8: Default Fallback
    // =========================================================================
    return {
      outcome: 'NO_MATCH',
      confidence: 0.0,
      similarityScore: 0.0,
      resolutionMethod: 'L8_DEFAULT_FALLBACK',
    };
  }
}
