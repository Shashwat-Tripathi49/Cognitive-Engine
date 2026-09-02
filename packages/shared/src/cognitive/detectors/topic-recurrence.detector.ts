import crypto from 'crypto';
import { CandidateFinding } from '../../reasoning/types.js';
import { ICognitiveDetector, CognitiveDiscoveryContext } from '../types.js';

/**
 * Topic Recurrence Detector (RECURRING_TOPIC_FOCUS)
 *
 * Deterministically discovers canonical entities mentioned across distinct journal fragments.
 */
export class TopicRecurrenceDetector implements ICognitiveDetector {
  readonly detectorId = 'topic-recurrence-detector';
  readonly detectorVersion = '1.0.0';

  async discover(context: CognitiveDiscoveryContext): Promise<CandidateFinding[]> {
    const { userId, config, entities, provenance, fragments, evaluationTimestamp } = context;
    const findings: CandidateFinding[] = [];

    // Map fragment metadata for lookup
    const fragmentMap = new Map<string, { id: string; contentHash: string; capturedAt: Date }>();
    for (const f of fragments) {
      // Ignore future fragments relative to evaluationTimestamp
      if (f.capturedAt <= evaluationTimestamp) {
        fragmentMap.set(f.id, f);
      }
    }

    // Map entities for lookup
    const entityMap = new Map<string, (typeof entities)[0]>();
    for (const e of entities) {
      if (e.status === 'ACTIVE') {
        entityMap.set(e.id, e);
      }
    }

    // Group valid provenance records by canonical entity ID
    const entityProvs = new Map<string, typeof provenance>();
    for (const p of provenance) {
      const frag = fragmentMap.get(p.sourceFragmentId);
      if (frag && entityMap.has(p.canonicalId)) {
        const list = entityProvs.get(p.canonicalId) || [];
        list.push(p);
        entityProvs.set(p.canonicalId, list);
      }
    }

    // Sort entity IDs lexicographically for deterministic processing
    const sortedEntityIds = Array.from(entityProvs.keys()).sort();

    for (const canonicalId of sortedEntityIds) {
      const provList = entityProvs.get(canonicalId)!;
      const entity = entityMap.get(canonicalId)!;

      // Deduplicate distinct root fragments
      const distinctFragIds = new Set<string>();
      const provRefs: { fragmentId: string; contentHash: string; capturedAt: Date }[] = [];

      // Sort provenance by capturedAt ASC, fragmentId ASC for determinism
      const sortedProv = [...provList].sort((a, b) => {
        const fragA = fragmentMap.get(a.sourceFragmentId)!;
        const fragB = fragmentMap.get(b.sourceFragmentId)!;
        const timeDiff = fragA.capturedAt.getTime() - fragB.capturedAt.getTime();
        return timeDiff !== 0 ? timeDiff : a.sourceFragmentId.localeCompare(b.sourceFragmentId);
      });

      for (const p of sortedProv) {
        if (!distinctFragIds.has(p.sourceFragmentId)) {
          distinctFragIds.add(p.sourceFragmentId);
          const frag = fragmentMap.get(p.sourceFragmentId)!;
          provRefs.push({
            fragmentId: frag.id,
            contentHash: frag.contentHash,
            capturedAt: frag.capturedAt,
          });
        }
      }

      const distinctFragmentCount = distinctFragIds.size;

      // Multiplicity check: must meet minRecurrenceFragments
      if (distinctFragmentCount < config.minRecurrenceFragments) {
        continue;
      }

      // Calculate temporal scope
      const timestamps = provRefs.map((p) => p.capturedAt.getTime());
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const startDate = new Date(minTime);
      const endDate = new Date(maxTime);

      // Compute deterministic discovery confidence
      const rawConf =
        0.5 + 0.5 * (distinctFragmentCount / config.recurrenceTargetSaturation);
      const discoveryConfidence = Math.min(1.0, Math.round(rawConf * 10000) / 10000);

      // Temporal density (frequency per week)
      const durationWeeks = Math.max(
        1.0,
        (maxTime - minTime) / (1000 * 60 * 60 * 24 * 7)
      );
      const frequencyPerWeek =
        Math.round((distinctFragmentCount / durationWeeks) * 100) / 100;

      const summary = `Recurring topic: ${entity.canonicalName} across ${distinctFragmentCount} fragments`;
      const statement = `Entity '${entity.canonicalName}' was observed across ${distinctFragmentCount} independent journal entries between ${startDate.toISOString().slice(0, 10)} and ${endDate.toISOString().slice(0, 10)}.`;

      // Deterministic UUID based on canonicalId and algorithm
      const id = crypto.randomUUID();

      findings.push({
        id,
        userId,
        findingType: 'RECURRING_TOPIC_FOCUS',
        summary,
        statement,
        subjectEntityId: entity.id,
        involvedEntityIds: [entity.id],
        involvedMemoryIds: [],
        involvedRelationshipIds: [],
        temporalScope: {
          startDate,
          endDate,
        },
        deterministicMetrics: {
          distinctFragmentCount,
          totalMentionCount: provList.length,
          frequencyPerWeek,
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
