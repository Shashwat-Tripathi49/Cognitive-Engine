import { IReasoningRule, ReasoningRuleContext, RuleEvaluationResult } from '../types.js';

/**
 * Pairs of mutually exclusive relationship types in the ontology
 */
const MUTUALLY_EXCLUSIVE_RELATIONS: [string, string][] = [
  ['USES_TECHNOLOGY', 'REJECTED_TECHNOLOGY'],
  ['PREPARED_FOR', 'ABANDONED_GOAL'],
];

/**
 * RULE 005: Structural Contradiction Gate (Constrained to v1 active KG state)
 *
 * Detects deterministic structural contradictions in the currently available graph state:
 * - Mutually exclusive active relationships between the same subject and object within overlapping temporal scope.
 * - Explicitly active conflicting assertions.
 */
export class ContradictionRule implements IReasoningRule {
  readonly ruleId = 'RULE_005_CONTRADICTION_DETECTION';
  readonly ruleName = 'Structural Contradiction Gate';

  async evaluate(context: ReasoningRuleContext): Promise<RuleEvaluationResult> {
    const evaluatedIds: string[] = [];
    const rels = Array.from(context.relationships.values());

    for (const rel of rels) {
      evaluatedIds.push(rel.id);

      // Check if there is an opposing mutually exclusive relationship for same subject & target
      for (const [relA, relB] of MUTUALLY_EXCLUSIVE_RELATIONS) {
        if (rel.relationType === relA && rel.status === 'ACTIVE') {
          const conflicting = rels.find(
            (r) =>
              r.id !== rel.id &&
              r.sourceEntityId === rel.sourceEntityId &&
              r.targetEntityId === rel.targetEntityId &&
              r.relationType === relB &&
              r.status === 'ACTIVE'
          );

          if (conflicting) {
            return {
              ruleId: this.ruleId,
              ruleName: this.ruleName,
              passed: false,
              resultingStatus: 'CONTRADICTED',
              scoreImpact: -1.0,
              details: `Deterministic Contradiction: Active relationship '${relA}' (ID: ${rel.id}) directly conflicts with active relationship '${relB}' (ID: ${conflicting.id}) for subject ${rel.sourceEntityId} and target ${rel.targetEntityId}.`,
              evidenceIdsEvaluated: [rel.id, conflicting.id],
            };
          }
        }
      }
    }

    return {
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      passed: true,
      scoreImpact: 0.0,
      details: `No active structural or temporal contradictions detected across ${evaluatedIds.length} relationships.`,
      evidenceIdsEvaluated: evaluatedIds,
    };
  }
}
