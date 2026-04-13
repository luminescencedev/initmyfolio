import type { Context, Next } from "hono";
import type { AppVariables } from "../types.js";
import { verifyToken } from "../lib/jwt.js";

export async function authMiddleware(
  c: Context<{ Variables: AppVariables }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("userId", payload.userId);
  c.set("username", payload.username);
  return next();
}
