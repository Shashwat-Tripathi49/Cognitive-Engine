import { Hono } from 'hono';
import { z } from 'zod';
import {
  KnowledgeGraphEngine,
  DrizzleKnowledgeGraphRepository,
  GroqEntityExtractionProvider,
  LayeredHybridEntityResolver,
  MiniLMEmbeddingProvider,
  entityTypeSchema,
} from '@cognitive-engine/shared';

export const graphRouter = new Hono();

// Shared engine instance with production providers
const kgRepository = new DrizzleKnowledgeGraphRepository();
const extractionProvider = new GroqEntityExtractionProvider();
const embeddingProvider = new MiniLMEmbeddingProvider();
const resolver = new LayeredHybridEntityResolver(embeddingProvider);
export const defaultKgEngine = new KnowledgeGraphEngine(
  kgRepository,
  extractionProvider,
  resolver
);

/**
 * Zod validation schema for processing a fragment through KG engine
 */
const processFragmentSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  fragmentId: z.string().min(1, 'fragmentId is required'),
  content: z.string().min(1, 'content is required'),
  contentHash: z.string().min(1, 'contentHash is required'),
  memoryId: z.string().optional().nullable(),
  capturedAt: z.string().datetime().optional(),
});

/**
 * POST /graph/process-fragment
 *
 * Ingests a CognitiveFragment into the Knowledge Graph Engine.
 */
graphRouter.post('/process-fragment', async (c) => {
  try {
    const body = await c.req.json();
    const validated = processFragmentSchema.parse(body);

    const result = await defaultKgEngine.processFragment({
      userId: validated.userId,
      fragmentId: validated.fragmentId,
      content: validated.content,
      contentHash: validated.contentHash,
      memoryId: validated.memoryId || null,
      capturedAt: validated.capturedAt
        ? new Date(validated.capturedAt)
        : new Date(),
    });

    return c.json(
      {
        success: true,
        data: result,
      },
      200
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation failed',
          issues: err.issues,
        },
        400
      );
    }
    return c.json(
      {
        error: 'Failed to process fragment in knowledge graph',
        message: err.message,
      },
      500
    );
  }
});

/**
 * GET /graph/entities
 *
 * Lists canonical entities for a tenant.
 */
graphRouter.get('/entities', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) {
    return c.json({ error: 'userId query parameter is required' }, 400);
  }

  const rawType = c.req.query('entityType');
  const rawStatus = c.req.query('status') as any;
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 50;
  const offset = c.req.query('offset')
    ? parseInt(c.req.query('offset')!, 10)
    : 0;

  const entityType =
    rawType && entityTypeSchema.safeParse(rawType).success
      ? (rawType as any)
      : undefined;

  const entities = await defaultKgEngine.listCanonicalEntities(userId, {
    entityType,
    status: rawStatus,
    limit,
    offset,
  });

  return c.json({ data: entities }, 200);
});

/**
 * GET /graph/entities/:id
 *
 * Retrieves a single canonical entity.
 */
graphRouter.get('/entities/:id', async (c) => {
  const userId = c.req.query('userId');
  const id = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'userId query parameter is required' }, 400);
  }

  const entity = await defaultKgEngine.getCanonicalEntity(id, userId);
  if (!entity) {
    return c.json({ error: 'Canonical entity not found' }, 404);
  }

  return c.json({ data: entity }, 200);
});

/**
 * GET /graph/subgraph
 *
 * Traverses and returns a subgraph by entity ID or fragment ID.
 */
graphRouter.get('/subgraph', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) {
    return c.json({ error: 'userId query parameter is required' }, 400);
  }

  const entityId = c.req.query('entityId');
  const fragmentId = c.req.query('fragmentId');
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 20;

  const subgraph = await defaultKgEngine.getSubgraph(userId, {
    entityId,
    fragmentId,
    limit,
  });

  return c.json({ data: subgraph }, 200);
});

/**
 * GET /graph/confirmation-queue
 *
 * Lists pending ambiguous candidates.
 */
graphRouter.get('/confirmation-queue', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) {
    return c.json({ error: 'userId query parameter is required' }, 400);
  }

  const candidates = await defaultKgEngine.getPendingCandidates(userId);
  return c.json({ data: candidates }, 200);
});

/**
 * POST /graph/confirmation-queue/:id/resolve
 *
 * Resolves a pending candidate item.
 */
graphRouter.post('/confirmation-queue/:id/resolve', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const schema = z.object({
      userId: z.string().min(1),
      action: z.enum(['APPROVE_AS_NEW', 'MERGE_INTO', 'REJECT']),
      targetCanonicalId: z.string().optional(),
    });

    const parsed = schema.parse(body);
    const result = await defaultKgEngine.resolveCandidate(
      id,
      parsed.userId,
      parsed.action,
      parsed.targetCanonicalId
    );

    return c.json({ success: true, data: result }, 200);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', issues: err.issues }, 400);
    }
    return c.json(
      { error: 'Failed to resolve candidate', message: err.message },
      500
    );
  }
});
