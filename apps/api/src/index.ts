import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { env, checkDatabaseHealth } from '@cognitive-engine/shared';
import { captureRouter } from './routes/capture.js';
import { memoryApp } from './routes/memory.js';
import { graphRouter } from './routes/graph.js';
import { reasoningRouter } from './routes/reasoning.js';
import { cognitiveRouter } from './routes/cognitive.js';
import { reflectionRouter } from './routes/reflection.js';

const app = new Hono();

// Enable CORS for web frontend clients
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

/**
 * Root endpoint — Infrastructure verification
 */
app.get('/', (c) => {
  return c.json({
    status: 'ok',
  });
});

/**
 * Health check endpoint — Verifies API & Database connection
 */
app.get('/health', async (c) => {
  const dbHealth = await checkDatabaseHealth();
  return c.json({
    healthy: true,
    services: {
      api: 'ok',
      database: dbHealth.connected ? 'ok' : 'degraded',
    },
    latencyMs: dbHealth.latencyMs,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Mount Routers — Sprint 1B, Sprint 1C-B, Knowledge Graph & Reasoning Engine
 */
app.route('/capture', captureRouter);
app.route('/memory', memoryApp);
app.route('/graph', graphRouter);
app.route('/reasoning', reasoningRouter);
app.route('/cognitive', cognitiveRouter);
app.route('/reflection', reflectionRouter);

const port = env.PORT || 3001;

// Only start HTTP listener if not running inside automated Vitest suite
if (process.env.NODE_ENV !== 'test') {
  console.info(`⚡ API server starting on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
