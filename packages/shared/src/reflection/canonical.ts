import crypto from 'crypto';
import {
  ReflectionInputBundle,
  AuthorizedEntityFact,
  AuthorizedRelationshipFact,
  AuthorizedTemporalBoundsFact,
  AuthorizedMetricFact,
  UntrustedSnippetReference,
} from './types.js';
import { ValidatedClaim, EvidenceChain } from '../reasoning/types.js';

/**
 * Deterministically sorts object keys and array elements for reproducible SHA-256 hashing.
 */
export function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number') {
      // Float precision normalization to 4 decimal places if not integer
      if (!Number.isInteger(value)) {
        return Number(value.toFixed(4)).toString();
      }
      return value.toString();
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    // Canonicalize children first
    const serializedItems = value.map((item) => canonicalizeJson(item));
    return `[${serializedItems.join(',')}]`;
  }

  // Object sorting
  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const entries: string[] = [];

  for (const key of sortedKeys) {
    const val = obj[key];
    if (val !== undefined) {
      entries.push(`${JSON.stringify(key)}:${canonicalizeJson(val)}`);
    }
  }

  return `{${entries.join(',')}}`;
}

/**
 * Computes the SHA-256 integrity hash of a ReflectionInputBundle using canonicalization v1.0.0.
 */
export function computeBundleHash(bundle: ReflectionInputBundle): string {
  const canonicalBytes = canonicalizeJson(bundle);
  return crypto.createHash('sha256').update(canonicalBytes).digest('hex');
}

/**
 * Constructs a canonical ReflectionInputBundle from a ValidatedClaim and EvidenceChain.
 */
export function buildReflectionInputBundle(
  claim: ValidatedClaim,
  evidenceChain: EvidenceChain,
  untrustedSnippets: UntrustedSnippetReference[] = []
): ReflectionInputBundle {
  const durationMs =
    claim.temporalScope.endDate.getTime() - claim.temporalScope.startDate.getTime();
  const durationDays = Math.max(1, Math.round(durationMs / 86400000));

  const temporalSpan: AuthorizedTemporalBoundsFact = {
    factId: 'temp:span',
    startDate: claim.temporalScope.startDate.toISOString(),
    endDate: claim.temporalScope.endDate.toISOString(),
    durationDays,
  };

  // Build authorized entities
  const entityIds: string[] = [];
  if (claim.subjectEntityId) entityIds.push(claim.subjectEntityId);
  if (claim.objectEntityId && claim.objectEntityId !== claim.subjectEntityId) {
    entityIds.push(claim.objectEntityId);
  }

  // Extract canonical entity names from claim statement if available
  const statementMatches = Array.from(claim.statement.matchAll(/'([^']+)'/g)).map((m) => m[1]);
  const subjectName = statementMatches[0] || claim.subjectEntityId || 'entity';
  const objectName = statementMatches[1] || claim.objectEntityId || 'entity';

  const entities: AuthorizedEntityFact[] = entityIds.map((id, idx) => ({
    factId: `ent:${id}`,
    entityId: id,
    canonicalName: idx === 0 ? subjectName : objectName,
    entityType: 'ENTITY',
  }));

  // Build authorized relationships if both subject and object exist
  const relationships: AuthorizedRelationshipFact[] = [];
  if (claim.subjectEntityId && claim.objectEntityId && claim.claimType !== 'RECURRING_TOPIC_FOCUS') {
    let relationType: AuthorizedRelationshipFact['relationType'] = 'MENTIONED_WITH';
    if (claim.claimType === 'TEMPORAL_SEQUENCE') {
      relationType = 'CHRONOLOGICALLY_FOLLOWED_BY';
    } else if (claim.claimType === 'COLLABORATION_PATTERN') {
      relationType = 'WORKED_ON';
    }

    relationships.push({
      factId: `rel:${claim.subjectEntityId}-${claim.objectEntityId}`,
      sourceEntityId: claim.subjectEntityId,
      sourceEntityName: subjectName,
      targetEntityId: claim.objectEntityId,
      targetEntityName: objectName,
      relationType,
      status: 'ACTIVE',
    });
  }

  // Build metrics (strictly empirical facts — never internal engine/rule scores)
  const metrics: AuthorizedMetricFact[] = [
    {
      factId: 'metric:distinct_fragment_count',
      metricType: 'COUNT',
      value: evidenceChain.rootFragmentIds.length,
    },
  ];

  // Deterministically sort entities, relationships, metrics, snippets by factId / fragmentId
  entities.sort((a, b) => a.factId.localeCompare(b.factId));
  relationships.sort((a, b) => a.factId.localeCompare(b.factId));
  metrics.sort((a, b) => a.factId.localeCompare(b.factId));
  const sortedSnippets = [...untrustedSnippets].sort((a, b) =>
    a.fragmentId.localeCompare(b.fragmentId)
  );

  return {
    schemaVersion: '1.0.0',
    canonicalizationVersion: '1.0.0',
    claimId: claim.id,
    claimType: claim.claimType,
    claimStatement: claim.statement,
    evidenceChainId: evidenceChain.id,
    chainIntegrityHash: evidenceChain.chainIntegrityHash,
    authorizedFacts: {
      entities,
      relationships,
      temporalSpan,
      metrics,
    },
    untrustedSnippets: sortedSnippets,
  };
}
