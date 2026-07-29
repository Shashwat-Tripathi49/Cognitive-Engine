import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaptureEngine } from '../engine.js';
import {
  CognitiveFragment,
  CreateCognitiveFragmentInput,
  CaptureValidationError,
  CaptureQueryOptions,
  PaginatedResult,
} from '../types.js';
import { ICognitiveFragmentRepository } from '../repository.js';

class InMemoryCognitiveFragmentRepository
  implements ICognitiveFragmentRepository
{
  private fragments = new Map<string, CognitiveFragment>();

  async create(input: CreateCognitiveFragmentInput): Promise<CognitiveFragment> {
    const fragment: CognitiveFragment = {
      id: input.id || `frag_${Math.random().toString(36).substring(2, 10)}`,
      userId: input.userId,
      content: input.content,
      modality: input.modality || 'text',
      contentHash: input.contentHash,
      capturedAt: input.capturedAt || new Date(),
      metadata: input.metadata || { schemaVersion: 1, source: 'api' },
    };
    this.fragments.set(fragment.id, fragment);
    return fragment;
  }

  async findById(id: string, userId: string): Promise<CognitiveFragment | null> {
    const found = this.fragments.get(id);
    if (!found || found.userId !== userId) {
      return null;
    }
    return found;
  }

  async findRecentByHash(
    userId: string,
    contentHash: string,
    windowSeconds = 10
  ): Promise<CognitiveFragment | null> {
    const cutoff = Date.now() - windowSeconds * 1000;
    const matches = Array.from(this.fragments.values()).filter(
      (f) =>
        f.userId === userId &&
        f.contentHash === contentHash &&
        f.capturedAt.getTime() >= cutoff
    );

    return matches.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())[0] || null;
  }

  async findAll(
    userId: string,
    options: CaptureQueryOptions = {}
  ): Promise<PaginatedResult<CognitiveFragment>> {
    const page = options.page || 1;
    const limit = options.limit || 20;

    let items = Array.from(this.fragments.values()).filter(
      (f) => f.userId === userId
    );

    if (options.modality) {
      items = items.filter((f) => f.modality === options.modality);
    }

    items.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

describe('CaptureEngine (Sprint 1C-A Multi-Tenant & ContentHash Policy)', () => {
  let repository: InMemoryCognitiveFragmentRepository;
  let engine: CaptureEngine;
  const testUserId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    repository = new InMemoryCognitiveFragmentRepository();
    engine = new CaptureEngine(repository);
  });

  describe('Whitespace Normalization', () => {
    it('should trim leading and trailing whitespace', () => {
      const input = '   Hello world   ';
      expect(engine.normalizeContent(input)).toBe('Hello world');
    });

    it('should standardize CRLF to LF line breaks', () => {
      const input = 'Line 1\r\nLine 2';
      expect(engine.normalizeContent(input)).toBe('Line 1\nLine 2');
    });

    it('should collapse 3 or more consecutive newlines to maximum 2 newlines', () => {
      const input = 'Paragraph 1\n\n\n\nParagraph 2';
      expect(engine.normalizeContent(input)).toBe('Paragraph 1\n\nParagraph 2');
    });
  });

  describe('Authentication & User Ownership Enforcement', () => {
    it('should require valid userId context', async () => {
      await expect(
        engine.captureThought('', { text: 'Valid text' })
      ).rejects.toThrow(CaptureValidationError);
    });

    it('should bind created fragment strictly to authenticated userId', async () => {
      const fragment = await engine.captureThought(testUserId, {
        text: 'User specific journal entry',
      });
      expect(fragment.userId).toBe(testUserId);
    });
  });

  describe('Typed CaptureMetadata Validation', () => {
    it('should attach default schemaVersion 1 and source api when unprovided', async () => {
      const fragment = await engine.captureThought(testUserId, {
        text: 'Metadata test',
      });

      expect(fragment.metadata.schemaVersion).toBe(1);
      expect(fragment.metadata.source).toBe('api');
    });

    it('should accept custom source, timezone, and platform', async () => {
      const fragment = await engine.captureThought(testUserId, {
        text: 'Mobile capture test',
        metadata: {
          schemaVersion: 1,
          source: 'mobile',
          clientTimezone: 'Asia/Kolkata',
          clientPlatform: 'iOS 18.2',
        },
      });

      expect(fragment.metadata.source).toBe('mobile');
      expect(fragment.metadata.clientTimezone).toBe('Asia/Kolkata');
      expect(fragment.metadata.clientPlatform).toBe('iOS 18.2');
    });
  });

  describe('ContentHash Policy & Idempotency', () => {
    it('should deduplicate rapid retry requests within 10 seconds', async () => {
      const rawText = 'Network retry storm test entry';

      const frag1 = await engine.captureThought(testUserId, { text: rawText });
      const frag2 = await engine.captureThought(testUserId, { text: rawText });

      expect(frag1.id).toBe(frag2.id);
      expect(frag1.contentHash).toBe(frag2.contentHash);
    });

    it('should create separate fragments for different users capturing identical text', async () => {
      const otherUser = '22222222-2222-2222-2222-222222222222';
      const rawText = 'Shared thought text';

      const fragUserA = await engine.captureThought(testUserId, { text: rawText });
      const fragUserB = await engine.captureThought(otherUser, { text: rawText });

      expect(fragUserA.id).not.toBe(fragUserB.id);
      expect(fragUserA.userId).toBe(testUserId);
      expect(fragUserB.userId).toBe(otherUser);
      expect(fragUserA.contentHash).toBe(fragUserB.contentHash);
    });

    it('should create separate fragments when identical text is captured outside the idempotency window', async () => {
      const rawText = 'Daily recurring journal thought';

      const frag1 = await engine.captureThought(testUserId, { text: rawText });

      // Mock time advancing by 60 seconds
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.now() + 60000));

      const frag2 = await engine.captureThought(testUserId, { text: rawText });

      vi.useRealTimers();

      expect(frag1.id).not.toBe(frag2.id);
      expect(frag1.contentHash).toBe(frag2.contentHash);
    });
  });
});
