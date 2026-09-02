import { IReasoningRule, ReasoningRuleContext, RuleEvaluationResult } from '../types.js';

/**
 * RULE 003: Temporal Consistency & Chronology Gate
 *
 * Verifies that all supporting evidence falls within the declared finding window
 * and respects chronological ordering relative to the explicit evaluationTimestamp.
 *
 * ZERO wall-clock dependency: Future checks evaluate strictly relative to context.evaluationTimestamp.
 */
export class TemporalConsistencyRule implements IReasoningRule {
  readonly ruleId = 'RULE_003_TEMPORAL_CONSISTENCY';
  readonly ruleName = 'Temporal Consistency & Chronology Gate';

  // 1-hour clock-skew tolerance buffer
  private static readonly CLOCK_SKEW_TOLERANCE_MS = 3600 * 1000;

  async evaluate(context: ReasoningRuleContext): Promise<RuleEvaluationResult> {
    const { startDate, endDate } = context.finding.temporalScope;
    const evalTime = context.evaluationTimestamp.getTime();
    const evaluatedIds: string[] = [];

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      return {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        passed: false,
        resultingStatus: 'REJECTED',
        scoreImpact: -1.0,
        details: `Invalid temporal scope in finding: startDate or endDate is not a valid date.`,
        evidenceIdsEvaluated: evaluatedIds,
      };
    }

    if (startMs > endMs) {
      return {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        passed: false,
        resultingStatus: 'REJECTED',
        scoreImpact: -1.0,
        details: `Temporal scope inversion: startDate (${startDate.toISOString()}) is after endDate (${endDate.toISOString()}).`,
        evidenceIdsEvaluated: evaluatedIds,
      };
    }

    // 1. Check all root fragments against declared temporal window & evaluationTimestamp
    for (const rf of context.rootFragments) {
      evaluatedIds.push(rf.id);
      const fragMs = new Date(rf.capturedAt).getTime();

      if (isNaN(fragMs)) {
        return {
          ruleId: this.ruleId,
          ruleName: this.ruleName,
          passed: false,
          resultingStatus: 'REJECTED',
          scoreImpact: -1.0,
          details: `Source fragment ${rf.id} has invalid capturedAt date.`,
          evidenceIdsEvaluated: evaluatedIds,
        };
      }

      // Check future date relative to explicit evaluation timestamp
      if (fragMs > evalTime + TemporalConsistencyRule.CLOCK_SKEW_TOLERANCE_MS) {
        return {
          ruleId: this.ruleId,
          ruleName: this.ruleName,
          passed: false,
          resultingStatus: 'REJECTED',
          scoreImpact: -1.0,
          details: `Evidence fragment ${rf.id} is dated in the future (${new Date(rf.capturedAt).toISOString()}) relative to evaluation timestamp (${context.evaluationTimestamp.toISOString()}).`,
          evidenceIdsEvaluated: evaluatedIds,
        };
      }

      // Check window containment
      if (fragMs < startMs - TemporalConsistencyRule.CLOCK_SKEW_TOLERANCE_MS || fragMs > endMs + TemporalConsistencyRule.CLOCK_SKEW_TOLERANCE_MS) {
        return {
          ruleId: this.ruleId,
          ruleName: this.ruleName,
          passed: false,
          resultingStatus: 'REJECTED',
          scoreImpact: -1.0,
          details: `Evidence fragment ${rf.id} capturedAt (${new Date(rf.capturedAt).toISOString()}) falls outside declared scope [${startDate.toISOString()} - ${endDate.toISOString()}].`,
          evidenceIdsEvaluated: evaluatedIds,
        };
      }
    }

    // 2. If TEMPORAL_SEQUENCE, verify chronological succession of timestamps
    if (context.finding.findingType === 'TEMPORAL_SEQUENCE') {
      const timestamps = context.rootFragments
        .map((rf) => new Date(rf.capturedAt).getTime())
        .sort((a, b) => a - b);

      if (timestamps.length >= 2) {
        const first = timestamps[0];
        const last = timestamps[timestamps.length - 1];
        if (first === last) {
          return {
            ruleId: this.ruleId,
            ruleName: this.ruleName,
            passed: false,
            resultingStatus: 'REJECTED',
            scoreImpact: -0.8,
            details: `Temporal sequence claim requires distinct chronological timestamps, but all evidence occurred at the same instant.`,
            evidenceIdsEvaluated: evaluatedIds,
          };
        }
      }
    }

    return {
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      passed: true,
      scoreImpact: 0.0,
      details: `All ${evaluatedIds.length} evidence timestamps strictly fall within declared temporal window [${startDate.toISOString()} - ${endDate.toISOString()}] and satisfy chronology relative to ${context.evaluationTimestamp.toISOString()}.`,
      evidenceIdsEvaluated: evaluatedIds,
    };
  }
}
