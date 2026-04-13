import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Github,
  MapPin,
  Globe,
  Mail,
  Star,
  GitFork,
  ExternalLink,
  Code2,
} from "lucide-react";
import { getPortfolioUser, type PortfolioUser } from "@/lib/api";
import { formatNumber, getLanguageColor } from "@/lib/utils";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getPortfolioUser(username);

  if (!user) {
    return { title: "Portfolio not found" };
  }

  const title = `${user.displayName ?? user.username} — Portfolio`;
  const description =
    user.bio ??
    `${user.username}'s open source portfolio. ${user.githubData?.profile?.public_repos ?? 0} repos, ${formatNumber(user.githubData?.totalStars ?? 0)} stars.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: user.avatarUrl
        ? [{ url: user.avatarUrl, width: 400, height: 400 }]
        : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: user.avatarUrl ? [user.avatarUrl] : [],
    },
  };
}

export const revalidate = 3600; // ISR: regenerate every hour

export default async function PortfolioPage({ params }: Props) {
  const { username } = await params;
  const user = await getPortfolioUser(username);

  if (!user) {
    notFound();
  }

  const settings = user.settings ?? {};
  const hideSections = settings.hideSections ?? [];

  const allRepos = user.githubData?.repos ?? [];
  const pinnedRepos = settings.pinnedRepos ?? [];

  // Show pinned repos first, then top by stars
  const displayRepos =
    pinnedRepos.length > 0
      ? [
          ...allRepos.filter((r) => pinnedRepos.includes(r.name)),
          ...allRepos
            .filter((r) => !pinnedRepos.includes(r.name))
            .sort((a, b) => b.stargazers_count - a.stargazers_count),
        ].slice(0, 6)
      : [...allRepos]
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 6);

  const totalBytes = Object.values(user.githubData?.languages ?? {}).reduce(
    (a, b) => a + b,
    0
  );

  const topLanguages = Object.entries(user.githubData?.languages ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([lang, bytes]) => ({
      lang,
      pct: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0",
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.displayName ?? user.username,
    url: `https://${user.username}.initmyfolio.com`,
    image: user.avatarUrl,
    description: user.bio,
    sameAs: [`https://github.com/${user.username}`],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#0d1117] text-white">
        {/* Profile Header */}
        <header className="border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {user.avatarUrl && (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName ?? user.username}
                  width={120}
                  height={120}
                  className="rounded-full ring-4 ring-white/10 shrink-0"
                  priority
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">
                  {user.displayName ?? user.username}
                </h1>
                <p className="text-gray-400 text-lg mb-3">@{user.username}</p>
                {user.bio && (
                  <p className="text-gray-300 mb-4 max-w-xl">{user.bio}</p>
                )}

                {/* Links */}
                <div className="flex flex-wrap gap-4">
                  <a
                    href={`https://github.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                  {user.location && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {user.location}
                    </span>
                  )}
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      {user.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {settings.showEmail && user.email && (
                    <a
                      href={`mailto:${user.email}`}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </a>
                  )}
                  {/* Custom links */}
                  {(settings.customLinks ?? []).map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-12 space-y-12">
          {/* Stats */}
          {!hideSections.includes("stats") && (
            <section>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: "Repositories",
                    value: user.githubData?.profile?.public_repos ?? 0,
                  },
                  {
                    label: "Total stars",
                    value: user.githubData?.totalStars ?? 0,
                  },
                  {
                    label: "Total forks",
                    value: user.githubData?.totalForks ?? 0,
                  },
                  {
                    label: "Followers",
                    value: user.githubData?.profile?.followers ?? 0,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-[#161b22] border border-white/10 rounded-xl p-4 text-center"
                  >
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(stat.value)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Repositories */}
          {!hideSections.includes("repos") && displayRepos.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-6">
                Featured repositories
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {displayRepos.map((repo) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-[#161b22] border border-white/10 rounded-xl p-5 hover:border-white/25 hover:bg-[#1c2128] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-semibold text-primary group-hover:underline">
                        {repo.name}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Star className="w-3.5 h-3.5" />
                          {formatNumber(repo.stargazers_count)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <GitFork className="w-3.5 h-3.5" />
                          {formatNumber(repo.forks_count)}
                        </span>
                      </div>
                    </div>
                    {repo.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {repo.language && (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getLanguageColor(repo.language),
                            }}
                          />
                          <span className="text-xs text-gray-400">
                            {repo.language}
                          </span>
                        </div>
                      )}
                      {repo.topics?.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {!hideSections.includes("languages") && topLanguages.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-6">Languages</h2>
              <div className="bg-[#161b22] border border-white/10 rounded-xl p-6">
                {/* Multi-color bar */}
                <div className="flex rounded-full overflow-hidden h-3 mb-6">
                  {topLanguages.map(({ lang, pct }) => (
                    <div
                      key={lang}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: getLanguageColor(lang),
                      }}
                      title={`${lang}: ${pct}%`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {topLanguages.map(({ lang, pct }) => (
                    <div key={lang} className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: getLanguageColor(lang) }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{lang}</div>
                        <div className="text-xs text-gray-400">{pct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 mt-12">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              {user.displayName ?? user.username}'s portfolio
            </p>
            <a
              href="https://initmyfolio.com"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              Powered by InitMyFolio
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
