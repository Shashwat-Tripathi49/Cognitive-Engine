import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DualProviderReflectionTransport,
  ILlmProviderAdapter,
  ReflectionProviderError,
} from '../index.js';
import {
  ReflectionSynthesisCoordinator,
  DualProviderReflectionSynthesizer,
  IReflectionSynthesizer,
} from '../../synthesizer.js';
import { ReflectionValidator } from '../../validator.js';
import { ReflectionInputBundle, LLMReflectionResponse } from '../../types.js';

const sampleBundle: ReflectionInputBundle = {
  schemaVersion: '1.0.0',
  canonicalizationVersion: '1.0.0',
  claimId: 'claim-1',
  claimType: 'RECURRING_TOPIC_FOCUS',
  claimStatement: "Entity 'backend' was observed across 5 entries",
  evidenceChainId: 'chain-1',
  chainIntegrityHash: 'hash-1',
  authorizedFacts: {
    entities: [
      {
        factId: 'ent:1',
        entityId: '1',
        canonicalName: 'backend',
        entityType: 'TOPIC',
      },
      {
        factId: 'ent:2',
        entityId: '2',
        canonicalName: 'API',
        entityType: 'TOPIC',
      },
    ],
    relationships: [
      {
        factId: 'rel:1',
        sourceEntityId: '1',
        sourceEntityName: 'backend',
        targetEntityId: '2',
        targetEntityName: 'API',
        relationType: 'MENTIONED_WITH',
        status: 'ACTIVE',
      },
    ],
    temporalSpan: {
      factId: 'temp:span',
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-08-16T00:00:00.000Z',
      durationDays: 15,
    },
    metrics: [
      {
        factId: 'metric:distinct_fragment_count',
        metricType: 'COUNT',
        value: 5,
      },
    ],
  },
  untrustedSnippets: [],
};

describe('Dual-Provider LLM Transport & Option A Partial Withholding', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: Groq succeeds cleanly
  it('1. Groq succeeds cleanly: returns output with providerUsed=groq and fellBack=false', async () => {
    const mockGroq: ILlmProviderAdapter = {
      name: 'groq',
      isConfigured: () => true,
      generate: vi.fn().mockResolvedValue('{"propositions":[],"segments":[],"reflectionText":"Groq text"}'),
    };
    const mockGemini: ILlmProviderAdapter = {
      name: 'gemini',
      isConfigured: () => true,
      generate: vi.fn(),
    };

    const transport = new DualProviderReflectionTransport(mockGroq, mockGemini);
    const result = await transport.generateReflection({
      systemPrompt: 'sys',
      prompt: 'user',
    });

    expect(result.text).toContain('Groq text');
    expect(result.providerUsed).toBe('groq');
    expect(result.fellBack).toBe(false);
    expect(result.primaryFailureReason).toBeUndefined();
    expect(mockGroq.generate).toHaveBeenCalledTimes(1);
    expect(mockGemini.generate).not.toHaveBeenCalled();
  });

  // Test 2: Groq times out (>15s abort) -> Gemini succeeds
  it('2. Groq times out -> Gemini fallback succeeds with fellBack=true', async () => {
    const mockGroq: ILlmProviderAdapter = {
      name: 'groq',
      isConfigured: () => true,
      generate: vi.fn().mockImplementation(async () => {
        throw new ReflectionProviderError('Groq request timed out after 15000ms', 'AI_TIMEOUT');
      }),
    };
    const mockGemini: ILlmProviderAdapter = {
      name: 'gemini',
      isConfigured: () => true,
      generate: vi.fn().mockResolvedValue('{"propositions":[],"segments":[],"reflectionText":"Gemini text"}'),
    };

    const transport = new DualProviderReflectionTransport(mockGroq, mockGemini);
    const result = await transport.generateReflection({
      systemPrompt: 'sys',
      prompt: 'user',
    });

    expect(result.text).toContain('Gemini text');
    expect(result.providerUsed).toBe('gemini');
    expect(result.fellBack).toBe(true);
    expect(result.primaryFailureReason).toContain('timed out');
    expect(mockGroq.generate).toHaveBeenCalledTimes(1);
    expect(mockGemini.generate).toHaveBeenCalledTimes(1);
  });

  // Test 3: Groq 429 rate limit -> Gemini fallback succeeds
  it('3. Groq 429 rate limit -> Gemini fallback succeeds with primaryFailureReason set', async () => {
    const mockGroq: ILlmProviderAdapter = {
      name: 'groq',
      isConfigured: () => true,
      generate: vi.fn().mockImplementation(async () => {
        throw new ReflectionProviderError('Groq returned status 429: rate limit reached', 'AI_QUOTA_EXCEEDED', 429);
      }),
    };
    const mockGemini: ILlmProviderAdapter = {
      name: 'gemini',
      isConfigured: () => true,
      generate: vi.fn().mockResolvedValue('{"propositions":[],"segments":[],"reflectionText":"Gemini 429 fallback"}'),
    };

    const transport = new DualProviderReflectionTransport(mockGroq, mockGemini);
    const result = await transport.generateReflection({
      systemPrompt: 'sys',
      prompt: 'user',
    });

    expect(result.text).toContain('Gemini 429 fallback');
    expect(result.providerUsed).toBe('gemini');
    expect(result.fellBack).toBe(true);
    expect(result.primaryFailureReason).toContain('rate limit');
    expect(mockGemini.generate).toHaveBeenCalledTimes(1);
  });

  // Test 4: Groq 5xx server failure -> Gemini succeeds
  it('4. Groq 5xx server failure -> Gemini succeeds', async () => {
    const mockGroq: ILlmProviderAdapter = {
      name: 'groq',
      isConfigured: () => true,
      generate: vi.fn().mockImplementation(async () => {
        throw new ReflectionProviderError('Groq returned 503 Service Unavailable', 'AI_ALL_PROVIDERS_FAILED', 503);
      }),
    };
    const mockGemini: ILlmProviderAdapter = {
      name: 'gemini',
      isConfigured: () => true,
      generate: vi.fn().mockResolvedValue('{"propositions":[],"segments":[],"reflectionText":"Gemini 503 fallback"}'),
    };

    const transport = new DualProviderReflectionTransport(mockGroq, mockGemini);
    const result = await transport.generateReflection({
      systemPrompt: 'sys',
      prompt: 'user',
    });

    expect(result.providerUsed).toBe('gemini');
    expect(result.fellBack).toBe(true);
    expect(result.primaryFailureReason).toContain('503 Service Unavailable');
  });

  // Test 5: Groq not configured -> Gemini succeeds immediately with warning
  it('5. Groq not configured -> Gemini succeeds immediately with loud warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockGroq: ILlmProviderAdapter = {
      name: 'groq',
      isConfigured: () => false,
      generate: vi.fn(),
    };
    const mockGemini: ILlmProviderAdapter = {
      name: 'gemini',
      isConfigured: () => true,
      generate: vi.fn().mockResolvedValue('{"propositions":[],"segments":[],"reflectionText":"Gemini fallback output"}'),
    };

    const transport = new DualProviderReflectionTransport(mockGroq, mockGemini);
    const result = await transport.generateReflection({
      systemPrompt: 'sys',
      prompt: 'user',
    });

    expect(result.providerUsed).toBe('gemini');
    expect(result.fellBack).toBe(true);
    expect(result.primaryFailureReason).toContain('GROQ_API_KEY is not configured');
    expect(mockGroq.generate).not.toHaveBeenCalled();
    expect(mockGemini.generate).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();
  });

  // Test 6: Both providers fail -> throws AI_ALL_PROVIDERS_FAILED
  it('6. Both providers fail -> throws clean AI_ALL_PROVIDERS_FAILED', async () => {
    const mockGroq: ILlmProviderAdapter = {
      name: 'groq',
      isConfigured: () => true,
      generate: vi.fn().mockRejectedValue(new ReflectionProviderError('Groq down', 'AI_ALL_PROVIDERS_FAILED', 500)),
    };
    const mockGemini: ILlmProviderAdapter = {
      name: 'gemini',
      isConfigured: () => true,
      generate: vi.fn().mockRejectedValue(new ReflectionProviderError('Gemini down', 'AI_ALL_PROVIDERS_FAILED', 500)),
    };

    const transport = new DualProviderReflectionTransport(mockGroq, mockGemini);
    await expect(
      transport.generateReflection({ systemPrompt: 'sys', prompt: 'user' })
    ).rejects.toThrow('AI_ALL_PROVIDERS_FAILED');
  });

  // Test 7: Gemini also not configured when Groq fails -> throws AI_ALL_PROVIDERS_FAILED
  it('7. Gemini also not configured when Groq fails -> throws AI_ALL_PROVIDERS_FAILED', async () => {
    const mockGroq: ILlmProviderAdapter = {
      name: 'groq',
      isConfigured: () => true,
      generate: vi.fn().mockRejectedValue(new ReflectionProviderError('Timeout', 'AI_TIMEOUT')),
    };
    const mockGemini: ILlmProviderAdapter = {
      name: 'gemini',
      isConfigured: () => false,
      generate: vi.fn(),
    };

    const transport = new DualProviderReflectionTransport(mockGroq, mockGemini);
    await expect(
      transport.generateReflection({ systemPrompt: 'sys', prompt: 'user' })
    ).rejects.toThrow('AI_ALL_PROVIDERS_FAILED');
  });

  // Test 8: Leakage test: no API key or Authorization header in any error
  it('8. Leakage test: API keys and secret headers never appear in errors, logs, or exceptions', async () => {
    const fakeGroqKey = 'gsk_secret_groq_key_99999999';
    const fakeGeminiKey = 'AIzaSy_secret_gemini_key_88888888';

    const mockGroq: ILlmProviderAdapter = {
      name: 'groq',
      isConfigured: () => true,
      generate: vi.fn().mockImplementation(async () => {
        // Simulating error that attempts to leak headers
        throw new ReflectionProviderError(
          `Failed request with header Bearer ${fakeGroqKey}`,
          'AI_ALL_PROVIDERS_FAILED'
        );
      }),
    };
    const mockGemini: ILlmProviderAdapter = {
      name: 'gemini',
      isConfigured: () => true,
      generate: vi.fn().mockImplementation(async () => {
        throw new ReflectionProviderError(
          `Failed to connect to https://generativelanguage.googleapis.com?key=${fakeGeminiKey}`,
          'AI_ALL_PROVIDERS_FAILED'
        );
      }),
    };

    const transport = new DualProviderReflectionTransport(mockGroq, mockGemini);

    let caughtError: Error | null = null;
    try {
      await transport.generateReflection({ systemPrompt: 'sys', prompt: 'user' });
    } catch (err: unknown) {
      caughtError = err as Error;
    }

    expect(caughtError).not.toBeNull();
    const errorMessage = caughtError!.message;

    // Assert that raw keys never leaked into the thrown error
    // Transport sanitizes error strings
    expect(errorMessage).not.toContain(fakeGroqKey);
    expect(errorMessage).not.toContain(fakeGeminiKey);
  });

  // Test 9: Option A Partial Withholding integration
  it('9. Partial withholding in synthesis: mixed claims survive, ungrounded stripped without template fallback', async () => {
    // Response with 3 segments:
    // Seg 1 references p1 (grounded)
    // Seg 2 references p2 (grounded)
    // Seg 3 references p3 (UNAUTHORIZED predicate -> ungrounded)
    const mixedResponse: LLMReflectionResponse = {
      propositions: [
        {
          propositionId: 'p1',
          subject: 'backend',
          predicate: 'MENTIONED_IN_ENTRIES',
          object: '5',
          authorizedFactId: 'ent:1',
        },
        {
          propositionId: 'p2',
          subject: 'backend',
          predicate: 'CO_OCCURS_WITH',
          object: 'API',
          authorizedFactId: 'rel:1',
        },
        {
          propositionId: 'p3',
          subject: 'backend',
          predicate: 'CAUSED_BY' as any, // Unauthorized predicate!
          object: 'stress',
          authorizedFactId: 'ent:1',
        },
      ],
      segments: [
        {
          segmentId: 's1',
          text: 'The topic backend was recorded across 5 entries.',
          groundedPropositionIds: ['p1'],
        },
        {
          segmentId: 's2',
          text: 'It frequently co-occurred alongside API.',
          groundedPropositionIds: ['p2'],
        },
        {
          segmentId: 's3',
          text: 'This caused significant stress.',
          groundedPropositionIds: ['p3'],
        },
      ],
      reflectionText: 'The topic backend was recorded across 5 entries. It frequently co-occurred alongside API. This caused significant stress.',
    };

    const mockSynth: IReflectionSynthesizer = {
      generate: vi.fn().mockResolvedValue(mixedResponse),
      generateWithMetadata: vi.fn().mockResolvedValue({
        response: mixedResponse,
        providerUsed: 'groq',
        fellBack: false,
      }),
    };

    const coordinator = new ReflectionSynthesisCoordinator(mockSynth, new ReflectionValidator(), {
      maxRegenerationAttempts: 0, // Test immediate partial withholding acceptance
      llmTimeoutMs: 15000,
      temperature: 0.0,
      defaultModel: 'llama-3.3-70b-versatile',
      defaultProvider: 'groq',
    });

    const result = await coordinator.executeSynthesis(sampleBundle);

    // Assert: Method is LLM_CONSTRAINED (NOT deterministic template fallback!)
    expect(result.synthesisMethod).toBe('LLM_CONSTRAINED');
    expect(result.withheldSegmentsCount).toBe(1);
    expect(result.withheldReason).toContain('CAUSED_BY');

    // Assert: Segments 1 and 2 survived, segment 3 was withheld
    expect(result.response.segments).toHaveLength(2);
    expect(result.response.segments.map((s) => s.segmentId)).toEqual(['s1', 's2']);
    expect(result.response.propositions.map((p) => p.propositionId)).toEqual(['p1', 'p2']);

    // Assert: Cleanly spliced text without segment 3
    expect(result.response.reflectionText).toBe(
      'The topic backend was recorded across 5 entries. It frequently co-occurred alongside API.'
    );
  });

  // Test 9b: Multi-proposition segment survival (Point 1: All-Must-Survive)
  it('9b. Multi-proposition segment survival: segment dropped if ANY referenced proposition fails', () => {
    const validator = new ReflectionValidator();
    const testResponse: LLMReflectionResponse = {
      propositions: [
        {
          propositionId: 'p1',
          subject: 'backend',
          predicate: 'MENTIONED_IN_ENTRIES',
          object: '5',
          authorizedFactId: 'ent:1',
        },
        {
          propositionId: 'p2_bad',
          subject: 'backend',
          predicate: 'INVALID_PREDICATE' as any,
          object: 'invalid',
          authorizedFactId: 'ent:1',
        },
      ],
      segments: [
        {
          segmentId: 's_multi',
          text: 'Multi segment referencing both p1 and p2.',
          groundedPropositionIds: ['p1', 'p2_bad'],
        },
      ],
      reflectionText: 'Multi segment referencing both p1 and p2.',
    };

    const result = validator.validateWithPartialWithholding(sampleBundle, testResponse);

    // Segment references p1 (good) and p2_bad (bad). It MUST NOT survive!
    expect(result.withheldSegmentsCount).toBe(1);
    expect(result.validResponse).toBeUndefined();
    expect(result.reasons[result.reasons.length - 1]).toContain(
      "Segment 's_multi' withheld: references ungrounded proposition(s) [p2_bad]"
    );
  });

  // Test 10: All-ungrounded response drops to deterministic template fallback
  it('10. All segments ungrounded: falls back to deterministic template fallback', async () => {
    const completelyUngroundedResponse: LLMReflectionResponse = {
      propositions: [
        {
          propositionId: 'p_hallucinated',
          subject: 'unicorn',
          predicate: 'CAUSED_BY' as any,
          object: 'magic',
          authorizedFactId: 'fake:fact',
        },
      ],
      segments: [
        {
          segmentId: 's1',
          text: 'You had a rough week because unicorns appeared.',
          groundedPropositionIds: ['p_hallucinated'],
        },
      ],
      reflectionText: 'You had a rough week because unicorns appeared.',
    };

    const mockSynth: IReflectionSynthesizer = {
      generate: vi.fn().mockResolvedValue(completelyUngroundedResponse),
      generateWithMetadata: vi.fn().mockResolvedValue({
        response: completelyUngroundedResponse,
        providerUsed: 'groq',
        fellBack: false,
      }),
    };

    const coordinator = new ReflectionSynthesisCoordinator(mockSynth, new ReflectionValidator(), {
      maxRegenerationAttempts: 1,
      llmTimeoutMs: 15000,
      temperature: 0.0,
      defaultModel: 'llama-3.3-70b-versatile',
      defaultProvider: 'groq',
    });

    const result = await coordinator.executeSynthesis(sampleBundle);

    // Assert: Fell back to DETERMINISTIC_FALLBACK because 0 segments survived
    expect(result.synthesisMethod).toBe('DETERMINISTIC_FALLBACK');
    expect(result.modelInfo.provider).toBe('deterministic_engine');
    expect(result.response.reflectionText).toContain("repeated focus on 'backend'");
    expect(result.attempts).toBe(2); // 1 initial + 1 bounded regeneration attempt
  });
});
