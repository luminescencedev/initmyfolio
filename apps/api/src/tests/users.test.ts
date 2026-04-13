import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../index.js";

// Mock Prisma
vi.mock("@initmyfolio/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("GET /api/users/:username", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for unknown user", async () => {
    const { prisma } = await import("@initmyfolio/db");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await app.request("/api/users/nonexistent");
    expect(res.status).toBe(404);

    const json = await res.json() as { error: string };
    expect(json.error).toBe("Portfolio not found");
  });

  it("returns user data for known user", async () => {
    const { prisma } = await import("@initmyfolio/db");
    const mockUser = {
      id: "user_1",
      username: "testuser",
      displayName: "Test User",
      bio: "A developer",
      avatarUrl: "https://avatars.githubusercontent.com/u/1",
      location: "Paris",
      website: "https://example.com",
      githubData: { repos: [], languages: {}, totalStars: 0, totalForks: 0 },
      settings: {},
      lastSyncedAt: new Date(),
      createdAt: new Date(),
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const res = await app.request("/api/users/testuser");
    expect(res.status).toBe(200);

    const json = await res.json() as { user: typeof mockUser };
    expect(json.user.username).toBe("testuser");
  });
});

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const json = await res.json() as { status: string };
    expect(json.status).toBe("ok");
  });
});
