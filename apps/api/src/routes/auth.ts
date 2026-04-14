import { Hono } from "hono";
import { prisma } from "@initmyfolio/db";
import {
  fetchGitHubUser,
  aggregateGitHubData,
  toStoredProfile,
} from "../lib/github.js";
import { signToken } from "../lib/jwt.js";

export const authRouter = new Hono();

const GITHUB_CLIENT_ID = process.env["GITHUB_CLIENT_ID"] ?? "";
const GITHUB_CLIENT_SECRET = process.env["GITHUB_CLIENT_SECRET"] ?? "";
const GITHUB_CALLBACK_URL =
  process.env["GITHUB_CALLBACK_URL"] ??
  "http://localhost:3001/auth/github/callback";
const WEB_URL = process.env["CORS_ORIGIN"] ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// OAuth CSRF — state store (state -> expiresAt ms)
// ---------------------------------------------------------------------------
const oauthStates = new Map<string, number>();

// ---------------------------------------------------------------------------
// One-time auth codes — never put the JWT itself in a URL
// (code -> { token, expiresAt })
// ---------------------------------------------------------------------------
const authCodes = new Map<string, { token: string; expiresAt: number }>();

// Purge expired entries every minute so the Maps don't grow unbounded
const _cleanup = setInterval(() => {
  const now = Date.now();
  for (const [k, exp] of oauthStates) if (now > exp) oauthStates.delete(k);
  for (const [k, { expiresAt }] of authCodes)
    if (now > expiresAt) authCodes.delete(k);
}, 60_000);
// Don't keep the process alive just for cleanup
if (typeof _cleanup.unref === "function") _cleanup.unref();

// ---------------------------------------------------------------------------
// Initiate GitHub OAuth
// ---------------------------------------------------------------------------
authRouter.get("/github", (c) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return c.json({ error: "GitHub OAuth not configured" }, 503);
  }

  const state = crypto.randomUUID();
  oauthStates.set(state, Date.now() + 10 * 60 * 1000); // 10-min TTL

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: "read:user user:email",
    state,
  });

  return c.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
});

// ---------------------------------------------------------------------------
// Exchange one-time auth code for JWT
// POST /auth/exchange  { code: string }
// The code is valid for 60 s and can only be used once.
// This keeps the JWT out of URLs (no browser history / proxy log exposure).
// ---------------------------------------------------------------------------
authRouter.post("/exchange", async (c) => {
  let code: string;
  try {
    const body = (await c.req.json()) as { code?: unknown };
    if (typeof body.code !== "string" || !body.code) {
      return c.json({ error: "Missing code" }, 400);
    }
    code = body.code;
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const entry = authCodes.get(code);
  authCodes.delete(code); // Invalidate immediately — one-time use

  if (!entry || Date.now() > entry.expiresAt) {
    return c.json({ error: "Invalid or expired code" }, 401);
  }

  return c.json({ token: entry.token });
});

// ---------------------------------------------------------------------------
// GitHub OAuth callback
// ---------------------------------------------------------------------------
authRouter.get("/github/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error || !code) {
    return c.redirect(`${WEB_URL}/login?error=oauth_failed`);
  }

  // Verify CSRF state — must match what we issued in /auth/github
  const stateExp = state ? oauthStates.get(state) : undefined;
  oauthStates.delete(state ?? ""); // Always remove (one-time use)
  if (!stateExp || Date.now() > stateExp) {
    return c.redirect(`${WEB_URL}/login?error=invalid_state`);
  }

  try {
    // Exchange code for GitHub access token
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
      },
    );

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      return c.redirect(`${WEB_URL}/login?error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;

    // Get GitHub user profile (1 fast API call, ~200 ms)
    const githubUser = await fetchGitHubUser(accessToken);

    // Seed githubData with stripped profile so new users see something immediately.
    // Full data arrives via the background aggregation below.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileSeed = JSON.parse(
      JSON.stringify({
        profile: toStoredProfile(githubUser),
        repos: [],
        languages: {},
        totalStars: 0,
        totalForks: 0,
      }),
    ) as any;

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
        githubData: profileSeed,
        // lastSyncedAt intentionally null — background sync below will set it
      },
      update: {
        username: githubUser.login,
        displayName: githubUser.name ?? githubUser.login,
        bio: githubUser.bio,
        avatarUrl: githubUser.avatar_url,
        location: githubUser.location,
        website: githubUser.blog,
        email: githubUser.email,
      },
    });

    // Issue JWT, wrap in a short-lived one-time code so the JWT never
    // appears in a URL (browser history, proxy logs, Referer header).
    const token = await signToken({ userId: user.id, username: user.username });
    const authCode = crypto.randomUUID();
    authCodes.set(authCode, { token, expiresAt: Date.now() + 60_000 }); // 60-s TTL

    const redirect = c.redirect(`${WEB_URL}/dashboard?code=${authCode}`);

    // Fire-and-forget full repo + language aggregation in the background.
    aggregateGitHubData(githubUser.login, accessToken)
      .then(async ({ stored, userUpdate }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = JSON.parse(JSON.stringify(stored)) as any;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            githubData: json,
            displayName: userUpdate.displayName ?? githubUser.login,
            bio: userUpdate.bio,
            avatarUrl: userUpdate.avatarUrl,
            location: userUpdate.location,
            website: userUpdate.website,
            lastSyncedAt: new Date(),
          },
        });
      })
      .catch((err) => console.error("[Auth] Background sync failed:", err));

    return redirect;
  } catch (err) {
    console.error("[Auth] GitHub callback error:", err);
    return c.redirect(`${WEB_URL}/login?error=server_error`);
  }
});

// ---------------------------------------------------------------------------
// Get current user (verify Bearer token)
// ---------------------------------------------------------------------------
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
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
});
