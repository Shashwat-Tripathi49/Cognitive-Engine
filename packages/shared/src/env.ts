import { z } from "zod";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from workspace root if running in local development
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Server-side environment variable schema
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://postgres:postgres@localhost:5432/cognitive_engine"),
  CLERK_SECRET_KEY: z.string().optional(),
});

/**
 * Client-side environment variable schema
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, {
      message:
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required for Clerk authentication",
    })
    .default("pk_test_placeholder"),
});

/**
 * Combined environment variable schema
 */
export const envSchema = serverEnvSchema.merge(clientEnvSchema);

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and export current environment variables
 */
export function parseEnv(
  env: Record<string, string | undefined> = process.env,
): Env {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    console.error(
      "❌ Invalid environment variables:",
      result.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables configuration");
  }

  return result.data;
}

export const env = parseEnv();
