import crypto from 'crypto';
import {
  CognitiveFragment,
  CaptureRequest,
  captureRequestSchema,
  CaptureValidationError,
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
   * Ingests a raw thought, normalizes content, validates inputs, and persists a Cognitive Fragment.
   */
  public async captureThought(rawInput: unknown): Promise<CognitiveFragment> {
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

    const fragment = await this.repository.create({
      userId: payload.userId,
      content: normalizedContent,
      modality: payload.modality,
      contentHash,
      metadata: payload.metadata,
      capturedAt: new Date(),
    });

    return fragment;
  }
}
