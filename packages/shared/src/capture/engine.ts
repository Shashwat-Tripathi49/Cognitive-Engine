import crypto from 'crypto';
import {
  CognitiveFragment,
  CaptureRequest,
  captureRequestSchema,
  CaptureValidationError,
  CaptureMetadata,
} from './types.js';
import {
  ICognitiveFragmentRepository,
  DrizzleCognitiveFragmentRepository,
} from './repository.js';

export class CaptureEngine {
  constructor(
    private readonly repository: ICognitiveFragmentRepository = new DrizzleCognitiveFragmentRepository()
  ) {}

  /**
   * Deterministically normalizes whitespace in raw user text.
   * - Strips leading & trailing whitespace
   * - Standardizes line breaks (\r\n -> \n)
   * - Condenses 3+ consecutive newlines to maximum 2 newlines
   * - Replaces tabs/multiple spaces per line with a single space
   */
  public normalizeContent(rawText: string): string {
    if (!rawText) {
      return '';
    }

    return rawText
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Calculates a SHA-256 cryptographic hash of normalized content.
   */
  public calculateContentHash(normalizedContent: string): string {
    return crypto
      .createHash('sha256')
      .update(normalizedContent, 'utf8')
      .digest('hex');
  }

  /**
   * Ingests a raw thought for an authenticated user.
   *
   * CONTENT HASH POLICY:
   * 1. Primary Purpose: Integrity fingerprint for downstream Memory/Graph engines.
   * 2. Idempotency Window: Exact same content captured by the same user within 10s is
   *    de-duplicated to protect against network retry storms.
   * 3. Distinct Time Captures: Identical text captured across different days/hours remains
   *    a valid distinct temporal event.
   */
  public async captureThought(
    userId: string,
    rawInput: unknown
  ): Promise<CognitiveFragment> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new CaptureValidationError('Authentication required: Missing userId context');
    }

    const parseResult = captureRequestSchema.safeParse(rawInput);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new CaptureValidationError(
        issue?.message || 'Invalid capture payload',
        parseResult.error.flatten().fieldErrors
      );
    }

    const payload: CaptureRequest = parseResult.data;
    const normalizedContent = this.normalizeContent(payload.text);

    if (!normalizedContent) {
      throw new CaptureValidationError(
        'Capture text cannot be empty or whitespace-only'
      );
    }

    const contentHash = this.calculateContentHash(normalizedContent);

    // 10-second Idempotency Protection Window
    const recentDuplicate = await this.repository.findRecentByHash(
      userId,
      contentHash,
      10
    );

    if (recentDuplicate) {
      return recentDuplicate;
    }

    const metadata: CaptureMetadata = {
      schemaVersion: payload.metadata?.schemaVersion ?? 1,
      source: payload.metadata?.source ?? 'api',
      ...(payload.metadata?.clientTimezone
        ? { clientTimezone: payload.metadata.clientTimezone }
        : {}),
      ...(payload.metadata?.clientPlatform
        ? { clientPlatform: payload.metadata.clientPlatform }
        : {}),
    };

    const fragment = await this.repository.create({
      userId,
      content: normalizedContent,
      modality: payload.modality,
      contentHash,
      metadata,
      capturedAt: new Date(),
    });

    return fragment;
  }
}
