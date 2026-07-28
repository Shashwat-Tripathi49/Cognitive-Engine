import { describe, it, expect, beforeEach } from 'vitest';
import { CaptureEngine } from '../engine.js';
import {
  CognitiveFragment,
  CreateCognitiveFragmentInput,
  CaptureValidationError,
} from '../types.js';
import { ICognitiveFragmentRepository } from '../repository.js';

class InMemoryCognitiveFragmentRepository implements ICognitiveFragmentRepository {
  private fragments = new Map<string, CognitiveFragment>();

  async create(input: CreateCognitiveFragmentInput): Promise<CognitiveFragment> {
    const fragment: CognitiveFragment = {
      id: input.id || `frag_${Math.random().toString(36).substring(2, 10)}`,
      userId: input.userId,
      content: input.content,
      modality: input.modality || 'text',
      contentHash: input.contentHash,
      capturedAt: input.capturedAt || new Date(),
      metadata: input.metadata || {},
    };
    this.fragments.set(fragment.id, fragment);
    return fragment;
  }

  async findById(id: string): Promise<CognitiveFragment | null> {
    return this.fragments.get(id) || null;
  }
}

describe('CaptureEngine', () => {
  let repository: InMemoryCognitiveFragmentRepository;
  let engine: CaptureEngine;

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

    it('should collapse multiple spaces within lines', () => {
      const input = 'Word1    Word2\t\tWord3';
      expect(engine.normalizeContent(input)).toBe('Word1 Word2 Word3');
    });
  });

  describe('Content Hashing', () => {
    it('should calculate identical SHA-256 hashes for identical normalized text', () => {
      const text = 'I met Rahul today to discuss the Expense Tracker roadmap.';
      const hash1 = engine.calculateContentHash(text);
      const hash2 = engine.calculateContentHash(text);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('Thought Capture Execution', () => {
    it('should successfully capture and persist a valid thought', async () => {
      const rawText = '   I met Rahul today to discuss the Expense Tracker roadmap.   ';
      const fragment = await engine.captureThought({ text: rawText });

      expect(fragment.id).toBeDefined();
      expect(fragment.content).toBe('I met Rahul today to discuss the Expense Tracker roadmap.');
      expect(fragment.modality).toBe('text');
      expect(fragment.contentHash).toHaveLength(64);
      expect(fragment.capturedAt).toBeInstanceOf(Date);

      const retrieved = await repository.findById(fragment.id);
      expect(retrieved).toEqual(fragment);
    });

    it('should throw CaptureValidationError for empty string', async () => {
      await expect(engine.captureThought({ text: '' })).rejects.toThrow(
        CaptureValidationError
      );
    });

    it('should throw CaptureValidationError for whitespace-only text', async () => {
      await expect(engine.captureThought({ text: '   \n\t   ' })).rejects.toThrow(
        CaptureValidationError
      );
    });

    it('should throw CaptureValidationError for invalid payload type', async () => {
      await expect(engine.captureThought({ text: 12345 })).rejects.toThrow(
        CaptureValidationError
      );
    });
  });
});
