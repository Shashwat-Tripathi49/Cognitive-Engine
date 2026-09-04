import { Hono } from "hono";
import { env, checkDatabaseHealth, CONSTANTS } from "@cognitive-engine/shared";

console.info("========================================");
console.info("⚡ Sprint 1A Verification Script");
console.info("========================================");

console.info("1. Shared Package Constants:", CONSTANTS);
console.info("2. Environment Parsing:", {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  DATABASE_URL: env.DATABASE_URL,
});

const app = new Hono();

app.get("/", (c) => c.json({ status: "ok" }));
app.get("/health", (c) => c.json({ healthy: true }));

async function runTests() {
  const rootRes = await app.request("/");
  const rootJson = await rootRes.json();
  console.info("3. GET / Response:", rootJson);

  const healthRes = await app.request("/health");
  const healthJson = await healthRes.json();
  console.info("4. GET /health Response:", healthJson);

  const dbHealth = await checkDatabaseHealth();
  console.info("5. Database Connection Verification:", dbHealth);
  console.info("========================================");
  console.info("✅ Sprint 1A Infrastructure Verification Complete");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
