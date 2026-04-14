const GITHUB_API = "https://api.github.com";

// ---------------------------------------------------------------------------
// Raw GitHub API shapes (full payloads as returned by the API)
// ---------------------------------------------------------------------------

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  location: string | null;
  blog: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
  fork: boolean;
  archived: boolean;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubLanguages {
  [language: string]: number;
}

// ---------------------------------------------------------------------------
// Stored shapes — only the fields actually rendered in the portfolio/dashboard.
// Everything else is stripped before writing to the DB to reduce JSONB size.
// ---------------------------------------------------------------------------

/** Profile fields used in the UI: stats section + metadata description. */
export interface StoredProfile {
  public_repos: number;
  followers: number;
}

/** Repo fields used in the UI: name, link, stats, language, topics. */
export interface StoredRepo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  homepage: string | null;
}

export interface StoredGitHubData {
  profile: StoredProfile;
  repos: StoredRepo[];
  languages: GitHubLanguages;
  totalStars: number;
  totalForks: number;
}

/**
 * User column fields extracted from the raw profile.
 * Returned alongside StoredGitHubData so sync routes can update
 * the User row without needing a second API call.
 */
export interface UserColumnUpdate {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string;
  location: string | null;
  website: string | null;
}

export interface AggregateResult {
  stored: StoredGitHubData;
  userUpdate: UserColumnUpdate;
}

// ---------------------------------------------------------------------------
// Mapping helpers — guarantee only the declared fields end up in the DB,
// even if the GitHub API adds new fields in the future.
// ---------------------------------------------------------------------------

export function toStoredProfile(u: GitHubUser): StoredProfile {
  return {
    public_repos: u.public_repos,
    followers: u.followers,
  };
}

export function toStoredRepo(r: GitHubRepo): StoredRepo {
  return {
    id: r.id,
    name: r.name,
    html_url: r.html_url,
    // Truncate to 200 chars — UI line-clamps to 1 line anyway
    description: r.description ? r.description.slice(0, 200) : null,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    language: r.language,
    // Truncate to 5 topics — UI shows 3–4 at most
    topics: r.topics.slice(0, 5),
    // Normalize empty string to null
    homepage: r.homepage || null,
  };
}

async function githubFetch<T>(path: string, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "InitMyFolio/1.0",
  };

  const token = accessToken ?? process.env["GITHUB_TOKEN"];
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${GITHUB_API}${path}`, { headers });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${error}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchGitHubUser(
  accessToken: string,
): Promise<GitHubUser> {
  return githubFetch<GitHubUser>("/user", accessToken);
}

export async function fetchGitHubUserByUsername(
  username: string,
  accessToken?: string,
): Promise<GitHubUser> {
  return githubFetch<GitHubUser>(`/users/${username}`, accessToken);
}

export async function fetchGitHubRepos(
  username: string,
  accessToken?: string,
): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const batch = await githubFetch<GitHubRepo[]>(
      `/users/${username}/repos?sort=updated&per_page=${perPage}&page=${page}`,
      accessToken,
    );

    repos.push(...batch);

    if (batch.length < perPage) break;
    page++;
    if (page > 10) break; // Max 1000 repos
  }

  return repos.filter((r) => !r.fork && !r.archived);
}

export async function fetchRepoLanguages(
  fullName: string,
  accessToken?: string,
): Promise<GitHubLanguages> {
  try {
    return await githubFetch<GitHubLanguages>(
      `/repos/${fullName}/languages`,
      accessToken,
    );
  } catch {
    return {};
  }
}

export async function aggregateGitHubData(
  username: string,
  accessToken?: string,
): Promise<AggregateResult> {
  const [profile, repos] = await Promise.all([
    fetchGitHubUserByUsername(username, accessToken),
    fetchGitHubRepos(username, accessToken),
  ]);

  // Aggregate languages from top repos (to avoid too many API calls)
  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 20);

  const languageResults = await Promise.all(
    topRepos.map((repo) => fetchRepoLanguages(repo.full_name, accessToken)),
  );

  // Merge all language data
  const languages: GitHubLanguages = {};
  for (const langData of languageResults) {
    for (const [lang, bytes] of Object.entries(langData)) {
      languages[lang] = (languages[lang] ?? 0) + bytes;
    }
  }

  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);

  return {
    // Strip to only the fields rendered in the UI — keeps JSONB small.
    stored: {
      profile: toStoredProfile(profile),
      repos: repos.map(toStoredRepo),
      languages,
      totalStars,
      totalForks,
    },
    // Raw profile fields needed to update User columns (not stored in JSONB).
    userUpdate: {
      displayName: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      location: profile.location,
      website: profile.blog,
    },
  };
}
