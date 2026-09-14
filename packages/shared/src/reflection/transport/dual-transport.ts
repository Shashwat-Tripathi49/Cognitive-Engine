import {
  ILlmProviderAdapter,
  ReflectionRequest,
  ReflectionResult,
  ReflectionProviderError,
} from './types.js';
import { GroqProviderAdapter } from './groq-adapter.js';
import { GeminiProviderAdapter } from './gemini-adapter.js';

export interface DualTransportConfig {
  primaryAdapter?: ILlmProviderAdapter;
  fallbackAdapter?: ILlmProviderAdapter;
  timeoutMs?: number;
  onWarning?: (message: string) => void;
}

function sanitizeError(msg: string): string {
  return msg
    .replace(/Bearer\s+[A-Za-z0-9_\-]+/gi, 'Bearer [REDACTED]')
    .replace(/key=[A-Za-z0-9_\-]+/gi, 'key=[REDACTED]')
    .replace(/x-goog-api-key:\s*[A-Za-z0-9_\-]+/gi, 'x-goog-api-key: [REDACTED]')
    .replace(/gsk_[A-Za-z0-9_]+/gi, '[REDACTED_GROQ_KEY]')
    .replace(/AIzaSy[A-Za-z0-9_\-]+/gi, '[REDACTED_GEMINI_KEY]');
}

export class DualProviderReflectionTransport {
  private primary: ILlmProviderAdapter;
  private fallback: ILlmProviderAdapter;
  private timeoutMs: number;
  private onWarning: (message: string) => void;
  private static warnedMissingPrimary = false;

  constructor(
    configOrPrimary?: DualTransportConfig | ILlmProviderAdapter,
    fallbackAdapter?: ILlmProviderAdapter,
    timeoutMs?: number
  ) {
    if (configOrPrimary && 'isConfigured' in configOrPrimary) {
      this.primary = configOrPrimary;
      this.fallback = fallbackAdapter || new GeminiProviderAdapter();
      this.timeoutMs = timeoutMs ?? 15_000;
      this.onWarning = (msg) => console.warn(`[REFLECTION TRANSPORT WARNING] ${msg}`);
    } else {
      const config = (configOrPrimary as DualTransportConfig) || {};
      this.primary = config.primaryAdapter || new GroqProviderAdapter();
      this.fallback = config.fallbackAdapter || new GeminiProviderAdapter();
      this.timeoutMs = config.timeoutMs ?? 15_000;
      this.onWarning =
        config.onWarning ||
        ((msg) => {
          console.warn(`[REFLECTION TRANSPORT WARNING] ${msg}`);
        });
    }
  }

  /**
   * Evaluates whether a failure from the primary provider qualifies for fallback.
   * Qualifies:
   * - Timeout (AI_TIMEOUT)
   * - Rate limit / Quota exceeded (AI_QUOTA_EXCEEDED / 429)
   * - Missing primary configuration (AI_NOT_CONFIGURED)
   * - Temporary server failures (5xx HTTP status)
   * - Transient network errors (connection reset, fetch drops)
   */
  isFallbackAppropriate(error: unknown): boolean {
    if (error instanceof ReflectionProviderError) {
      if (
        error.code === 'AI_TIMEOUT' ||
        error.code === 'AI_QUOTA_EXCEEDED' ||
        error.code === 'AI_NOT_CONFIGURED'
      ) {
        return true;
      }
      if (error.statusCode && error.statusCode >= 500 && error.statusCode <= 599) {
        return true;
      }
    }

    if (error instanceof Error) {
      // Abort / timeout
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return true;
      }
      // Common transient fetch / network failure keywords
      const msg = error.message.toLowerCase();
      if (
        msg.includes('fetch failed') ||
        msg.includes('econnreset') ||
        msg.includes('etimedout') ||
        msg.includes('network') ||
        msg.includes('socket')
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Executes a provider call bounded by an independent timeout.
   */
  private async callWithTimeout(
    adapter: ILlmProviderAdapter,
    request: ReflectionRequest
  ): Promise<string> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(
          new ReflectionProviderError(
            `Provider '${adapter.name}' timed out after ${this.timeoutMs}ms`,
            'AI_TIMEOUT'
          )
        );
      }, this.timeoutMs);
    });

    try {
      return await Promise.race([
        adapter.generate(request, controller.signal),
        timeoutPromise,
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Primary entry point: Attempts Groq first, seamlessly falling back to Gemini if appropriate.
   */
  async generateReflection(request: ReflectionRequest): Promise<ReflectionResult> {
    let primaryError: unknown = null;

    // Check if primary is unconfigured at call time
    if (!this.primary.isConfigured()) {
      if (!DualProviderReflectionTransport.warnedMissingPrimary) {
        this.onWarning(
          `Primary provider '${this.primary.name}' is NOT configured (GROQ_API_KEY missing). Degenerating to fallback provider '${this.fallback.name}'.`
        );
        DualProviderReflectionTransport.warnedMissingPrimary = true;
      }
      primaryError = new ReflectionProviderError(
        `Primary provider '${this.primary.name}' is not configured (GROQ_API_KEY is not configured)`,
        'AI_NOT_CONFIGURED'
      );
    } else {
      // Try Primary (Groq)
      try {
        const text = await this.callWithTimeout(this.primary, request);
        return {
          text,
          providerUsed: this.primary.name,
          fellBack: false,
        };
      } catch (err: unknown) {
        primaryError = err;
      }
    }

    // Classify whether fallback is appropriate
    if (this.isFallbackAppropriate(primaryError)) {
      const sanitizedPrimaryReason =
        primaryError instanceof Error
          ? sanitizeError(primaryError.message)
          : 'Primary provider failed';

      // Attempt Fallback (Gemini)
      if (!this.fallback.isConfigured()) {
        throw new ReflectionProviderError(
          `[AI_ALL_PROVIDERS_FAILED] All reflection providers failed: primary '${this.primary.name}' failed (${sanitizedPrimaryReason}) and fallback '${this.fallback.name}' is not configured`,
          'AI_ALL_PROVIDERS_FAILED'
        );
      }

      try {
        const fallbackText = await this.callWithTimeout(this.fallback, request);
        return {
          text: fallbackText,
          providerUsed: this.fallback.name,
          fellBack: true,
          primaryFailureReason: sanitizedPrimaryReason,
        };
      } catch (fallbackErr: unknown) {
        const sanitizedFallbackReason =
          fallbackErr instanceof Error
            ? sanitizeError(fallbackErr.message)
            : 'Fallback provider failed';

        throw new ReflectionProviderError(
          `[AI_ALL_PROVIDERS_FAILED] All reflection providers failed: primary '${this.primary.name}' failed (${sanitizedPrimaryReason}), fallback '${this.fallback.name}' failed (${sanitizedFallbackReason})`,
          'AI_ALL_PROVIDERS_FAILED'
        );
      }
    }

    // Non-retryable primary error (do not fallback)
    const sanitizedMsg =
      primaryError instanceof Error ? sanitizeError(primaryError.message) : 'Unknown error';
    if (primaryError instanceof ReflectionProviderError) {
      throw new ReflectionProviderError(
        sanitizedMsg,
        primaryError.code,
        primaryError.statusCode,
        primaryError.details
      );
    }
    throw new ReflectionProviderError(
      `[AI_ALL_PROVIDERS_FAILED] Primary provider failed with non-retryable error: ${sanitizedMsg}`,
      'AI_ALL_PROVIDERS_FAILED'
    );
  }
}
