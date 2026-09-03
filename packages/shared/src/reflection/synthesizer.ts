import {
  ReflectionInputBundle,
  LLMReflectionResponse,
  ReflectionEngineConfig,
} from './types.js';
import { buildReflectionSystemPrompt, buildReflectionUserPrompt } from './prompt.js';
import { TemplateReflectionSynthesizer } from './fallback.js';
import { ReflectionValidator } from './validator.js';

export interface SynthesisExecutionResult {
  response: LLMReflectionResponse;
  synthesisMethod: 'LLM_CONSTRAINED' | 'DETERMINISTIC_FALLBACK';
  modelInfo: Record<string, unknown>;
  attempts: number;
}

export interface IReflectionSynthesizer {
  generate(bundle: ReflectionInputBundle, feedback?: string): Promise<LLMReflectionResponse>;
}

/**
 * Production Groq Synthesizer using llama-3.3-70b-versatile
 */
export class GroqReflectionSynthesizer implements IReflectionSynthesizer {
  constructor(
    private apiKey?: string,
    private model: string = 'llama-3.3-70b-versatile',
    private temperature: number = 0.0
  ) {}

  async generate(bundle: ReflectionInputBundle, feedback?: string): Promise<LLMReflectionResponse> {
    const key = this.apiKey || process.env.GROQ_API_KEY;
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
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq API');
    }

    const parsed = JSON.parse(content) as LLMReflectionResponse;
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
 * Orchestrates synthesis with Bounded Regeneration and Deterministic Fallback
 */
export class ReflectionSynthesisCoordinator {
  private fallbackSynthesizer = new TemplateReflectionSynthesizer();

  constructor(
    private synthesizer: IReflectionSynthesizer,
    private validator: ReflectionValidator = new ReflectionValidator(),
    private config: ReflectionEngineConfig = {
      maxRegenerationAttempts: 1,
      llmTimeoutMs: 5000,
      temperature: 0.0,
      defaultModel: 'llama-3.3-70b-versatile',
      defaultProvider: 'groq',
    }
  ) {}

  async executeSynthesis(bundle: ReflectionInputBundle): Promise<SynthesisExecutionResult> {
    let attempts = 0;
    let lastError = '';

    // Primary attempt + max 1 bounded regeneration
    while (attempts <= this.config.maxRegenerationAttempts) {
      attempts++;
      try {
        const candidate = await this.synthesizer.generate(bundle, lastError || undefined);
        const valResult = this.validator.validate(bundle, candidate);

        if (valResult.passed) {
          return {
            response: candidate,
            synthesisMethod: 'LLM_CONSTRAINED',
            modelInfo: {
              model: this.config.defaultModel,
              provider: this.config.defaultProvider,
              temperature: this.config.temperature,
            },
            attempts,
          };
        }

        lastError = valResult.failureReason || 'Validation failed';
      } catch (err: unknown) {
        lastError = (err as Error).message || 'Generation error';
      }
    }

    // Fallback: Activate Deterministic Fallback Generator
    // Completely independent of rejected LLM prose
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
