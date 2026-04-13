import { Hono } from "hono";
import { prisma } from "@initmyfolio/db";
import { aggregateGitHubData } from "../lib/github.js";

export const syncRouter = new Hono();

// Internal sync endpoint (can be called by cron or user)
syncRouter.post("/:username", async (c) => {
  const username = c.req.param("username") as string;
  const internalKey = c.req.header("x-internal-key");

  // Verify internal key for cron calls, or auth token for user calls
  const isInternalCall = internalKey === process.env["INTERNAL_SYNC_KEY"];
  if (!isInternalCall) {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { verifyToken } = await import("../lib/jwt.js");
    const payload = await verifyToken(token);
    if (!payload || payload.username !== username) {
      return c.json({ error: "Forbidden" }, 403);
    }
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Rate limit: don't sync more than once per 5 minutes manually
  if (!isInternalCall && user.lastSyncedAt) {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (user.lastSyncedAt > fiveMinsAgo) {
      const retryAfter = Math.ceil(
        (user.lastSyncedAt.getTime() + 5 * 60 * 1000 - Date.now()) / 1000
      );
      return c.json(
        {
          error: "Rate limited",
          retryAfter,
          availableAt: new Date(user.lastSyncedAt.getTime() + 5 * 60 * 1000),
        },
        429
      );
    }
  }

  try {
    const githubData = await aggregateGitHubData(username);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const githubDataJson = JSON.parse(JSON.stringify(githubData)) as any;

    const updated = await prisma.user.update({
      where: { username },
      data: {
        githubData: githubDataJson,
        displayName: githubData.profile.name ?? username,
        bio: githubData.profile.bio,
        avatarUrl: githubData.profile.avatar_url,
        location: githubData.profile.location,
        website: githubData.profile.blog,
        lastSyncedAt: new Date(),
      },
      select: {
        username: true,
        lastSyncedAt: true,
      },
    });

    return c.json({
      success: true,
      user: updated,
      repoCount: githubData.repos.length,
    });
  } catch (err) {
    console.error(`[Sync] Failed for ${username}:`, err);
    return c.json({ error: "Sync failed" }, 500);
  }
});
