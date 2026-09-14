import {
  ReflectionInputBundle,
  LLMReflectionResponse,
  ReflectionEngineConfig,
} from './types.js';
import { buildReflectionSystemPrompt, buildReflectionUserPrompt } from './prompt.js';
import { TemplateReflectionSynthesizer } from './fallback.js';
import { ReflectionValidator } from './validator.js';
import { DualProviderReflectionTransport, ReflectionProviderName } from './transport/index.js';

export interface SynthesisExecutionResult {
  response: LLMReflectionResponse;
  synthesisMethod: 'LLM_CONSTRAINED' | 'DETERMINISTIC_FALLBACK';
  modelInfo: Record<string, unknown>;
  attempts: number;
  withheldSegmentsCount?: number;
  withheldReason?: string;
}

export interface SynthesizerOutput {
  response: LLMReflectionResponse;
  providerUsed?: ReflectionProviderName | string;
  fellBack?: boolean;
  primaryFailureReason?: string;
}

export interface IReflectionSynthesizer {
  generate(bundle: ReflectionInputBundle, feedback?: string): Promise<LLMReflectionResponse>;
  generateWithMetadata?(bundle: ReflectionInputBundle, feedback?: string): Promise<SynthesizerOutput>;
}

/**
 * Production Dual-Provider Synthesizer (Groq primary, Gemini fallback)
 */
export class DualProviderReflectionSynthesizer implements IReflectionSynthesizer {
  constructor(
    private transport: DualProviderReflectionTransport = new DualProviderReflectionTransport(),
    private defaultModel: string = 'llama-3.3-70b-versatile',
    private temperature: number = 0.0
  ) {}

  getTransport(): DualProviderReflectionTransport {
    return this.transport;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async generateWithMetadata(
    bundle: ReflectionInputBundle,
    feedback?: string
  ): Promise<SynthesizerOutput> {
    const systemPrompt = buildReflectionSystemPrompt();
    let userPrompt = buildReflectionUserPrompt(bundle);
    if (feedback) {
      userPrompt += `\n\n[PREVIOUS ATTEMPT VALIDATION FAILED WITH ERROR: ${feedback}. Correct your output to strictly conform to all rules.]`;
    }

    const transportResult = await this.transport.generateReflection({
      systemPrompt,
      prompt: userPrompt,
      temperature: this.temperature,
    });

    const parsed = JSON.parse(transportResult.text) as LLMReflectionResponse;
    if (!parsed || !Array.isArray(parsed.propositions) || !Array.isArray(parsed.segments)) {
      throw new Error('LLM output missing propositions or segments array');
    }

    return {
      response: parsed,
      providerUsed: transportResult.providerUsed,
      fellBack: transportResult.fellBack,
      primaryFailureReason: transportResult.primaryFailureReason,
    };
  }

  async generate(bundle: ReflectionInputBundle, feedback?: string): Promise<LLMReflectionResponse> {
    const res = await this.generateWithMetadata(bundle, feedback);
    return res.response;
  }
}

/**
 * Production OpenRouter Synthesizer using meta-llama/llama-3.3-70b-instruct
 */
export class OpenRouterReflectionSynthesizer implements IReflectionSynthesizer {
  constructor(
    private apiKey?: string,
    private model: string = 'meta-llama/llama-3.3-70b-instruct',
    private temperature: number = 0.0
  ) {}

  async generate(bundle: ReflectionInputBundle, feedback?: string): Promise<LLMReflectionResponse> {
    const key =
      this.apiKey || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const systemPrompt = buildReflectionSystemPrompt();
    let userPrompt = buildReflectionUserPrompt(bundle);
    if (feedback) {
      userPrompt += `\n\n[PREVIOUS ATTEMPT VALIDATION FAILED WITH ERROR: ${feedback}. Correct your output to strictly conform to all rules.]`;
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Cognitive Engine',
      },
      body: JSON.stringify({
        model: this.model,
        temperature: this.temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API returned error ${res.status}: ${errText}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const rawContent = json.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty response from OpenRouter API');
    }

    // Strip optional markdown code fences if provider enclosed JSON
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed = JSON.parse(cleaned) as LLMReflectionResponse;
    return parsed;
  }
}

/**
 * Backwards-compatible Groq Synthesizer
 */
export class GroqReflectionSynthesizer implements IReflectionSynthesizer {
  constructor(
    private apiKey?: string,
    private model: string = 'llama-3.3-70b-versatile',
    private temperature: number = 0.0
  ) {}

  async generate(bundle: ReflectionInputBundle, feedback?: string): Promise<LLMReflectionResponse> {
    const key = this.apiKey || process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const systemPrompt = buildReflectionSystemPrompt();
    let userPrompt = buildReflectionUserPrompt(bundle);
    if (feedback) {
      userPrompt += `\n\n[PREVIOUS ATTEMPT VALIDATION FAILED WITH ERROR: ${feedback}. Correct your output to strictly conform to all rules.]`;
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        temperature: this.temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API returned error ${res.status}: ${errText}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const rawContent = json.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty response from Groq API');
    }

    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed = JSON.parse(cleaned) as LLMReflectionResponse;
    return parsed;
  }
}

/**
 * Mock Synthesizer for unit and hostile testing
 */
export class MockReflectionSynthesizer implements IReflectionSynthesizer {
  private generatorFn: (bundle: ReflectionInputBundle, feedback?: string) => Promise<LLMReflectionResponse>;

  constructor(
    generatorFn?: (bundle: ReflectionInputBundle, feedback?: string) => Promise<LLMReflectionResponse>
  ) {
    this.generatorFn =
      generatorFn ||
      (async (bundle) => {
        const fallback = new TemplateReflectionSynthesizer();
        return fallback.generateFallback(bundle);
      });
  }

  setGenerator(fn: (bundle: ReflectionInputBundle, feedback?: string) => Promise<LLMReflectionResponse>) {
    this.generatorFn = fn;
  }

  async generate(bundle: ReflectionInputBundle, feedback?: string): Promise<LLMReflectionResponse> {
    return this.generatorFn(bundle, feedback);
  }
}

/**
 * Orchestrates synthesis with Bounded Regeneration, Option A Partial Withholding,
 * and Deterministic Fallback
 */
export class ReflectionSynthesisCoordinator {
  private fallbackSynthesizer = new TemplateReflectionSynthesizer();

  constructor(
    private synthesizer: IReflectionSynthesizer,
    private validator: ReflectionValidator = new ReflectionValidator(),
    private config: ReflectionEngineConfig = {
      maxRegenerationAttempts: 1,
      llmTimeoutMs: 15000,
      temperature: 0.0,
      defaultModel: 'llama-3.3-70b-versatile',
      defaultProvider: 'groq',
    }
  ) {}

  async executeSynthesis(bundle: ReflectionInputBundle): Promise<SynthesisExecutionResult> {
    let attempts = 0;
    let lastError = '';

    let bestPartialCandidate: {
      response: LLMReflectionResponse;
      providerUsed?: string;
      fellBack?: boolean;
      primaryFailureReason?: string;
      withheldSegmentsCount: number;
      withheldReason: string;
    } | null = null;

    let lastProviderUsed = this.config.defaultProvider;
    let lastFellBack = false;
    let lastPrimaryFailureReason: string | undefined;

    // Primary attempt + max 1 bounded regeneration attempt
    while (attempts <= this.config.maxRegenerationAttempts) {
      attempts++;
      try {
        let candidate: LLMReflectionResponse;
        if (this.synthesizer.generateWithMetadata) {
          const metaRes = await this.synthesizer.generateWithMetadata(bundle, lastError || undefined);
          candidate = metaRes.response;
          lastProviderUsed = metaRes.providerUsed || this.config.defaultProvider;
          lastFellBack = metaRes.fellBack ?? false;
          lastPrimaryFailureReason = metaRes.primaryFailureReason;
        } else {
          candidate = await this.synthesizer.generate(bundle, lastError || undefined);
        }

        // Evaluate using Option A: Partial Withholding
        const withholdingResult = this.validator.validateWithPartialWithholding(bundle, candidate);

        if (withholdingResult.allSegmentsPassed && withholdingResult.validResponse) {
          // 100% of candidate output is grounded!
          return {
            response: withholdingResult.validResponse,
            synthesisMethod: 'LLM_CONSTRAINED',
            modelInfo: {
              model: this.config.defaultModel,
              provider: lastProviderUsed,
              fellBack: lastFellBack,
              primaryFailureReason: lastPrimaryFailureReason,
              temperature: this.config.temperature,
              withheldSegmentsCount: 0,
            },
            attempts,
            withheldSegmentsCount: 0,
          };
        }

        if (withholdingResult.validResponse && withholdingResult.validResponse.segments.length > 0) {
          // Some segments survived
          if (
            !bestPartialCandidate ||
            withholdingResult.validResponse.segments.length > bestPartialCandidate.response.segments.length
          ) {
            bestPartialCandidate = {
              response: withholdingResult.validResponse,
              providerUsed: lastProviderUsed,
              fellBack: lastFellBack,
              primaryFailureReason: lastPrimaryFailureReason,
              withheldSegmentsCount: withholdingResult.withheldSegmentsCount,
              withheldReason: withholdingResult.reasons.join('; '),
            };
          }
        }

        lastError = withholdingResult.reasons.join('; ') || 'Validation failed';
      } catch (err: unknown) {
        lastError = (err as Error).message || 'Generation error';
      }
    }

    // After bounded regeneration: if any partial candidate survived, return it! (Option A)
    if (bestPartialCandidate) {
      return {
        response: bestPartialCandidate.response,
        synthesisMethod: 'LLM_CONSTRAINED',
        modelInfo: {
          model: this.config.defaultModel,
          provider: bestPartialCandidate.providerUsed || lastProviderUsed,
          fellBack: bestPartialCandidate.fellBack ?? lastFellBack,
          primaryFailureReason: bestPartialCandidate.primaryFailureReason || lastPrimaryFailureReason,
          temperature: this.config.temperature,
          withheldSegmentsCount: bestPartialCandidate.withheldSegmentsCount,
          withheldReason: bestPartialCandidate.withheldReason,
        },
        attempts,
        withheldSegmentsCount: bestPartialCandidate.withheldSegmentsCount,
        withheldReason: bestPartialCandidate.withheldReason,
      };
    }

    // Option A rule: Only drop to deterministic fallback if ZERO segments survived across all attempts
    const fallbackResponse = this.fallbackSynthesizer.generateFallback(bundle);
    const fallbackVal = this.validator.validate(bundle, fallbackResponse);

    if (!fallbackVal.passed) {
      throw new Error(
        `Fatal invariant violation: Deterministic Fallback failed validation: ${fallbackVal.failureReason}`
      );
    }

    return {
      response: fallbackResponse,
      synthesisMethod: 'DETERMINISTIC_FALLBACK',
      modelInfo: {
        model: 'template_fallback_v1',
        provider: 'deterministic_engine',
        temperature: 0.0,
      },
      attempts,
    };
  }
}

