import { Hono } from 'hono';
import { z } from 'zod';
import {
  CognitiveEngine,
  DrizzleCognitiveRepository,
  DrizzleCognitiveDataProvider,
  FindingTypeSchema,
  FindingType,
} from '@cognitive-engine/shared';
import { defaultReasoningEngine } from './reasoning.js';

export const cognitiveRouter = new Hono();

// Shared cognitive engine instance
const repository = new DrizzleCognitiveRepository();
const dataProvider = new DrizzleCognitiveDataProvider();
export const defaultCognitiveEngine = new CognitiveEngine(repository, dataProvider);

const discoverRequestSchema = z.object({
  userId: z.string().uuid('Invalid userId UUID format'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  evaluationTimestamp: z.string().datetime().optional(),
  detectorIds: z.array(z.string()).optional(),
  persistFindings: z.boolean().optional(),
  config: z
    .object({
      minRecurrenceFragments: z.number().int().positive().optional(),
      recurrenceTargetSaturation: z.number().int().positive().optional(),
      maxSequenceGapHours: z.number().positive().optional(),
      minSequenceOccurrences: z.number().int().positive().optional(),
      clusterCosineSimilarityThreshold: z.number().min(0).max(1).optional(),
      clusterMinCohesionThreshold: z.number().min(0).max(1).optional(),
      minClusterSize: z.number().int().positive().optional(),
      minCoOccurrenceCount: z.number().int().positive().optional(),
    })
    .optional(),
});

/**
 * POST /cognitive/discover
 *
 * Deterministically discovers candidate findings across Knowledge Graph, Memory nodes, and Fragments.
 */
cognitiveRouter.post('/discover', async (c) => {
  try {
    const rawBody = await c.req.json();
    const parseResult = discoverRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: parseResult.error.format(),
        },
        400
      );
    }

    const {
      userId,
      startDate,
      endDate,
      evaluationTimestamp,
      detectorIds,
      persistFindings,
      config,
    } = parseResult.data;

    const result = await defaultCognitiveEngine.discover(userId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      evaluationTimestamp: evaluationTimestamp ? new Date(evaluationTimestamp) : undefined,
      detectorIds,
      persistFindings,
      config,
    });

    return c.json(
      {
        success: true,
        data: result,
      },
      200
    );
  } catch (err: unknown) {
    console.error('Error in POST /cognitive/discover:', err);
    const message = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        error: 'Failed to execute cognitive discovery',
        message,
      },
      500
    );
  }
});

/**
 * POST /cognitive/pipeline/run
 *
 * Runs end-to-end discovery and evaluation (Cognitive -> Reasoning).
 */
cognitiveRouter.post('/pipeline/run', async (c) => {
  try {
    const rawBody = await c.req.json();
    const parseResult = discoverRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: parseResult.error.format(),
        },
        400
      );
    }

    const {
      userId,
      startDate,
      endDate,
      evaluationTimestamp,
      detectorIds,
      persistFindings,
      config,
    } = parseResult.data;

    const result = await defaultCognitiveEngine.runPipeline(userId, defaultReasoningEngine, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      evaluationTimestamp: evaluationTimestamp ? new Date(evaluationTimestamp) : undefined,
      detectorIds,
      persistFindings,
      config,
    });

    return c.json(
      {
        success: true,
        data: result,
      },
      200
    );
  } catch (err: unknown) {
    console.error('Error in POST /cognitive/pipeline/run:', err);
    const message = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        error: 'Failed to run end-to-end cognitive pipeline',
        message,
      },
      500
    );
  }
});

/**
 * GET /cognitive/findings
 *
 * Lists discovered candidate findings for a user.
 */
cognitiveRouter.get('/findings', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) {
      return c.json({ error: 'userId query parameter is required' }, 400);
    }

    const typeParam = c.req.query('findingType');
    const limitParam = c.req.query('limit');
    const offsetParam = c.req.query('offset');

    let findingType: FindingType | undefined = undefined;
    if (typeParam) {
      const parsedType = FindingTypeSchema.safeParse(typeParam);
      if (parsedType.success) {
        findingType = parsedType.data;
      }
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const findings = await defaultCognitiveEngine.listFindings(userId, {
      findingType,
      limit,
      offset,
    });

    return c.json(
      {
        success: true,
        data: findings,
      },
      200
    );
  } catch (err: unknown) {
    console.error('Error in GET /cognitive/findings:', err);
    const message = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        error: 'Failed to retrieve candidate findings',
        message,
      },
      500
    );
  }
});

/**
 * GET /cognitive/findings/:id
 *
 * Retrieves a single candidate finding by ID.
 */
cognitiveRouter.get('/findings/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId query parameter is required' }, 400);
    }

    const finding = await defaultCognitiveEngine.getFinding(id, userId);
    if (!finding) {
      return c.json({ error: 'Candidate finding not found' }, 404);
    }

    return c.json(
      {
        success: true,
        data: finding,
      },
      200
    );
  } catch (err: unknown) {
    console.error(`Error in GET /cognitive/findings/${c.req.param('id')}:`, err);
    const message = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        error: 'Failed to retrieve candidate finding',
        message,
      },
      500
    );
  }
});
