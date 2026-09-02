import { IReasoningRule, ReasoningRuleContext, RuleEvaluationResult } from '../types.js';

/**
 * RULE 001: Source Integrity & Tenant Isolation
 *
 * Hard Gate: Verifies 100% of referenced entities, relationships, memories, and fragments
 * exist in tenant storage, belong to the authenticated user, and match immutable source hashes.
 */
export class SourceIntegrityRule implements IReasoningRule {
  readonly ruleId = 'RULE_001_SOURCE_INTEGRITY';
  readonly ruleName = 'Source Integrity & Tenant Isolation Gate';

  async evaluate(context: ReasoningRuleContext): Promise<RuleEvaluationResult> {
    const evaluatedIds: string[] = [];

    // 1. Verify all provenance references in finding match retrieved root fragments
    for (const prov of context.finding.provenanceReferences || []) {
      evaluatedIds.push(prov.fragmentId);
      const root = context.rootFragments.find((rf) => rf.id === prov.fragmentId);
      if (!root) {
        return {
          ruleId: this.ruleId,
          ruleName: this.ruleName,
          passed: false,
          resultingStatus: 'REJECTED',
          scoreImpact: -1.0,
          details: `Referenced source fragment ${prov.fragmentId} does not exist or does not belong to tenant.`,
          evidenceIdsEvaluated: evaluatedIds,
        };
      }

      if (root.contentHash !== prov.contentHash) {
        return {
          ruleId: this.ruleId,
          ruleName: this.ruleName,
          passed: false,
          resultingStatus: 'REJECTED',
          scoreImpact: -1.0,
          details: `Source content hash mismatch for fragment ${prov.fragmentId}. Expected ${prov.contentHash}, found ${root.contentHash}.`,
          evidenceIdsEvaluated: evaluatedIds,
        };
      }
    }

    // 2. Type-specific evidence object verification
    for (const ev of context.evidence) {
      evaluatedIds.push(ev.sourceId);

      if (ev.userId !== context.userId) {
        return {
          ruleId: this.ruleId,
          ruleName: this.ruleName,
          passed: false,
          resultingStatus: 'REJECTED',
          scoreImpact: -1.0,
          details: `Cross-tenant evidence detected: evidence ${ev.id} does not belong to user ${context.userId}.`,
          evidenceIdsEvaluated: evaluatedIds,
        };
      }

      switch (ev.evidenceType) {
        case 'COGNITIVE_FRAGMENT': {
          const root = context.rootFragments.find((rf) => rf.id === ev.sourceId);
          if (!root) {
            return {
              ruleId: this.ruleId,
              ruleName: this.ruleName,
              passed: false,
              resultingStatus: 'REJECTED',
              scoreImpact: -1.0,
              details: `Dangling cognitive fragment reference ${ev.sourceId}.`,
              evidenceIdsEvaluated: evaluatedIds,
            };
          }
          if (ev.sourceContentHash && root.contentHash !== ev.sourceContentHash) {
            return {
              ruleId: this.ruleId,
              ruleName: this.ruleName,
              passed: false,
              resultingStatus: 'REJECTED',
              scoreImpact: -1.0,
              details: `Content hash verification failed on fragment evidence ${ev.sourceId}.`,
              evidenceIdsEvaluated: evaluatedIds,
            };
          }
          break;
        }

        case 'CANONICAL_ENTITY': {
          const ent = context.entities.get(ev.sourceId);
          if (!ent) {
            return {
              ruleId: this.ruleId,
              ruleName: this.ruleName,
              passed: false,
              resultingStatus: 'REJECTED',
              scoreImpact: -1.0,
              details: `Referenced canonical entity ${ev.sourceId} not found in tenant graph.`,
              evidenceIdsEvaluated: evaluatedIds,
            };
          }
          if (ent.status && ent.status !== 'ACTIVE') {
            return {
              ruleId: this.ruleId,
              ruleName: this.ruleName,
              passed: false,
              resultingStatus: 'REJECTED',
              scoreImpact: -1.0,
              details: `Referenced canonical entity ${ev.sourceId} is not ACTIVE (status: ${ent.status}).`,
              evidenceIdsEvaluated: evaluatedIds,
            };
          }
          break;
        }

        case 'RELATIONSHIP_ASSERTION': {
          const rel = context.relationships.get(ev.sourceId);
          if (!rel) {
            return {
              ruleId: this.ruleId,
              ruleName: this.ruleName,
              passed: false,
              resultingStatus: 'REJECTED',
              scoreImpact: -1.0,
              details: `Referenced graph relationship ${ev.sourceId} not found in tenant graph.`,
              evidenceIdsEvaluated: evaluatedIds,
            };
          }
          if (rel.status && rel.status !== 'ACTIVE') {
            return {
              ruleId: this.ruleId,
              ruleName: this.ruleName,
              passed: false,
              resultingStatus: 'REJECTED',
              scoreImpact: -1.0,
              details: `Referenced graph relationship ${ev.sourceId} is not ACTIVE (status: ${rel.status}).`,
              evidenceIdsEvaluated: evaluatedIds,
            };
          }
          break;
        }

        case 'MEMORY_NODE': {
          const mem = context.memories.get(ev.sourceId);
          if (!mem) {
            return {
              ruleId: this.ruleId,
              ruleName: this.ruleName,
              passed: false,
              resultingStatus: 'REJECTED',
              scoreImpact: -1.0,
              details: `Referenced memory node ${ev.sourceId} not found in tenant memory store.`,
              evidenceIdsEvaluated: evaluatedIds,
            };
          }
          break;
        }

        case 'TEMPORAL_OBSERVATION': {
          if (!ev.sourceTimestamp && !ev.validFrom) {
            return {
              ruleId: this.ruleId,
              ruleName: this.ruleName,
              passed: false,
              resultingStatus: 'REJECTED',
              scoreImpact: -1.0,
              details: `Temporal observation evidence ${ev.id} lacks valid timestamp.`,
              evidenceIdsEvaluated: evaluatedIds,
            };
          }
          break;
        }
      }
    }

    return {
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      passed: true,
      scoreImpact: 0.0,
      details: `All ${evaluatedIds.length} referenced evidence items passed source integrity and tenant isolation checks.`,
      evidenceIdsEvaluated: evaluatedIds,
    };
  }
}
