import { Hono } from 'hono';
import { z } from 'zod';
import {
  MemoryEngine,
  DrizzleMemoryRepository,
  DrizzleCognitiveFragmentRepository,
  MockEmbeddingProvider,
} from '@cognitive-engine/shared';
import { requireAuth } from '../middleware/auth';

const memoryApp = new Hono<{ Variables: { userId: string } }>();

// Protect all memory endpoints with requireAuth middleware
memoryApp.use('*', requireAuth);

const memoryRepo = new DrizzleMemoryRepository();
const fragmentRepo = new DrizzleCognitiveFragmentRepository();
const embeddingProvider = new MockEmbeddingProvider();
const memoryEngine = new MemoryEngine(memoryRepo, fragmentRepo, embeddingProvider);

const createMemorySchema = z.object({
  fragmentId: z.string().uuid({ message: 'fragmentId must be a valid UUID' }),
});

const searchMemorySchema = z.object({
  query: z.string().min(1, { message: 'query must not be empty' }),
  topK: z.number().int().positive().max(50).optional().default(5),
  minSimilarity: z.number().min(0).max(1).optional().default(0.0),
});

/**
 * POST /memory/from-fragment
 * Derives a Memory with 384-D vector embedding from an immutable CognitiveFragment.
 */
memoryApp.post('/from-fragment', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const parseResult = createMemorySchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload',
          details: parseResult.error.flatten(),
        },
      },
      400
    );
  }

  const { fragmentId } = parseResult.data;

  // Retrieve fragment verifying multi-tenant ownership
  const fragment = await fragmentRepo.findById(fragmentId, userId);
  if (!fragment) {
    return c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: `CognitiveFragment with ID ${fragmentId} not found or unauthorized`,
        },
      },
      404
    );
  }

  const memory = await memoryEngine.createMemoryFromFragment(fragment);

  return c.json(
    {
      data: memory,
    },
    201
  );
});

/**
 * POST /memory/search
 * Performs semantic vector similarity search scoped to authenticated user.
 */
memoryApp.post('/search', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const parseResult = searchMemorySchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search request payload',
          details: parseResult.error.flatten(),
        },
      },
      400
    );
  }

  const { query, topK, minSimilarity } = parseResult.data;

  const searchResults = await memoryEngine.searchSimilarMemories(
    userId,
    query,
    { topK, minSimilarity }
  );

  return c.json(
    {
      data: searchResults,
      query: {
        text: query,
        topK,
        minSimilarity,
      },
    },
    200
  );
});

/**
 * GET /memory/:id
 * Retrieve Memory by ID verifying multi-tenant ownership.
 */
memoryApp.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const memory = await memoryEngine.getMemoryById(id, userId);

  if (!memory) {
    return c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: `Memory with ID ${id} not found`,
        },
      },
      404
    );
  }

  return c.json(
    {
      data: memory,
    },
    200
  );
});

export { memoryApp };
