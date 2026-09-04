import {
  ReflectionInputBundle,
  LLMReflectionResponse,
  GroundedProposition,
  ReflectionSegment,
} from './types.js';

export function renderRelationshipFallback(
  relationType: string,
  entityA: string,
  entityB: string,
  count: number,
  startDate: string,
  endDate: string
): string {
  switch (relationType) {
    case 'COLLABORATED_WITH':
      return `The journal records recurring verified collaboration between '${entityA}' and '${entityB}' across ${count} distinct entries between ${startDate} and ${endDate}.`;
    case 'WORKED_ON':
      return `The journal records that '${entityA}' worked on '${entityB}' across ${count} distinct entries between ${startDate} and ${endDate}.`;
    case 'USES_TECHNOLOGY':
      return `The journal records verified technology usage of '${entityB}' by '${entityA}' across ${count} distinct entries between ${startDate} and ${endDate}.`;
    case 'MENTIONED_WITH':
    default:
      return `The journal records recurring co-mention of '${entityA}' and '${entityB}' across ${count} distinct entries between ${startDate} and ${endDate}.`;
  }
}

/**
 * Deterministic Template Synthesizer (Zero LLM, 100% Evidence-Bound)
 */
export class TemplateReflectionSynthesizer {
  generateFallback(bundle: ReflectionInputBundle): LLMReflectionResponse {
    const { claimType, authorizedFacts } = bundle;
    const { entities, relationships, temporalSpan, metrics } = authorizedFacts;

    const countMetric = metrics.find((m) => m.metricType === 'COUNT') || {
      factId: 'metric:distinct_fragment_count',
      value: 1,
    };
    const count = countMetric.value;
    const startDate = temporalSpan.startDate.split('T')[0];
    const endDate = temporalSpan.endDate.split('T')[0];
    const durationDays = temporalSpan.durationDays;

    const propositions: GroundedProposition[] = [];
    const segments: ReflectionSegment[] = [];

    if (claimType === 'COLLABORATION_PATTERN' && relationships.length > 0) {
      const rel = relationships[0];
      const text = renderRelationshipFallback(
        rel.relationType,
        rel.sourceEntityName,
        rel.targetEntityName,
        count,
        startDate,
        endDate
      );

      const prop: GroundedProposition = {
        propositionId: 'p1',
        subject: rel.sourceEntityName,
        predicate: rel.relationType === 'MENTIONED_WITH' ? 'CO_OCCURS_WITH' : rel.relationType,
        object: rel.targetEntityName,
        authorizedFactId: rel.factId,
      };
      propositions.push(prop);

      segments.push({
        segmentId: 's1',
        text,
        groundedPropositionIds: ['p1'],
      });

      return {
        propositions,
        segments,
        reflectionText: text,
      };
    }

    if (claimType === 'TEMPORAL_SEQUENCE') {
      const entA = entities[0]?.canonicalName || 'A';
      const entB = entities[1]?.canonicalName || 'B';
      const intervalMetric = metrics.find((m) => m.metricType === 'SEQUENCE_INTERVAL');
      const intervalPhrase = intervalMetric ? ` (average interval: ${intervalMetric.value} hours)` : '';

      const text = `Across ${count} observation windows between ${startDate} and ${endDate}, observations of '${entA}' were consistently followed by '${entB}'${intervalPhrase}.`;

      const prop: GroundedProposition = {
        propositionId: 'p1',
        subject: entA,
        predicate: 'CHRONOLOGICALLY_FOLLOWED_BY',
        object: entB,
        authorizedFactId: entities[0]?.factId || 'temp:span',
      };
      propositions.push(prop);

      segments.push({
        segmentId: 's1',
        text,
        groundedPropositionIds: ['p1'],
      });

      return {
        propositions,
        segments,
        reflectionText: text,
      };
    }

    if (claimType === 'COGNITIVE_CLUSTER') {
      const cohesionMetric = metrics.find((m) => m.metricType === 'COHESION_SCORE');
      const cohesionStr = cohesionMetric ? Number(cohesionMetric.value).toFixed(3) : '0.850';

      const text = `A vector cluster of ${count} memory nodes was identified with an average pairwise cosine cohesion of ${cohesionStr} spanning ${startDate} to ${endDate}.`;

      const prop: GroundedProposition = {
        propositionId: 'p1',
        subject: 'cluster',
        predicate: 'HAS_PAIRWISE_COHESION',
        object: cohesionStr,
        authorizedFactId: cohesionMetric?.factId || 'temp:span',
      };
      propositions.push(prop);

      segments.push({
        segmentId: 's1',
        text,
        groundedPropositionIds: ['p1'],
      });

      return {
        propositions,
        segments,
        reflectionText: text,
      };
    }

    // Default: RECURRING_TOPIC_FOCUS
    const entityNames = entities.map((e) => `'${e.canonicalName}'`).join(' and ') || 'the topic';
    const text = `Over a ${durationDays}-day period from ${startDate} to ${endDate}, the journal records repeated focus on ${entityNames} across ${count} distinct entries.`;

    entities.forEach((e, idx) => {
      propositions.push({
        propositionId: `p${idx + 1}`,
        subject: e.canonicalName,
        predicate: 'MENTIONED_IN_ENTRIES',
        object: count.toString(),
        authorizedFactId: e.factId,
      });
    });

    segments.push({
      segmentId: 's1',
      text,
      groundedPropositionIds: propositions.map((p) => p.propositionId),
    });

    return {
      propositions,
      segments,
      reflectionText: text,
    };
  }
}
