import { Hono } from 'hono';
import { z } from 'zod';
import {
  ReflectionEngine,
  DrizzleReflectionRepository,
  DrizzleReasoningRepository,
  ReflectionType,
} from '@cognitive-engine/shared';

export const defaultReflectionEngine = new ReflectionEngine(
  new DrizzleReflectionRepository(),
  new DrizzleReasoningRepository()
);

export const reflectionRouter = new Hono();

const generateReflectionSchema = z.object({
  userId: z.string().uuid(),
  claimId: z.string().uuid(),
  customSnippets: z
    .array(
      z.object({
        fragmentId: z.string(),
        capturedAt: z.string(),
        text: z.string(),
      })
    )
    .optional(),
});

/**
 * POST /reflection/generate
 * Generates a grounded reflection from a validated claim.
 */
reflectionRouter.post('/generate', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = generateReflectionSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: 'Validation failed',
          details: parsed.error.format(),
        },
        400
      );
    }

    const { userId, claimId, customSnippets } = parsed.data;
    const reflection = await defaultReflectionEngine.generateReflection({
      userId,
      claimId,
      customSnippets,
    });

    return c.json(
      {
        success: true,
        data: reflection,
      },
      201
    );
  } catch (error: unknown) {
    const err = error as Error;
    const status = err.message.includes('not found')
      ? 404
      : err.message.includes('Invalid claim status') || err.message.includes('isolation violation')
      ? 403
      : 500;

    return c.json(
      {
        success: false,
        error: err.message,
      },
      status
    );
  }
});

/**
 * GET /reflection/list
 * Lists reflections for a user with optional type filter.
 */
reflectionRouter.get('/list', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) {
      return c.json({ success: false, error: 'userId query parameter is required' }, 400);
    }

    const reflectionType = c.req.query('reflectionType') as ReflectionType | undefined;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 50;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!, 10) : 0;

    const reflections = await defaultReflectionEngine.listReflections(userId, {
      reflectionType,
      limit,
      offset,
    });

    return c.json(
      {
        success: true,
        data: reflections,
      },
      200
    );
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * GET /reflection/:id
 * Retrieves a single reflection.
 */
reflectionRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ success: false, error: 'userId query parameter is required' }, 400);
    }

    const reflection = await defaultReflectionEngine.getReflection(id, userId);
    if (!reflection) {
      return c.json({ success: false, error: 'Reflection not found' }, 404);
    }

    return c.json(
      {
        success: true,
        data: reflection,
      },
      200
    );
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * GET /reflection/:id/provenance
 * Retrieves cryptographic provenance lineage for a reflection.
 */
reflectionRouter.get('/:id/provenance', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ success: false, error: 'userId query parameter is required' }, 400);
    }

    const provenance = await defaultReflectionEngine.getProvenance(id, userId);
    if (!provenance) {
      return c.json({ success: false, error: 'Reflection provenance not found' }, 404);
    }

    return c.json(
      {
        success: true,
        data: provenance,
      },
      200
    );
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ success: false, error: err.message }, 500);
  }
});
