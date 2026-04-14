import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { syncRouter } from "./routes/sync.js";
import { startCronJobs } from "./cron/index.js";

const app = new Hono();

// Validate critical env vars at startup
if (process.env["NODE_ENV"] === "production" && !process.env["CORS_ORIGIN"]) {
  throw new Error("CORS_ORIGIN environment variable is required in production");
}

// Global middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: process.env["CORS_ORIGIN"] ?? "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
app.route("/auth", authRouter);
app.route("/api/users", usersRouter);
app.route("/api/sync", syncRouter);

// 404
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler — never expose stack traces to clients
app.onError((err, c) => {
  if (process.env["NODE_ENV"] !== "production") {
    console.error("[Error]", err);
  } else {
    console.error("[Error]", { message: err.message, name: err.name });
  }
  return c.json({ error: "Internal server error" }, 500);
});

// Start cron jobs
if (process.env["NODE_ENV"] !== "test") {
  startCronJobs();
}

const port = parseInt(process.env["API_PORT"] ?? "3001", 10);
console.log(`[API] Starting on port ${port}`);

serve({ fetch: app.fetch, port });

export default app;
