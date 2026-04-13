import { Hono } from "hono";
import { prisma } from "@initmyfolio/db";
import { fetchGitHubUser, aggregateGitHubData } from "../lib/github.js";
import { signToken } from "../lib/jwt.js";

export const authRouter = new Hono();

const GITHUB_CLIENT_ID = process.env["GITHUB_CLIENT_ID"] ?? "";
const GITHUB_CLIENT_SECRET = process.env["GITHUB_CLIENT_SECRET"] ?? "";
const GITHUB_CALLBACK_URL =
  process.env["GITHUB_CALLBACK_URL"] ??
  "http://localhost:3001/auth/github/callback";
const WEB_URL = process.env["CORS_ORIGIN"] ?? "http://localhost:3000";

// Initiate GitHub OAuth
authRouter.get("/github", (c) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: "read:user user:email",
    state: crypto.randomUUID(),
  });

  return c.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
});

// GitHub OAuth callback
authRouter.get("/github/callback", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");

  if (error || !code) {
    return c.redirect(`${WEB_URL}/login?error=oauth_failed`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_CALLBACK_URL,
        }),
      }
    );

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      return c.redirect(`${WEB_URL}/login?error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;

    // Get GitHub user profile
    const githubUser = await fetchGitHubUser(accessToken);

    // Sync GitHub data
    const githubData = await aggregateGitHubData(githubUser.login, accessToken);

    // Serialize to plain JSON (satisfies Prisma's InputJsonValue)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const githubDataJson = JSON.parse(JSON.stringify(githubData)) as any;

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { githubId: githubUser.id },
      create: {
        githubId: githubUser.id,
        username: githubUser.login,
        displayName: githubUser.name ?? githubUser.login,
        bio: githubUser.bio,
        avatarUrl: githubUser.avatar_url,
        location: githubUser.location,
        website: githubUser.blog,
        email: githubUser.email,
        githubData: githubDataJson,
        lastSyncedAt: new Date(),
      },
      update: {
        username: githubUser.login,
        displayName: githubUser.name ?? githubUser.login,
        bio: githubUser.bio,
        avatarUrl: githubUser.avatar_url,
        location: githubUser.location,
        website: githubUser.blog,
        email: githubUser.email,
        githubData: githubDataJson,
        lastSyncedAt: new Date(),
      },
    });

    // Create JWT token
    const token = await signToken({ userId: user.id, username: user.username });

    // Redirect to dashboard with token
    return c.redirect(`${WEB_URL}/dashboard?token=${token}`);
  } catch (err) {
    console.error("[Auth] GitHub callback error:", err);
    return c.redirect(`${WEB_URL}/login?error=server_error`);
  }
});

// Get current user (verify token)
authRouter.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { verifyToken } = await import("../lib/jwt.js");
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ error: "Invalid token" }, 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      location: true,
      website: true,
      email: true,
      githubData: true,
      settings: true,
      lastSyncedAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
});
