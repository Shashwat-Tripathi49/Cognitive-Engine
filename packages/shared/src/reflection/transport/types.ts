export type ReflectionProviderName = 'groq' | 'gemini';

export interface ReflectionRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ReflectionResult {
  text: string;
  providerUsed: ReflectionProviderName;
  fellBack: boolean;
  primaryFailureReason?: string;
}

export type ReflectionProviderErrorCode =
  | 'AI_QUOTA_EXCEEDED'
  | 'AI_NOT_CONFIGURED'
  | 'AI_TIMEOUT'
  | 'AI_ALL_PROVIDERS_FAILED';

export class ReflectionProviderError extends Error {
  constructor(
    message: string,
    public readonly code: ReflectionProviderErrorCode,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ReflectionProviderError';
  }
}

export interface ILlmProviderAdapter {
  readonly name: ReflectionProviderName;
  isConfigured(): boolean;
  generate(request: ReflectionRequest, signal?: AbortSignal): Promise<string>;
}
