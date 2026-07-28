import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { env } from "../env.js";

/**
 * Configure postgres client connection for Drizzle ORM
 */
const queryClient = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === "production" ? 10 : 2,
  idle_timeout: 30,
  connect_timeout: 10,
});

/**
 * Export Drizzle database instance
 */
export const db = drizzle(queryClient, { schema });

/**
 * Health check helper to verify PostgreSQL database connection
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latencyMs: number;
}> {
  const start = Date.now();
  try {
    await queryClient`SELECT 1`;
    return {
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    console.error("❌ Database health check failed:", error);
    return {
      connected: false,
      latencyMs: Date.now() - start,
    };
  }
}

export * from "./schema.js";
