import crypto from 'crypto';
import { CandidateFinding } from '../../reasoning/types.js';
import { ICognitiveDetector, CognitiveDiscoveryContext } from '../types.js';

/**
 * Graph Co-Occurrence Miner (COLLABORATION_PATTERN & Co-Occurrence)
 *
 * Deterministically analyzes graph topology between entities without semantic promotion of MENTIONED_WITH.
 */
export class GraphCoOccurrenceMiner implements ICognitiveDetector {
  readonly detectorId = 'graph-co-occurrence-miner';
  readonly detectorVersion = '1.0.0';

  async discover(context: CognitiveDiscoveryContext): Promise<CandidateFinding[]> {
    const { userId, config, entities, relationships, fragments, evaluationTimestamp } = context;
    const findings: CandidateFinding[] = [];

    // Map entities
    const entityMap = new Map<string, (typeof entities)[0]>();
    for (const e of entities) {
      if (e.status === 'ACTIVE') {
        entityMap.set(e.id, e);
      }
    }

    // Map fragments
    const fragmentMap = new Map<string, (typeof fragments)[0]>();
    for (const f of fragments) {
      if (f.capturedAt <= evaluationTimestamp) {
        fragmentMap.set(f.id, f);
      }
    }

    // Filter active relationships asserted on or before evaluationTimestamp
    const validRels = relationships.filter(
      (r) =>
        r.status === 'ACTIVE' &&
        r.assertedAt <= evaluationTimestamp &&
        entityMap.has(r.sourceEntityId) &&
        entityMap.has(r.targetEntityId)
    );

    // Group relationships by canonical entity pair (lexicographically ordered)
    const pairGroups = new Map<
      string,
      {
        entityA: (typeof entities)[0];
        entityB: (typeof entities)[0];
        semanticRels: typeof relationships;
        coOccurrenceRels: typeof relationships;
      }
    >();

    for (const r of validRels) {
      const eSource = entityMap.get(r.sourceEntityId)!;
      const eTarget = entityMap.get(r.targetEntityId)!;

      const [entityA, entityB] =
        eSource.id < eTarget.id ? [eSource, eTarget] : [eTarget, eSource];

      const pairKey = `${entityA.id}:${entityB.id}`;
      const existing = pairGroups.get(pairKey) || {
        entityA,
        entityB,
        semanticRels: [],
        coOccurrenceRels: [],
      };

      if (r.relationType === 'COLLABORATED_WITH' || r.relationType === 'WORKED_ON') {
        existing.semanticRels.push(r);
      } else if (r.relationType === 'MENTIONED_WITH') {
        existing.coOccurrenceRels.push(r);
      }

      pairGroups.set(pairKey, existing);
    }

    const sortedPairKeys = Array.from(pairGroups.keys()).sort();

    for (const pairKey of sortedPairKeys) {
      const group = pairGroups.get(pairKey)!;

      // 1. Check for verified Collaboration / Work pattern (explicit semantic relationships)
      if (group.semanticRels.length > 0) {
        // Collect distinct supporting fragments for the semantic edges
        const fragMap = new Map<string, { fragmentId: string; contentHash: string; capturedAt: Date }>();
        const relIds: string[] = [];

        for (const r of group.semanticRels) {
          relIds.push(r.id);
          if (r.sourceFragmentId && r.sourceContentHash) {
            const frag = fragmentMap.get(r.sourceFragmentId);
            if (frag) {
              fragMap.set(frag.id, {
                fragmentId: frag.id,
                contentHash: frag.contentHash,
                capturedAt: frag.capturedAt,
              });
            }
          }
        }

        const distinctFragCount = fragMap.size;

        // Multiplicity gate: must be observed across >= minCoOccurrenceCount fragments
        if (distinctFragCount >= config.minCoOccurrenceCount) {
          const provRefs = Array.from(fragMap.values()).sort(
            (a, b) => a.capturedAt.getTime() - b.capturedAt.getTime()
          );

          const timestamps = provRefs.map((p) => p.capturedAt.getTime());
          const startDate = new Date(Math.min(...timestamps));
          const endDate = new Date(Math.max(...timestamps));

          const rawConf = Math.min(
            1.0,
            0.6 + 0.2 * Math.min(2, distinctFragCount - 1)
          );
          const discoveryConfidence = Math.round(rawConf * 10000) / 10000;

          const summary = `Collaboration pattern: ${group.entityA.canonicalName} and ${group.entityB.canonicalName} (${distinctFragCount} fragments)`;
          const statement = `Observed recurring collaboration relationship between '${group.entityA.canonicalName}' and '${group.entityB.canonicalName}' across ${distinctFragCount} independent journal entries.`;

          findings.push({
            id: crypto.randomUUID(),
            userId,
            findingType: 'COLLABORATION_PATTERN',
            summary,
            statement,
            subjectEntityId: group.entityA.id,
            objectEntityId: group.entityB.id,
            involvedEntityIds: [group.entityA.id, group.entityB.id],
            involvedMemoryIds: [],
            involvedRelationshipIds: relIds,
            temporalScope: {
              startDate,
              endDate,
            },
            deterministicMetrics: {
              distinctFragmentCount: distinctFragCount,
              relationshipCount: group.semanticRels.length,
            },
            discoveryAlgorithm: this.detectorId,
            discoveryVersion: this.detectorVersion,
            discoveryConfidence,
            provenanceReferences: provRefs,
            metadata: {
              configSnapshot: config,
            },
          });
        }
      }

      // Negative Guard: MENTIONED_WITH is NEVER promoted to COLLABORATION_PATTERN
      // If only MENTIONED_WITH exists, no COLLABORATION_PATTERN finding is emitted.
    }

    return findings;
  }
}
