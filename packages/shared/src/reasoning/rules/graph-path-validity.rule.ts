import { IReasoningRule, ReasoningRuleContext, RuleEvaluationResult } from '../types.js';

/**
 * RULE 004: Graph Path Validity & MENTIONED_WITH Non-Semantic Boundary
 *
 * Verifies that referenced relationship assertions exist and are active.
 * Strictly enforces that MENTIONED_WITH represents co-occurrence, and CANNOT
 * be promoted to semantic collaboration, causality, or ownership without explicit typed evidence.
 */
export class GraphPathValidityRule implements IReasoningRule {
  readonly ruleId = 'RULE_004_GRAPH_PATH_VALIDITY';
  readonly ruleName = 'Graph Path Validity & MENTIONED_WITH Boundary Gate';

  async evaluate(context: ReasoningRuleContext): Promise<RuleEvaluationResult> {
    const evaluatedIds: string[] = [];
    const relationships: { id: string; sourceEntityId: string; targetEntityId: string; relationType: string; status?: string }[] = [];

    // 1. Check all referenced relationships exist and are active
    for (const relId of context.finding.involvedRelationshipIds || []) {
      evaluatedIds.push(relId);
      const rel = context.relationships.get(relId);
      if (!rel) {
        return {
          ruleId: this.ruleId,
          ruleName: this.ruleName,
          passed: false,
          resultingStatus: 'REJECTED',
          scoreImpact: -1.0,
          details: `Referenced graph relationship ${relId} does not exist in tenant graph.`,
          evidenceIdsEvaluated: evaluatedIds,
        };
      }
      if (rel.status !== 'ACTIVE') {
        return {
          ruleId: this.ruleId,
          ruleName: this.ruleName,
          passed: false,
          resultingStatus: 'REJECTED',
          scoreImpact: -1.0,
          details: `Referenced graph relationship ${relId} is revoked or inactive (status: ${rel.status}).`,
          evidenceIdsEvaluated: evaluatedIds,
        };
      }
      relationships.push(rel);
    }

    // 2. Boundary Check: COLLABORATION_PATTERN cannot rely solely on MENTIONED_WITH
    if (context.finding.findingType === 'COLLABORATION_PATTERN') {
      const hasSemanticEdge = relationships.some(
        (r) => r.relationType === 'COLLABORATED_WITH' || r.relationType === 'WORKED_ON'
      );

      if (relationships.length > 0 && !hasSemanticEdge) {
        return {
          ruleId: this.ruleId,
          ruleName: this.ruleName,
          passed: false,
          resultingStatus: 'REJECTED',
          scoreImpact: -1.0,
          details: `Boundary Violation: Finding claims COLLABORATION_PATTERN, but supporting graph edges are only 'MENTIONED_WITH' (co-occurrence). Co-occurrence cannot be promoted to semantic collaboration without explicit typed evidence.`,
          evidenceIdsEvaluated: evaluatedIds,
        };
      }
    }

    // 3. Boundary Check: Causal claims cannot rely solely on MENTIONED_WITH
    const statementLower = context.finding.statement.toLowerCase();
    const isCausalClaim =
      statementLower.includes('caused by') ||
      statementLower.includes('causes') ||
      statementLower.includes('caused ') ||
      statementLower.includes('responsible for');

    if (isCausalClaim) {
      const onlyCoOccurrence = relationships.every((r) => r.relationType === 'MENTIONED_WITH');
      if (onlyCoOccurrence) {
        return {
          ruleId: this.ruleId,
          ruleName: this.ruleName,
          passed: false,
          resultingStatus: 'REJECTED',
          scoreImpact: -1.0,
          details: `Boundary Violation: Finding asserts causality ('${context.finding.statement}'), but evidence relies solely on MENTIONED_WITH co-occurrence edges. Causality cannot be inferred from co-occurrence.`,
          evidenceIdsEvaluated: evaluatedIds,
        };
      }
    }

    return {
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      passed: true,
      scoreImpact: 0.0,
      details: `Graph path validity and non-semantic boundary checks passed across ${evaluatedIds.length} relationships.`,
      evidenceIdsEvaluated: evaluatedIds,
    };
  }
}
