import {
  ILlmProviderAdapter,
  ReflectionProviderName,
  ReflectionRequest,
  ReflectionProviderError,
} from './types.js';

export interface GroqAdapterConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

export class GroqProviderAdapter implements ILlmProviderAdapter {
  readonly name: ReflectionProviderName = 'groq';
  private apiKey?: string;
  private model: string;
  private endpoint: string;

  constructor(config: GroqAdapterConfig = {}) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'llama-3.3-70b-versatile';
    this.endpoint = config.endpoint || 'https://api.groq.com/openai/v1/chat/completions';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey || process.env.GROQ_API_KEY);
  }

  async generate(request: ReflectionRequest, signal?: AbortSignal): Promise<string> {
    const key = this.apiKey || process.env.GROQ_API_KEY;
    if (!key) {
      throw new ReflectionProviderError(
        'GROQ_API_KEY is not configured',
        'AI_NOT_CONFIGURED'
      );
    }

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          temperature: request.temperature ?? 0.0,
          max_tokens: request.maxTokens,
          messages,
          response_format: { type: 'json_object' },
        }),
        signal,
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        throw new ReflectionProviderError(
          'Groq request timed out',
          'AI_TIMEOUT'
        );
      }
      throw err;
    }

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        throw new ReflectionProviderError(
          `Groq rate limit exceeded (HTTP ${status})`,
          'AI_QUOTA_EXCEEDED',
          status
        );
      }

      // Safe error extraction (sanitized, never reveals request auth headers)
      let errorSummary = `HTTP ${status}`;
      try {
        const errText = await response.text();
        const parsed = JSON.parse(errText);
        if (parsed?.error?.message && typeof parsed.error.message === 'string') {
          // Exclude any accidentally reflected credentials
          errorSummary = parsed.error.message.replace(/Bearer\s+[A-Za-z0-9_-]+/gi, 'Bearer [REDACTED]');
        }
      } catch {
        // Fallback to HTTP status text
      }

      throw new ReflectionProviderError(
        `Groq API failure: ${errorSummary}`,
        'AI_ALL_PROVIDERS_FAILED',
        status
      );
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawContent = json.choices?.[0]?.message?.content;
    if (!rawContent || !rawContent.trim()) {
      throw new ReflectionProviderError(
        'Empty response received from Groq API',
        'AI_ALL_PROVIDERS_FAILED'
      );
    }

    // Strip optional markdown code fences
    return rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }
}
