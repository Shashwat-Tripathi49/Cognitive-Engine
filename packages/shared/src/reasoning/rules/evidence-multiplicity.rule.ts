import {
  FindingType,
  IReasoningRule,
  ReasoningRuleContext,
  RuleEvaluationResult,
} from '../types.js';

/**
 * Finding-Type specific independent fragment thresholds
 */
const MINIMUM_FRAGMENT_THRESHOLDS: Record<FindingType, number> = {
  SINGLE_EVENT_FACT: 1,
  RECURRING_TOPIC_FOCUS: 2,
  COLLABORATION_PATTERN: 2,
  TEMPORAL_SEQUENCE: 2,
  ARCHITECTURAL_DECISION: 1,
  COGNITIVE_CLUSTER: 3,
};

/**
 * RULE 002: Finding-Type Evidence Multiplicity Gate
 *
 * Enforces independent fragment thresholds based on finding type.
 * Multiple mentions within the same fragment are strictly counted as ONE independent observation.
 */
export class EvidenceMultiplicityRule implements IReasoningRule {
  readonly ruleId = 'RULE_002_EVIDENCE_MULTIPLICITY';
  readonly ruleName = 'Finding-Type Evidence Multiplicity Gate';

  async evaluate(context: ReasoningRuleContext): Promise<RuleEvaluationResult> {
    const findingType = context.finding.findingType;
    const minRequired = MINIMUM_FRAGMENT_THRESHOLDS[findingType] ?? 2;

    // Collect all distinct root fragment IDs supporting this finding
    const fragmentIds = new Set<string>();

    for (const ref of context.finding.provenanceReferences || []) {
      fragmentIds.add(ref.fragmentId);
    }

    for (const ev of context.evidence) {
      if (ev.evidenceType === 'COGNITIVE_FRAGMENT') {
        fragmentIds.add(ev.sourceId);
      }
    }

    const distinctCount = fragmentIds.size;
    const evaluatedIds = Array.from(fragmentIds);

    if (distinctCount < minRequired) {
      return {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        passed: false,
        resultingStatus: 'INSUFFICIENT_EVIDENCE',
        scoreImpact: -0.5,
        details: `Finding of type '${findingType}' requires at least ${minRequired} independent source fragments, but only ${distinctCount} distinct fragments were provided. (Note: multiple mentions in 1 fragment count as 1).`,
        evidenceIdsEvaluated: evaluatedIds,
      };
    }

    return {
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      passed: true,
      scoreImpact: 0.0,
      details: `Satisfied multiplicity requirement for '${findingType}': ${distinctCount} independent fragments provided (minimum required: ${minRequired}).`,
      evidenceIdsEvaluated: evaluatedIds,
    };
  }
}
