import {
  ILlmProviderAdapter,
  ReflectionProviderName,
  ReflectionRequest,
  ReflectionProviderError,
} from './types.js';

export interface GeminiAdapterConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

export class GeminiProviderAdapter implements ILlmProviderAdapter {
  readonly name: ReflectionProviderName = 'gemini';
  private apiKey?: string;
  private model: string;
  private endpointBase: string;

  constructor(config: GeminiAdapterConfig = {}) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-1.5-flash';
    this.endpointBase =
      config.endpoint ||
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey || process.env.GEMINI_API_KEY);
  }

  async generate(request: ReflectionRequest, signal?: AbortSignal): Promise<string> {
    const key = this.apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new ReflectionProviderError(
        'GEMINI_API_KEY is not configured',
        'AI_NOT_CONFIGURED'
      );
    }

    const payload: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: request.prompt }],
        },
      ],
      generationConfig: {
        temperature: request.temperature ?? 0.0,
        responseMimeType: 'application/json',
      },
    };

    if (request.systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: request.systemPrompt }],
      };
    }

    let response: Response;
    try {
      response = await fetch(this.endpointBase, {
        method: 'POST',
        headers: {
          'x-goog-api-key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        throw new ReflectionProviderError(
          'Gemini request timed out',
          'AI_TIMEOUT'
        );
      }
      throw err;
    }

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        throw new ReflectionProviderError(
          `Gemini rate limit exceeded (HTTP ${status})`,
          'AI_QUOTA_EXCEEDED',
          status
        );
      }

      let errorSummary = `HTTP ${status}`;
      try {
        const errText = await response.text();
        const parsed = JSON.parse(errText);
        if (parsed?.error?.message && typeof parsed.error.message === 'string') {
          errorSummary = parsed.error.message.replace(/key=[A-Za-z0-9_-]+/gi, 'key=[REDACTED]');
        }
      } catch {
        // Fallback to HTTP status
      }

      throw new ReflectionProviderError(
        `Gemini API failure: ${errorSummary}`,
        'AI_ALL_PROVIDERS_FAILED',
        status
      );
    }

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent || !rawContent.trim()) {
      throw new ReflectionProviderError(
        'Empty response received from Gemini API',
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
