import * as crypto from 'crypto';
import {
  EvidenceChain,
  EvidenceObject,
  ValidatedClaim,
  ClaimStatus,
  IReasoningRule,
  ReasoningRuleContext,
  RuleEvaluationResult,
  EvaluateFindingRequest,
  EvaluateFindingResponse,
} from './types.js';
import {
  EvidenceRetrievalService,
  DrizzleEvidenceStorageAdapter,
} from './retrieval.js';
import {
  IReasoningRepository,
  DrizzleReasoningRepository,
} from './repository.js';
import {
  SourceIntegrityRule,
  EvidenceMultiplicityRule,
  TemporalConsistencyRule,
  GraphPathValidityRule,
  ContradictionRule,
  SupportScoreRule,
} from './rules/index.js';

export class ReasoningEngine {
  readonly version = '1.0.0';
  private rules: IReasoningRule[];

  constructor(
    private repository: IReasoningRepository = new DrizzleReasoningRepository(),
    private retrievalService: EvidenceRetrievalService = new EvidenceRetrievalService(new DrizzleEvidenceStorageAdapter()),
    customRules?: IReasoningRule[]
  ) {
    this.rules = customRules || [
      new SourceIntegrityRule(),
      new EvidenceMultiplicityRule(),
      new TemporalConsistencyRule(),
      new GraphPathValidityRule(),
      new ContradictionRule(),
      new SupportScoreRule(),
    ];
  }

  /**
   * Evaluates a candidate finding deterministically without LLM intervention
   */
  async evaluateFinding(request: EvaluateFindingRequest): Promise<EvaluateFindingResponse> {
    const startTime = Date.now();
    const { userId, finding } = request;

    // Explicit evaluation reference timestamp (Zero wall-clock dependence for replay)
    const evaluationTimestamp = request.evaluationTimestamp || new Date();

    // 1. Retrieve evidence
    const bundle = await this.retrievalService.retrieveEvidence(finding, userId);

    // 2. Construct context for rules
    const context: ReasoningRuleContext = {
      userId,
      finding,
      evidence: bundle.evidenceObjects,
      rootFragments: bundle.rootFragments,
      entities: bundle.entities,
      relationships: bundle.relationships,
      memories: bundle.memories,
      evaluationTimestamp,
    };

    // 3. Execute deterministic rule waterfall
    const ruleEvaluations: RuleEvaluationResult[] = [];
    const appliedRuleIds: string[] = [];
    const passedRuleIds: string[] = [];
    const failedRuleIds: string[] = [];
    let finalStatus: ClaimStatus = 'VALIDATED';
    let rejectionReason: string | undefined = undefined;
    let computedSupportScore = 0.0;

    for (const rule of this.rules) {
      appliedRuleIds.push(rule.ruleId);
      const evalResult = await rule.evaluate(context);
      ruleEvaluations.push(evalResult);

      if (evalResult.passed) {
        passedRuleIds.push(rule.ruleId);
        if (rule.ruleId === 'RULE_006_SUPPORT_SCORE') {
          computedSupportScore = evalResult.scoreImpact;
        }
      } else {
        failedRuleIds.push(rule.ruleId);
        if (!rejectionReason) {
          rejectionReason = evalResult.details;
        }
        // Set most severe status (REJECTED > CONTRADICTED > INSUFFICIENT_EVIDENCE)
        if (evalResult.resultingStatus === 'REJECTED') {
          finalStatus = 'REJECTED';
        } else if (evalResult.resultingStatus === 'CONTRADICTED' && finalStatus !== 'REJECTED') {
          finalStatus = 'CONTRADICTED';
        } else if (evalResult.resultingStatus === 'INSUFFICIENT_EVIDENCE' && finalStatus === 'VALIDATED') {
          finalStatus = 'INSUFFICIENT_EVIDENCE';
        }
      }
    }

    // 4. Compute canonical Evidence Chain Hash
    const chainIntegrityHash = ReasoningEngine.computeChainIntegrityHash(bundle.evidenceObjects);

    // 5. Build EvidenceChain
    const chainId = crypto.randomUUID();
    const evidenceChain: EvidenceChain = {
      id: chainId,
      userId,
      findingId: finding.id,
      evidenceObjects: bundle.evidenceObjects,
      rootFragmentIds: bundle.rootFragments.map((f) => f.id),
      ruleEvaluations,
      isVerified: finalStatus === 'VALIDATED',
      verificationTimestamp: evaluationTimestamp,
      chainIntegrityHash,
      createdAt: evaluationTimestamp,
    };

    // 6. Build ValidatedClaim
    const claimId = crypto.randomUUID();
    const claim: ValidatedClaim = {
      id: claimId,
      userId,
      sourceFindingId: finding.id,
      evidenceChainId: chainId,
      claimType: finding.findingType,
      status: finalStatus,
      subjectEntityId: finding.subjectEntityId,
      objectEntityId: finding.objectEntityId,
      statement: finding.statement,
      deterministicSupportScore: computedSupportScore,
      appliedRuleIds,
      passedRuleIds,
      failedRuleIds,
      rejectionReason,
      temporalScope: finding.temporalScope,
      reasoningEngineVersion: this.version,
      createdAt: evaluationTimestamp,
      updatedAt: evaluationTimestamp,
    };

    // 7. Persist to repository
    await this.repository.saveClaim(claim, evidenceChain);

    return {
      success: true,
      claim,
      evidenceChain,
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Computes a canonical, deterministic SHA-256 hash across sorted evidence objects.
   *
   * Independent of DB insertion order, array order, and retrieval order.
   */
  static computeChainIntegrityHash(evidenceObjects: EvidenceObject[]): string {
    const canonicalTuples = evidenceObjects.map((ev) => ({
      evidenceType: ev.evidenceType,
      sourceId: ev.sourceId,
      sourceContentHash: ev.sourceContentHash || '',
      sourceTimestamp: ev.sourceTimestamp ? new Date(ev.sourceTimestamp).toISOString() : '',
      validFrom: ev.validFrom ? new Date(ev.validFrom).toISOString() : '',
      validTo: ev.validTo ? new Date(ev.validTo).toISOString() : '',
    }));

    // Sort lexicographically by evidenceType then sourceId
    canonicalTuples.sort((a, b) => {
      const keyA = `${a.evidenceType}:${a.sourceId}:${a.sourceContentHash}`;
      const keyB = `${b.evidenceType}:${b.sourceId}:${b.sourceContentHash}`;
      return keyA.localeCompare(keyB);
    });

    const canonicalJson = JSON.stringify(canonicalTuples);
    return crypto.createHash('sha256').update(canonicalJson, 'utf-8').digest('hex');
  }

  // Convenience query methods
  async getClaim(id: string, userId: string): Promise<ValidatedClaim | null> {
    return this.repository.findClaimById(id, userId);
  }

  async listClaims(userId: string, options?: Parameters<IReasoningRepository['listClaims']>[1]) {
    return this.repository.listClaims(userId, options);
  }

  async getEvidenceChain(id: string, userId: string): Promise<EvidenceChain | null> {
    return this.repository.findChainById(id, userId);
  }
}
