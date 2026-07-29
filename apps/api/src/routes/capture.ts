import { Hono } from 'hono';
import {
  CaptureEngine,
  CaptureValidationError,
  DrizzleCognitiveFragmentRepository,
  CognitiveFragmentModality,
} from '@cognitive-engine/shared';
import { requireAuth } from '../middleware/auth.js';

export const captureRouter = new Hono();

// Enforce authentication on all capture routes
captureRouter.use('*', requireAuth);

const captureEngine = new CaptureEngine();
const repository = new DrizzleCognitiveFragmentRepository();

/**
 * POST /capture
 * Receives raw thought from authenticated user, normalizes, computes SHA-256 contentHash, and persists.
 */
captureRouter.post('/', async (c) => {
  const userId = c.get('userId');

  try {
    const body = await c.req.json();
    const fragment = await captureEngine.captureThought(userId, body);

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
 * GET /capture
 * Lists paginated Cognitive Fragments owned by the authenticated user.
 * Supports: page, limit, modality, startDate, endDate.
 */
captureRouter.get('/', async (c) => {
  const userId = c.get('userId');

  try {
    const query = c.req.query();
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const modality = query.modality as CognitiveFragmentModality | undefined;
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const result = await repository.findAll(userId, {
      page,
      limit,
      modality,
      startDate,
      endDate,
    });

    return c.json(result, 200);
  } catch (error) {
    console.error('❌ Capture Listing Failure:', error);
    return c.json(
      {
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to list cognitive fragments',
        },
      },
      500
    );
  }
});

/**
 * GET /capture/:id
 * Retrieves a single Cognitive Fragment owned by the authenticated user.
 */
captureRouter.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  try {
    const fragment = await repository.findById(id, userId);

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
