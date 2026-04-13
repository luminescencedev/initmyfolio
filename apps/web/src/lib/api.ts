const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

export interface PortfolioUser {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  website: string | null;
  email: string | null;
  githubData: {
    profile: {
      login: string;
      public_repos: number;
      followers: number;
      following: number;
    };
    repos: Array<{
      id: number;
      name: string;
      full_name: string;
      description: string | null;
      html_url: string;
      homepage: string | null;
      stargazers_count: number;
      forks_count: number;
      language: string | null;
      topics: string[];
    }>;
    languages: Record<string, number>;
    totalStars: number;
    totalForks: number;
  };
  settings: {
    // Existants
    theme?: "dark" | "light" | "auto";
    pinnedRepos?: string[];
    customLinks?: Array<{ label: string; url: string; icon?: string }>;
    hideSections?: string[];
    showEmail?: boolean;
    // Apparence
    accentColor?: "red" | "cyan" | "emerald" | "amber" | "rose" | "sky";
    fontStyle?: "mono" | "display" | "mixed";
    layoutVariant?: "brutalist" | "glass" | "clean" | "editorial";
    heroStyle?: "name-full" | "name-initials" | "name-split";
    showAvatar?: boolean;
    // Contenu
    sectionOrder?: string[];
    repoDisplayStyle?: "table" | "cards" | "compact";
    maxRepos?: 4 | 6 | 8 | 12;
    repoSortBy?: "stars" | "forks" | "updated" | "pinned-first";
    showTopics?: boolean;
    // Sections personnalisées
    aboutText?: string;
    techStack?: Array<{ name: string; category?: string }>;
    availability?: "open" | "busy" | "closed" | null;
    featuredRepo?: string | null;
  };
  lastSyncedAt: string | null;
  createdAt: string;
}

export async function getPortfolioUser(
  username: string,
): Promise<PortfolioUser | null> {
  try {
    const res = await fetch(`${API_URL}/api/users/${username}`, {
      next: { revalidate: 3600 }, // ISR: revalidate every hour
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`API error: ${res.status}`);
    }

    const data = (await res.json()) as { user: PortfolioUser };
    return data.user;
  } catch (err) {
    console.error(`[API] Failed to fetch user ${username}:`, err);
    return null;
  }
}

export async function getCurrentUser(
  token: string,
): Promise<PortfolioUser | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { user: PortfolioUser };
    return data.user;
  } catch {
    return null;
  }
}

export async function updateSettings(
  token: string,
  username: string,
  settings: Partial<PortfolioUser["settings"]>,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/users/${username}/settings`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface SyncResult {
  ok: boolean;
  rateLimited?: boolean;
  retryAfter?: number; // seconds
  availableAt?: Date;
}

export async function triggerSync(
  token: string,
  username: string,
): Promise<SyncResult> {
  try {
    const res = await fetch(`${API_URL}/api/sync/${username}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return { ok: true };
    if (res.status === 429) {
      const body = (await res.json()) as {
        retryAfter?: number;
        availableAt?: string;
      };
      return {
        ok: false,
        rateLimited: true,
        retryAfter: body.retryAfter,
        availableAt: body.availableAt ? new Date(body.availableAt) : undefined,
      };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
