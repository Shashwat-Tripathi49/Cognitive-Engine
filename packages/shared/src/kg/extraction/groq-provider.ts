import {
  EntityExtractionProvider,
  StructuredExtractionResult,
} from './types.js';
import { ExtractionValidator } from './validator.js';
import { DeterministicMockExtractionProvider } from './mock-provider.js';

export const PROMPT_V1_EXHAUSTIVE = `You are an entity extraction system. Enumerate EVERY named entity mentioned in the following journal entry.

Entity types:
- Person: Any named individual (e.g., "Rahul", "Priya")
- Project: Any named project, product, or initiative (e.g., "Expense Tracker")
- Organization: Any company, university, or group
- Place: Any city, venue, or geographic location (e.g., "Bangalore", "Mumbai")
- Tool: Any software library, framework, or technology (e.g., "React", "Node.js", "PostgreSQL")
- Topic: Any subject area or field of study (e.g., "machine learning", "system design")
- Goal: Any explicit objective or milestone (e.g., "CAT 2026 Preparation")

Be thorough. Extract every entity mentioned.
Return a JSON object with key "entities": [{"name": "...", "type": "..."}].
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"`;

export interface GroqProviderConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  maxRetries?: number;
  temperature?: number;
}

/**
 * Production Groq / OpenAI-Compatible LLM Entity Extraction Provider
 */
export class GroqEntityExtractionProvider implements EntityExtractionProvider {
  readonly providerName = 'groq-extraction-provider';
  readonly modelName: string;

  private apiKey: string;
  private endpoint: string;
  private maxRetries: number;
  private temperature: number;
  private fallbackMock = new DeterministicMockExtractionProvider();

  constructor(config: GroqProviderConfig = {}) {
    this.apiKey =
      config.apiKey ||
      process.env.GROQ_API_KEY ||
      process.env.OPENAI_API_KEY ||
      '';
    this.modelName = config.model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    this.endpoint =
      config.endpoint || 'https://api.groq.com/openai/v1/chat/completions';
    this.maxRetries = config.maxRetries ?? 3;
    this.temperature = config.temperature ?? 0.0;
  }

  async extractEntities(
    text: string,
    context?: {
      fragmentId?: string;
      userId?: string;
      capturedAt?: Date;
    }
  ): Promise<StructuredExtractionResult> {
    const cleanText = (text || '').trim();
    if (!cleanText) {
      return {
        entities: [],
        metadata: {
          providerName: this.providerName,
          model: this.modelName,
          promptVersion: 'V1_Exhaustive',
          extractionRunId: `run_${Math.random().toString(36).substring(2, 9)}`,
          latencyMs: 0,
        },
      };
    }

    // Fallback to deterministic mock if no API key is provided
    if (!this.apiKey) {
      return this.fallbackMock.extractEntities(text, context);
    }

    const startTime = Date.now();
    const prompt = PROMPT_V1_EXHAUSTIVE.replace('{text}', cleanText);

    const payload = {
      model: this.modelName,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: this.temperature,
      max_tokens: 1024,
    };

    let lastError: Error | null = null;
    let delay = 1000;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'CognitiveEngine-Extraction/1.0',
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 429) {
          // Rate limited -> exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(
            `Groq API error HTTP ${response.status}: ${errBody}`
          );
        }

        const data = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
            completion_tokens_details?: { reasoning_tokens?: number };
          };
        };
        const latencyMs = Date.now() - startTime;
        const choice = data.choices?.[0];
        const content = choice?.message?.content || '{}';

        const validated = ExtractionValidator.validate(content, cleanText);

        const usage = data.usage || {};
        const reasoningTokens =
          usage.completion_tokens_details?.reasoning_tokens || 0;

        return {
          entities: validated,
          metadata: {
            providerName: this.providerName,
            model: this.modelName,
            promptVersion: 'V1_Exhaustive',
            extractionRunId: `groq_run_${Math.random().toString(36).substring(2, 9)}`,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            reasoningTokens,
            totalTokens: usage.total_tokens,
            latencyMs,
          },
          rawResponse: content,
        };
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    // On exhausted retries, fallback to deterministic mock rather than failing hard
    console.warn(
      `Groq API failed after ${this.maxRetries} retries (${lastError?.message}), falling back to deterministic mock.`
    );
    return this.fallbackMock.extractEntities(text, context);
  }
}
