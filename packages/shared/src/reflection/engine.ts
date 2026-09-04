import crypto from 'crypto';
import { ValidatedClaim, EvidenceChain } from '../reasoning/types.js';
import { IReasoningRepository, DrizzleReasoningRepository } from '../reasoning/repository.js';
import {
  ReflectionRecord,
  ReflectionType,
  ReflectionEngineConfig,
} from './types.js';
import { buildReflectionInputBundle, computeBundleHash } from './canonical.js';
import {
  IReflectionSynthesizer,
  OpenRouterReflectionSynthesizer,
  ReflectionSynthesisCoordinator,
} from './synthesizer.js';
import { ReflectionValidator } from './validator.js';
import {
  IReflectionRepository,
  DrizzleReflectionRepository,
  ListReflectionsOptions,
} from './repository.js';

export interface GenerateReflectionRequest {
  userId: string;
  claimId: string;
  customSnippets?: { fragmentId: string; capturedAt: string; text: string }[];
}

export interface ReflectionProvenanceResult {
  reflection: ReflectionRecord;
  claim: ValidatedClaim;
  evidenceChain: EvidenceChain;
}

export class ReflectionEngine {
  readonly version = '1.0.0';
  private coordinator: ReflectionSynthesisCoordinator;

  constructor(
    private repository: IReflectionRepository = new DrizzleReflectionRepository(),
    private reasoningRepository: IReasoningRepository = new DrizzleReasoningRepository(),
    customSynthesizer?: IReflectionSynthesizer,
    validator: ReflectionValidator = new ReflectionValidator(),
    config?: ReflectionEngineConfig
  ) {
    const synth = customSynthesizer || new OpenRouterReflectionSynthesizer();
    this.coordinator = new ReflectionSynthesisCoordinator(synth, validator, config);
  }

  /**
   * Generates a grounded reflection for a validated claim.
   */
  async generateReflection(request: GenerateReflectionRequest): Promise<ReflectionRecord> {
    const { userId, claimId, customSnippets = [] } = request;

    // 1. Retrieve ValidatedClaim
    const claim = await this.reasoningRepository.findClaimById(claimId, userId);
    if (!claim) {
      throw new Error(`ValidatedClaim '${claimId}' not found for user '${userId}'`);
    }

    // 2. Gate 0: Assert claim status is VALIDATED (Fail-closed)
    if (claim.status !== 'VALIDATED') {
      throw new Error(
        `Invalid claim status '${claim.status}'. Reflection Engine only consumes claims with status 'VALIDATED'.`
      );
    }

    // Multi-tenant check
    if (claim.userId !== userId) {
      throw new Error(`Multi-tenant isolation violation: claim does not belong to user '${userId}'`);
    }

    // 3. Retrieve EvidenceChain
    const evidenceChain = await this.reasoningRepository.findChainById(
      claim.evidenceChainId,
      userId
    );
    if (!evidenceChain) {
      throw new Error(
        `EvidenceChain '${claim.evidenceChainId}' not found for claim '${claimId}'`
      );
    }

    if (evidenceChain.userId !== userId) {
      throw new Error(`Multi-tenant isolation violation: chain does not belong to user '${userId}'`);
    }

    // Assert chain has not been tampered
    if (!evidenceChain.chainIntegrityHash) {
      throw new Error(`EvidenceChain '${evidenceChain.id}' is missing chainIntegrityHash`);
    }

    // 4. Build canonical ReflectionInputBundle and compute bundle hash
    const bundle = buildReflectionInputBundle(claim, evidenceChain, customSnippets);
    const bundleIntegrityHash = computeBundleHash(bundle);

    // 5. Determine Reflection Type from claimType
    let reflectionType: ReflectionType;
    switch (claim.claimType) {
      case 'TEMPORAL_SEQUENCE':
        reflectionType = 'TEMPORAL_SEQUENCE_REFLECTION';
        break;
      case 'COLLABORATION_PATTERN':
        reflectionType = 'COLLABORATION_REFLECTION';
        break;
      case 'COGNITIVE_CLUSTER':
        reflectionType = 'COGNITIVE_CLUSTER_REFLECTION';
        break;
      case 'RECURRING_TOPIC_FOCUS':
      default:
        reflectionType = 'TOPIC_FOCUS_REFLECTION';
        break;
    }

    // 6. Execute Synthesis (with Bounded Regeneration & Deterministic Fallback)
    const synthesisResult = await this.coordinator.executeSynthesis(bundle);
    const { response, synthesisMethod, modelInfo } = synthesisResult;

    // 7. Assemble immutable ReflectionRecord
    const record: ReflectionRecord = {
      id: crypto.randomUUID(),
      userId,
      sourceClaimId: claim.id,
      evidenceChainId: evidenceChain.id,
      reflectionType,
      text: response.reflectionText,
      structuredPropositions: response.propositions,
      groundedSegments: response.segments,
      chainIntegrityHash: evidenceChain.chainIntegrityHash,
      bundleIntegrityHash,
      canonicalizationVersion: bundle.canonicalizationVersion,
      synthesisMethod,
      engineVersion: this.version,
      promptVersion: 'v1.0.0',
      modelInfo,
      validationDetails: {
        propositionsCount: response.propositions.length,
        segmentsCount: response.segments.length,
        attempts: synthesisResult.attempts,
      },
      temporalScope: {
        startDate: claim.temporalScope.startDate,
        endDate: claim.temporalScope.endDate,
      },
      createdAt: new Date(),
    };

    // 8. Persist and return
    await this.repository.saveReflection(record);
    return record;
  }

  /**
   * Retrieves a reflection by ID with multi-tenant isolation
   */
  async getReflection(id: string, userId: string): Promise<ReflectionRecord | null> {
    return this.repository.getReflection(id, userId);
  }

  /**
   * Lists reflections for a user
   */
  async listReflections(
    userId: string,
    options?: ListReflectionsOptions
  ): Promise<ReflectionRecord[]> {
    return this.repository.listReflections(userId, options);
  }

  /**
   * Retrieves full cryptographic provenance audit bundle for a reflection
   */
  async getProvenance(id: string, userId: string): Promise<ReflectionProvenanceResult | null> {
    const reflection = await this.repository.getReflection(id, userId);
    if (!reflection) return null;

    const claim = await this.reasoningRepository.findClaimById(reflection.sourceClaimId, userId);
    if (!claim) return null;

    const evidenceChain = await this.reasoningRepository.findChainById(
      reflection.evidenceChainId,
      userId
    );
    if (!evidenceChain) return null;

    return {
      reflection,
      claim,
      evidenceChain,
    };
  }
}
