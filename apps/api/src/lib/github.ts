const GITHUB_API = "https://api.github.com";

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

export interface GitHubData {
  profile: GitHubUser;
  repos: GitHubRepo[];
  languages: GitHubLanguages;
  totalStars: number;
  totalForks: number;
}

async function githubFetch<T>(
  path: string,
  accessToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "InitMyFolio/1.0",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${GITHUB_API}${path}`, { headers });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${error}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchGitHubUser(
  accessToken: string
): Promise<GitHubUser> {
  return githubFetch<GitHubUser>("/user", accessToken);
}

export async function fetchGitHubUserByUsername(
  username: string,
  accessToken?: string
): Promise<GitHubUser> {
  return githubFetch<GitHubUser>(`/users/${username}`, accessToken);
}

export async function fetchGitHubRepos(
  username: string,
  accessToken?: string
): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const batch = await githubFetch<GitHubRepo[]>(
      `/users/${username}/repos?sort=updated&per_page=${perPage}&page=${page}`,
      accessToken
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
  accessToken?: string
): Promise<GitHubLanguages> {
  try {
    return await githubFetch<GitHubLanguages>(
      `/repos/${fullName}/languages`,
      accessToken
    );
  } catch {
    return {};
  }
}

export async function aggregateGitHubData(
  username: string,
  accessToken?: string
): Promise<GitHubData> {
  const [profile, repos] = await Promise.all([
    fetchGitHubUserByUsername(username, accessToken),
    fetchGitHubRepos(username, accessToken),
  ]);

  // Aggregate languages from top repos (to avoid too many API calls)
  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 20);

  const languageResults = await Promise.all(
    topRepos.map((repo) => fetchRepoLanguages(repo.full_name, accessToken))
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

  return { profile, repos, languages, totalStars, totalForks };
}
