import { z } from 'zod';

export type CognitiveFragmentModality =
  | 'text'
  | 'voice_transcript'
  | 'web_highlight'
  | 'structured_prompt'
  | 'image_annotation';

/**
 * Typed & Versioned Capture Metadata — Schema Version 1
 */
export const captureMetadataSchema = z
  .object({
    schemaVersion: z.number().int().positive().default(1),
    source: z.enum(['web', 'mobile', 'api', 'cli']).default('api'),
    clientTimezone: z.string().optional(),
    clientPlatform: z.string().optional(),
  })
  .passthrough();

export type CaptureMetadata = z.infer<typeof captureMetadataSchema>;

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
  metadata: CaptureMetadata;
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
  metadata?: CaptureMetadata;
}

/**
 * Zod Input Validation Schema for Capture Requests
 * NOTE: userId is enforced by backend auth context and CANNOT be passed by client.
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
  metadata: captureMetadataSchema.optional().default({
    schemaVersion: 1,
    source: 'api',
  }),
});

export type CaptureRequest = z.infer<typeof captureRequestSchema>;

/**
 * Listing & Query Filter Parameters
 */
export interface CaptureQueryOptions {
  page?: number;
  limit?: number;
  modality?: CognitiveFragmentModality;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Standard Paginated Response Wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Domain Exception for Capture Validation Errors
 */
export class CaptureValidationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'CaptureValidationError';
  }
}
