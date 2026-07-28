import { Hono } from 'hono';
import {
  CaptureEngine,
  CaptureValidationError,
  DrizzleCognitiveFragmentRepository,
} from '@cognitive-engine/shared';

export const captureRouter = new Hono();

const captureEngine = new CaptureEngine();
const repository = new DrizzleCognitiveFragmentRepository();

/**
 * POST /capture
 * Receives raw thought, normalizes content, calculates SHA-256 hash, persists CognitiveFragment.
 */
captureRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const fragment = await captureEngine.captureThought(body);

    return c.json(fragment, 201);
  } catch (error) {
    if (error instanceof CaptureValidationError) {
      return c.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: error.message,
            details: error.details ?? null,
          },
        },
        400
      );
    }

    console.error('❌ Internal Capture Failure:', error);

    return c.json(
      {
        error: {
          code: 'PERSISTENCE_ERROR',
          message: 'Failed to persist cognitive fragment',
        },
      },
      500
    );
  }
});

/**
 * GET /capture/:id
 * Retrieves a stored Cognitive Fragment by ID.
 */
captureRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const fragment = await repository.findById(id);

    if (!fragment) {
      return c.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Cognitive fragment not found',
          },
        },
        404
      );
    }

    return c.json(fragment, 200);
  } catch (error) {
    console.error('❌ Fragment Retrieval Failure:', error);
    return c.json(
      {
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to retrieve cognitive fragment',
        },
      },
      500
    );
  }
});
