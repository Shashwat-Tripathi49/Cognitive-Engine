import { Hono } from 'hono';
import { z } from 'zod';
import {
  ReasoningEngine,
  DrizzleReasoningRepository,
  EvidenceRetrievalService,
  DrizzleEvidenceStorageAdapter,
  CandidateFindingSchema,
  ClaimStatusSchema,
  FindingTypeSchema,
} from '@cognitive-engine/shared';

export const reasoningRouter = new Hono();

// Shared reasoning engine instance
const repository = new DrizzleReasoningRepository();
const retrievalService = new EvidenceRetrievalService(new DrizzleEvidenceStorageAdapter());
export const defaultReasoningEngine = new ReasoningEngine(repository, retrievalService);

/**
 * Zod schema for evaluate finding request
 */
const evaluateFindingRequestSchema = z.object({
  userId: z.string().uuid('Invalid userId UUID format'),
  finding: CandidateFindingSchema,
  evaluationTimestamp: z.string().datetime().optional(),
});

/**
 * POST /reasoning/evaluate
 *
 * Deterministically evaluates a candidate finding against underlying evidence.
 */
reasoningRouter.post('/evaluate', async (c) => {
  try {
    const rawBody = await c.req.json();
    const parseResult = evaluateFindingRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: parseResult.error.format(),
        },
        400
      );
    }

    const { userId, finding, evaluationTimestamp } = parseResult.data;

    const response = await defaultReasoningEngine.evaluateFinding({
      userId,
      finding: {
        ...finding,
        temporalScope: {
          startDate: new Date(finding.temporalScope.startDate),
          endDate: new Date(finding.temporalScope.endDate),
        },
        provenanceReferences: (finding.provenanceReferences || []).map((p) => ({
          ...p,
          capturedAt: new Date(p.capturedAt),
        })),
      },
      evaluationTimestamp: evaluationTimestamp ? new Date(evaluationTimestamp) : undefined,
    });

    return c.json(
      {
        success: true,
        data: response,
      },
      200
    );
  } catch (err: unknown) {
    console.error('Error in POST /reasoning/evaluate:', err);
    const message = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        error: 'Failed to evaluate candidate finding',
        message,
      },
      500
    );
  }
});

/**
 * GET /reasoning/claims
 *
 * Lists validated claims for a user with optional status and type filters.
 */
reasoningRouter.get('/claims', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) {
      return c.json({ error: 'userId query parameter is required' }, 400);
    }

    const statusParam = c.req.query('status');
    const typeParam = c.req.query('claimType');
    const limitParam = c.req.query('limit');
    const offsetParam = c.req.query('offset');

    let status = undefined;
    if (statusParam) {
      const parsedStatus = ClaimStatusSchema.safeParse(statusParam);
      if (parsedStatus.success) {
        status = parsedStatus.data;
      }
    }

    let claimType = undefined;
    if (typeParam) {
      const parsedType = FindingTypeSchema.safeParse(typeParam);
      if (parsedType.success) {
        claimType = parsedType.data;
      }
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const claims = await defaultReasoningEngine.listClaims(userId, {
      status,
      claimType,
      limit,
      offset,
    });

    return c.json(
      {
        success: true,
        data: claims,
      },
      200
    );
  } catch (err: unknown) {
    console.error('Error in GET /reasoning/claims:', err);
    const message = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        error: 'Failed to retrieve claims',
        message,
      },
      500
    );
  }
});

/**
 * GET /reasoning/claims/:id
 *
 * Retrieves a single validated claim and its associated evidence chain.
 */
reasoningRouter.get('/claims/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId query parameter is required' }, 400);
    }

    const claim = await defaultReasoningEngine.getClaim(id, userId);
    if (!claim) {
      return c.json({ error: 'Claim not found' }, 404);
    }

    const evidenceChain = await defaultReasoningEngine.getEvidenceChain(
      claim.evidenceChainId,
      userId
    );

    return c.json(
      {
        success: true,
        data: {
          claim,
          evidenceChain,
        },
      },
      200
    );
  } catch (err: unknown) {
    console.error(`Error in GET /reasoning/claims/${c.req.param('id')}:`, err);
    const message = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        error: 'Failed to retrieve claim details',
        message,
      },
      500
    );
  }
});

/**
 * GET /reasoning/evidence-chains/:id
 *
 * Retrieves a standalone evidence chain by ID.
 */
reasoningRouter.get('/evidence-chains/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId query parameter is required' }, 400);
    }

    const chain = await defaultReasoningEngine.getEvidenceChain(id, userId);
    if (!chain) {
      return c.json({ error: 'Evidence chain not found' }, 404);
    }

    return c.json(
      {
        success: true,
        data: chain,
      },
      200
    );
  } catch (err: unknown) {
    console.error(`Error in GET /reasoning/evidence-chains/${c.req.param('id')}:`, err);
    const message = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        error: 'Failed to retrieve evidence chain',
        message,
      },
      500
    );
  }
});
