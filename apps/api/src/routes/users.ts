import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@initmyfolio/db";
import type { AppVariables } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const usersRouter = new Hono<{ Variables: AppVariables }>();

// Public: Get portfolio data (DB read only, no GitHub API call)
usersRouter.get(
  "/:username",
  rateLimit(60, 60_000), // 60 req/min
  async (c) => {
    const username = c.req.param("username") as string;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        location: true,
        website: true,
        githubData: true,
        settings: true,
        lastSyncedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return c.json({ error: "Portfolio not found" }, 404);
    }

    return c.json({ user });
  }
);

// Authenticated: Update portfolio settings
const settingsSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  theme: z.enum(["dark", "light", "auto"]).optional(),
  showEmail: z.boolean().optional(),
  pinnedRepos: z.array(z.string()).max(6).optional(),
  customLinks: z
    .array(
      z.object({
        label: z.string().max(50),
        url: z.string().url(),
        icon: z.string().optional(),
      })
    )
    .max(10)
    .optional(),
  hideSections: z.array(z.enum(["stats", "languages", "repos"])).optional(),
});

usersRouter.put(
  "/:username/settings",
  authMiddleware,
  zValidator("json", settingsSchema),
  async (c) => {
    const paramUsername = c.req.param("username") as string;
    const authUsername = c.get("username");

    // Only allow users to update their own settings
    if (paramUsername !== authUsername) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const body = c.req.valid("json");

    const user = await prisma.user.update({
      where: { username: paramUsername },
      data: {
        ...(body.displayName !== undefined && {
          displayName: body.displayName,
        }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.website !== undefined && { website: body.website }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        settings: body as any,
      },
      select: {
        username: true,
        displayName: true,
        bio: true,
        website: true,
        settings: true,
      },
    });

    return c.json({ user });
  }
);
