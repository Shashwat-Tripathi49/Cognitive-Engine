import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { env, checkDatabaseHealth } from "@cognitive-engine/shared";

const app = new Hono();

/**
 * Root endpoint — Infrastructure verification
 */
app.get("/", (c) => {
  return c.json({
    status: "ok",
  });
});

/**
 * Health check endpoint — Verifies API & Database connection
 */
app.get("/health", async (c) => {
  const dbHealth = await checkDatabaseHealth();
  return c.json({
    healthy: true,
    services: {
      api: "ok",
      database: dbHealth.connected ? "ok" : "degraded",
    },
    latencyMs: dbHealth.latencyMs,
    timestamp: new Date().toISOString(),
  });
});

const port = env.PORT || 3001;

console.info(`⚡ API server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
