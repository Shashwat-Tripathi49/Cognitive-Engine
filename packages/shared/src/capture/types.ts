import { z } from 'zod';

export type CognitiveFragmentModality =
  | 'text'
  | 'voice_transcript'
  | 'web_highlight'
  | 'structured_prompt'
  | 'image_annotation';

/**
 * Immutable Cognitive Fragment Domain Model
 */
export interface CognitiveFragment {
  id: string;
  userId: string;
  content: string;
  modality: CognitiveFragmentModality;
  contentHash: string;
  capturedAt: Date;
  metadata: Record<string, unknown>;
}

/**
 * Repository Input DTO for Fragment Creation
 */
export interface CreateCognitiveFragmentInput {
  id?: string;
  userId: string;
  content: string;
  modality?: CognitiveFragmentModality;
  contentHash: string;
  capturedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * System fallback user ID for unauthenticated Sprint 1B operations
 */
export const SYSTEM_DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Zod Input Validation Schema for Capture Requests
 */
export const captureRequestSchema = z.object({
  text: z
    .string({
      required_error: 'Capture text is required',
      invalid_type_error: 'Capture text must be a string',
    })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: 'Capture text cannot be empty or whitespace-only',
    }),
  modality: z
    .enum([
      'text',
      'voice_transcript',
      'web_highlight',
      'structured_prompt',
      'image_annotation',
    ])
    .optional()
    .default('text'),
  userId: z.string().uuid().optional().default(SYSTEM_DEFAULT_USER_ID),
  metadata: z.record(z.unknown()).optional().default({}),
});

export type CaptureRequest = z.infer<typeof captureRequestSchema>;

/**
 * Domain Exception for Capture Validation Errors
 */
export class CaptureValidationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'CaptureValidationError';
  }
}
