import { IReasoningRule, ReasoningRuleContext, RuleEvaluationResult } from '../types.js';

/**
 * Target saturation thresholds by finding type
 */
const TARGET_SATURATION_THRESHOLDS: Record<string, number> = {
  SINGLE_EVENT_FACT: 1,
  ARCHITECTURAL_DECISION: 1,
  RECURRING_TOPIC_FOCUS: 4,
  COLLABORATION_PATTERN: 3,
  TEMPORAL_SEQUENCE: 3,
  COGNITIVE_CLUSTER: 4,
};

/**
 * RULE 006: Deterministic Support Score Evaluator
 *
 * Computes a transparent, reproducible support score from countable evidence attributes.
 *
 * Formula:
 *   S = [ w_disc * C_disc + w_frag * min(1.0, N_frag / N_target) + w_cov * (N_verified / N_total) ] * (1.0 - P_penalty)
 *
 * Operating Threshold:
 *   tau = 0.60 (Initial deterministic operating threshold for v1)
 */
export class SupportScoreRule implements IReasoningRule {
  readonly ruleId = 'RULE_006_SUPPORT_SCORE';
  readonly ruleName = 'Deterministic Support Score Evaluator';

  // Component weights summing to 1.0
  readonly wDisc = 0.30;
  readonly wFrag = 0.40;
  readonly wCov = 0.30;

  // Initial deterministic operating threshold for v1
  readonly threshold = 0.60;

  async evaluate(context: ReasoningRuleContext): Promise<RuleEvaluationResult> {
    const finding = context.finding;
    const evaluatedIds = context.evidence.map((e) => e.id);

    // 1. Discovery algorithm confidence baseline
    const cDisc = Math.max(0.0, Math.min(1.0, finding.discoveryConfidence || 0.0));

    // 2. Fragment multiplicity saturation
    const distinctFragIds = new Set<string>();
    for (const ref of finding.provenanceReferences || []) {
      distinctFragIds.add(ref.fragmentId);
    }
    for (const ev of context.evidence) {
      if (ev.evidenceType === 'COGNITIVE_FRAGMENT') {
        distinctFragIds.add(ev.sourceId);
      }
    }

    const nFrag = distinctFragIds.size;
    const nTarget = TARGET_SATURATION_THRESHOLDS[finding.findingType] ?? 4;
    const fragMultiplicityRatio = Math.min(1.0, nFrag / nTarget);

    // 3. Evidence coverage ratio
    const nTotal = context.evidence.length;
    const nVerified = context.evidence.filter((e) => e.verified).length;
    const coverageRatio = nTotal > 0 ? nVerified / nTotal : 1.0;

    // 4. Penalty factor
    const pPenalty = 0.0;

    // 5. Compute raw support score
    const rawScore =
      (this.wDisc * cDisc + this.wFrag * fragMultiplicityRatio + this.wCov * coverageRatio) *
      (1.0 - pPenalty);

    // Round to 4 decimal places for exact float determinism
    const supportScore = Math.round(Math.min(1.0, Math.max(0.0, rawScore)) * 10000) / 10000;

    const details =
      `SupportScore: ${supportScore.toFixed(4)} (Threshold: ${this.threshold.toFixed(2)}) | ` +
      `Formula: [0.30 * ${cDisc.toFixed(2)} (disc) + 0.40 * ${fragMultiplicityRatio.toFixed(2)} (frag: ${nFrag}/${nTarget}) + 0.30 * ${coverageRatio.toFixed(2)} (cov: ${nVerified}/${nTotal})] * (1.0 - ${pPenalty.toFixed(2)})`;

    if (supportScore < this.threshold) {
      return {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        passed: false,
        resultingStatus: 'INSUFFICIENT_EVIDENCE',
        scoreImpact: supportScore,
        details: `Support score ${supportScore.toFixed(4)} fell below initial operating threshold ${this.threshold.toFixed(2)}. ${details}`,
        evidenceIdsEvaluated: evaluatedIds,
      };
    }

    return {
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      passed: true,
      scoreImpact: supportScore,
      details: `Support score ${supportScore.toFixed(4)} met initial operating threshold ${this.threshold.toFixed(2)}. ${details}`,
      evidenceIdsEvaluated: evaluatedIds,
    };
  }
}
