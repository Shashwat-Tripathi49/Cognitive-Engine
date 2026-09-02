import crypto from 'crypto';
import { CandidateFinding } from '../../reasoning/types.js';
import { ICognitiveDetector, CognitiveDiscoveryContext } from '../types.js';

interface EntityObservation {
  entityId: string;
  entityName: string;
  fragmentId: string;
  contentHash: string;
  capturedAt: Date;
}

/**
 * Temporal Sequence Miner (TEMPORAL_SEQUENCE)
 *
 * Deterministically mines chronological succession patterns A -> B across the user's timeline.
 */
export class TemporalSequenceMiner implements ICognitiveDetector {
  readonly detectorId = 'temporal-sequence-miner';
  readonly detectorVersion = '1.0.0';

  async discover(context: CognitiveDiscoveryContext): Promise<CandidateFinding[]> {
    const { userId, config, entities, provenance, fragments, evaluationTimestamp } = context;
    const findings: CandidateFinding[] = [];

    // Map fragments
    const fragmentMap = new Map<string, { id: string; contentHash: string; capturedAt: Date }>();
    for (const f of fragments) {
      if (f.capturedAt <= evaluationTimestamp) {
        fragmentMap.set(f.id, f);
      }
    }

    // Map active entities
    const entityMap = new Map<string, (typeof entities)[0]>();
    for (const e of entities) {
      if (e.status === 'ACTIVE') {
        entityMap.set(e.id, e);
      }
    }

    // Group observations by distinct (fragmentId, entityId)
    const observations: EntityObservation[] = [];
    const seenFragEntity = new Set<string>();

    for (const p of provenance) {
      const frag = fragmentMap.get(p.sourceFragmentId);
      const entity = entityMap.get(p.canonicalId);
      if (frag && entity) {
        const key = `${frag.id}:${entity.id}`;
        if (!seenFragEntity.has(key)) {
          seenFragEntity.add(key);
          observations.push({
            entityId: entity.id,
            entityName: entity.canonicalName,
            fragmentId: frag.id,
            contentHash: frag.contentHash,
            capturedAt: frag.capturedAt,
          });
        }
      }
    }

    // Sort observations chronologically: capturedAt ASC, fragmentId ASC, entityId ASC
    observations.sort((a, b) => {
      const timeDiff = a.capturedAt.getTime() - b.capturedAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      const fragDiff = a.fragmentId.localeCompare(b.fragmentId);
      if (fragDiff !== 0) return fragDiff;
      return a.entityId.localeCompare(b.entityId);
    });

    const maxGapMs = config.maxSequenceGapHours * 60 * 60 * 1000;

    // Track transitions between distinct entities across separate fragments
    // Map key: "entityA_id:entityB_id" -> list of { fromObs, toObs }
    const transitions = new Map<
      string,
      {
        entityA: { id: string; name: string };
        entityB: { id: string; name: string };
        instances: { from: EntityObservation; to: EntityObservation }[];
      }
    >();

    for (let i = 0; i < observations.length; i++) {
      const obsA = observations[i];
      for (let j = i + 1; j < observations.length; j++) {
        const obsB = observations[j];

        // Must be distinct fragments and distinct entities
        if (obsA.fragmentId === obsB.fragmentId) continue;
        if (obsA.entityId === obsB.entityId) continue;

        const deltaMs = obsB.capturedAt.getTime() - obsA.capturedAt.getTime();

        // Must be chronologically strictly after
        if (deltaMs <= 0) continue;

        // Must be within maxSequenceGapHours
        if (deltaMs > maxGapMs) break;

        const pairKey = `${obsA.entityId}:${obsB.entityId}`;
        const existing = transitions.get(pairKey) || {
          entityA: { id: obsA.entityId, name: obsA.entityName },
          entityB: { id: obsB.entityId, name: obsB.entityName },
          instances: [],
        };

        // Avoid duplicate transitions with the same (fromFrag, toFrag)
        const alreadyRecorded = existing.instances.some(
          (inst) =>
            inst.from.fragmentId === obsA.fragmentId &&
            inst.to.fragmentId === obsB.fragmentId
        );

        if (!alreadyRecorded) {
          existing.instances.push({ from: obsA, to: obsB });
          transitions.set(pairKey, existing);
        }
      }
    }

    // Sort transition keys for determinism
    const sortedPairKeys = Array.from(transitions.keys()).sort();

    for (const pairKey of sortedPairKeys) {
      const entry = transitions.get(pairKey)!;
      const sequenceOccurrences = entry.instances.length;

      // Filter by minSequenceOccurrences
      if (sequenceOccurrences < config.minSequenceOccurrences) {
        continue;
      }

      // Collect all distinct root fragments
      const fragIdMap = new Map<string, { fragmentId: string; contentHash: string; capturedAt: Date }>();
      const intervalsHours: number[] = [];

      for (const inst of entry.instances) {
        fragIdMap.set(inst.from.fragmentId, {
          fragmentId: inst.from.fragmentId,
          contentHash: inst.from.contentHash,
          capturedAt: inst.from.capturedAt,
        });
        fragIdMap.set(inst.to.fragmentId, {
          fragmentId: inst.to.fragmentId,
          contentHash: inst.to.contentHash,
          capturedAt: inst.to.capturedAt,
        });

        const deltaHours =
          (inst.to.capturedAt.getTime() - inst.from.capturedAt.getTime()) /
          (1000 * 60 * 60);
        intervalsHours.push(deltaHours);
      }

      const provRefs = Array.from(fragIdMap.values()).sort(
        (a, b) => a.capturedAt.getTime() - b.capturedAt.getTime()
      );

      const timestamps = provRefs.map((p) => p.capturedAt.getTime());
      const startDate = new Date(Math.min(...timestamps));
      const endDate = new Date(Math.max(...timestamps));

      const avgIntervalHours =
        intervalsHours.reduce((acc, v) => acc + v, 0) / intervalsHours.length;

      // Discovery confidence: bounded in [0.0, 1.0]
      const rawConf = 0.6 + 0.2 * (sequenceOccurrences - 1);
      const discoveryConfidence = Math.min(1.0, Math.round(rawConf * 10000) / 10000);

      const summary = `Temporal sequence: ${entry.entityA.name} -> ${entry.entityB.name} (${sequenceOccurrences} transitions)`;
      const statement = `Observed chronological sequence where '${entry.entityA.name}' was followed by '${entry.entityB.name}' across ${sequenceOccurrences} distinct observation windows.`;

      findings.push({
        id: crypto.randomUUID(),
        userId,
        findingType: 'TEMPORAL_SEQUENCE',
        summary,
        statement,
        subjectEntityId: entry.entityA.id,
        objectEntityId: entry.entityB.id,
        involvedEntityIds: [entry.entityA.id, entry.entityB.id],
        involvedMemoryIds: [],
        involvedRelationshipIds: [],
        temporalScope: {
          startDate,
          endDate,
        },
        deterministicMetrics: {
          distinctFragmentCount: provRefs.length,
          sequenceOccurrences,
          sequenceIntervalHours: Math.round(avgIntervalHours * 10) / 10,
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

    return findings;
  }
}
