import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  GithubLogo, MapPin, Globe, EnvelopeSimple, Star, GitFork, ArrowSquareOut, Code
} from "@phosphor-icons/react/dist/ssr";
import { getPortfolioUser, type PortfolioUser } from "@/lib/api";
import { formatNumber, getLanguageColor } from "@/lib/utils";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

interface Props { params: Promise<{ username: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getPortfolioUser(username);
  if (!user) return { title: "Portfolio not found" };
  const title = user.displayName ?? user.username;
  const description = user.bio ?? `${user.username} — ${user.githubData?.profile?.public_repos ?? 0} repos, ${formatNumber(user.githubData?.totalStars ?? 0)} stars.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile", images: user.avatarUrl ? [{ url: user.avatarUrl, width: 400, height: 400 }] : [] },
    twitter: { card: "summary", title, description, images: user.avatarUrl ? [user.avatarUrl] : [] },
  };
}

export const revalidate = 3600;

export default async function PortfolioPage({ params }: Props) {
  const { username } = await params;
  const user = await getPortfolioUser(username);
  if (!user) notFound();

  const settings = user.settings ?? {};
  const hideSections = settings.hideSections ?? [];
  const allRepos = user.githubData?.repos ?? [];
  const pinnedRepos = settings.pinnedRepos ?? [];

  const displayRepos = pinnedRepos.length > 0
    ? [...allRepos.filter((r) => pinnedRepos.includes(r.name)), ...allRepos.filter((r) => !pinnedRepos.includes(r.name)).sort((a, b) => b.stargazers_count - a.stargazers_count)].slice(0, 6)
    : [...allRepos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);

  const totalBytes = Object.values(user.githubData?.languages ?? {}).reduce((a, b) => a + b, 0);
  const topLanguages = Object.entries(user.githubData?.languages ?? {})
    .sort(([, a], [, b]) => b - a).slice(0, 10)
    .map(([lang, bytes]) => ({ lang, pct: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0" }));

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Person",
    name: user.displayName ?? user.username,
    url: `https://${user.username}.initmyfolio.com`,
    image: user.avatarUrl, description: user.bio,
    sameAs: [`https://github.com/${user.username}`],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-[100dvh] bg-background">
        {/* Slim nav */}
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: "52px" }}>
            <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Code weight="bold" className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold">InitMyFolio</span>
            </Link>
            <div className="flex items-center gap-2">
              <a href={`https://github.com/${user.username}`} target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-all duration-200">
                <GithubLogo weight="regular" className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Profile — LEFT ALIGNED (DESIGN_VARIANCE 8) */}
        <header className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.displayName ?? user.username}
                  width={88} height={88} priority
                  className="rounded-2xl ring-1 ring-border shrink-0" />
              ) : (
                <div className="w-22 h-22 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                  <GithubLogo weight="thin" className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{user.displayName ?? user.username}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">@{user.username}</p>
                {user.bio && <p className="text-foreground/80 mt-3 max-w-[60ch] text-sm leading-relaxed">{user.bio}</p>}
                <div className="flex flex-wrap gap-4 mt-4">
                  {user.location && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin weight="regular" className="w-4 h-4" />{user.location}
                    </span>
                  )}
                  {user.website && (
                    <a href={user.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Globe weight="regular" className="w-4 h-4" />
                      {user.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {settings.showEmail && user.email && (
                    <a href={`mailto:${user.email}`}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <EnvelopeSimple weight="regular" className="w-4 h-4" />{user.email}
                    </a>
                  )}
                  {(settings.customLinks ?? []).map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <ArrowSquareOut weight="regular" className="w-4 h-4" />{link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
          {/* Stats — dividers not boxed */}
          {!hideSections.includes("stats") && (
            <section className="bg-card border border-border rounded-2xl grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
              {[
                { label: "Repositories", value: user.githubData?.profile?.public_repos ?? 0 },
                { label: "Total stars", value: user.githubData?.totalStars ?? 0 },
                { label: "Total forks", value: user.githubData?.totalForks ?? 0 },
                { label: "Followers", value: user.githubData?.profile?.followers ?? 0 },
              ].map((s, i) => (
                <div key={s.label} className={`px-4 py-5 text-center ${i >= 2 ? "border-t sm:border-t-0 border-border" : ""}`}>
                  <div className="text-xl font-bold text-foreground font-mono">{formatNumber(s.value)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </section>
          )}

          {/* Repos */}
          {!hideSections.includes("repos") && displayRepos.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Featured repositories</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {displayRepos.map((repo) => (
                  <a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer"
                    className="p-5 bg-card border border-border rounded-xl hover:border-border/70 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.3)] transition-all duration-300 group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-primary text-sm group-hover:underline truncate">{repo.name}</span>
                      <div className="flex items-center gap-2.5 shrink-0 text-muted-foreground">
                        <span className="flex items-center gap-1 text-xs">
                          <Star weight="regular" className="w-3.5 h-3.5" />{formatNumber(repo.stargazers_count)}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <GitFork weight="regular" className="w-3.5 h-3.5" />{formatNumber(repo.forks_count)}
                        </span>
                      </div>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {repo.language && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                          <span className="text-xs text-muted-foreground">{repo.language}</span>
                        </div>
                      )}
                      {repo.topics?.slice(0, 2).map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-primary/8 text-primary text-[10px] rounded-full font-medium">{t}</span>
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
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Languages</h2>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex rounded-full overflow-hidden h-2 mb-5">
                  {topLanguages.map(({ lang, pct }) => (
                    <div key={lang} style={{ width: `${pct}%`, backgroundColor: getLanguageColor(lang) }} title={`${lang}: ${pct}%`} />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {topLanguages.map(({ lang, pct }) => (
                    <div key={lang} className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: getLanguageColor(lang) }} />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{lang}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{pct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        <footer className="border-t border-border mt-4">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{user.displayName ?? user.username}</p>
            <Link href="https://initmyfolio.com" target="_blank"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Code weight="regular" className="w-3.5 h-3.5" />
              Powered by InitMyFolio
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
