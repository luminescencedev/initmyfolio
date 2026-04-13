import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  GithubLogo, MapPin, Globe, EnvelopeSimple,
  Star, GitFork, ArrowSquareOut, ArrowLeft
} from "@phosphor-icons/react/dist/ssr";
import { getPortfolioUser } from "@/lib/api";
import { formatNumber, getLanguageColor } from "@/lib/utils";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

interface Props { params: Promise<{ username: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getPortfolioUser(username);
  if (!user) return { title: "PORTFOLIO NOT FOUND // INITMYFOLIO" };
  const title = `${(user.displayName ?? user.username).toUpperCase()} // INITMYFOLIO`;
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
    ? [...allRepos.filter((r) => pinnedRepos.includes(r.name)), ...allRepos.filter((r) => !pinnedRepos.includes(r.name)).sort((a, b) => b.stargazers_count - a.stargazers_count)].slice(0, 8)
    : [...allRepos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 8);

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

  const displayName = (user.displayName ?? user.username).toUpperCase();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-[100dvh] bg-background">

        {/* ── NAV ─────────────────────────────────── */}
        <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 label hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                INITMYFOLIO
              </Link>
              <span className="label hidden sm:block">///</span>
              <span className="label hidden sm:block text-foreground">{user.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <a href={`https://github.com/${user.username}`} target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors active:scale-[0.98]">
                <GithubLogo weight="regular" className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GITHUB</span>
              </a>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* ── HERO: MASSIVE NAME ───────────────────── */}
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-0">
            {/* Massive name */}
            <div className="overflow-hidden">
              <h1
                className="font-display uppercase tracking-tighter text-foreground leading-[0.85] pb-6"
                style={{ fontSize: "clamp(3rem, 12vw, 11rem)" }}
              >
                {displayName}
              </h1>
            </div>

            {/* Meta strip */}
            <div className="border-t border-border py-4 flex flex-wrap gap-4 items-center">
              {user.avatarUrl && (
                <Image src={user.avatarUrl} alt={displayName} width={32} height={32} className="rounded-full border border-border" />
              )}
              {user.bio && (
                <p className="text-xs text-muted-foreground max-w-[48ch]">{user.bio}</p>
              )}
              <div className="flex items-center gap-4 ml-auto flex-wrap">
                {user.location && (
                  <span className="flex items-center gap-1.5 label">
                    <MapPin weight="regular" className="w-3.5 h-3.5" />{user.location}
                  </span>
                )}
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 label hover:text-foreground transition-colors">
                    <Globe weight="regular" className="w-3.5 h-3.5" />
                    {user.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {settings.showEmail && user.email && (
                  <a href={`mailto:${user.email}`}
                    className="flex items-center gap-1.5 label hover:text-foreground transition-colors">
                    <EnvelopeSimple weight="regular" className="w-3.5 h-3.5" />{user.email}
                  </a>
                )}
                {(settings.customLinks ?? []).map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 label hover:text-foreground transition-colors">
                    <ArrowSquareOut weight="regular" className="w-3.5 h-3.5" />{link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* ── STATS ────────────────────────────── */}
          {!hideSections.includes("stats") && (
            <div className="border border-border grid grid-cols-2 sm:grid-cols-4 divide-x divide-border mb-8">
              {[
                { label: "REPOSITORIES", value: user.githubData?.profile?.public_repos ?? 0 },
                { label: "TOTAL STARS", value: user.githubData?.totalStars ?? 0 },
                { label: "TOTAL FORKS", value: user.githubData?.totalForks ?? 0 },
                { label: "FOLLOWERS", value: user.githubData?.profile?.followers ?? 0 },
              ].map((s, i) => (
                <div key={s.label} className={`px-5 py-5 text-center ${i >= 2 ? "border-t sm:border-t-0 border-border" : ""}`}>
                  <div className="font-mono text-3xl font-bold text-foreground">{formatNumber(s.value)}</div>
                  <div className="label mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── REPOS ────────────────────────────── */}
          {!hideSections.includes("repos") && displayRepos.length > 0 && (
            <div className="border border-border mb-8">
              <div className="border-b border-border px-4 py-2.5 bg-muted flex items-center justify-between">
                <span className="label">[ REPOSITORIES ]</span>
                <span className="label">{allRepos.length} TOTAL / SORTED BY ★</span>
              </div>

              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[1fr_100px_80px_70px] border-b border-border px-4 py-2 bg-muted/50">
                <span className="label">NAME</span>
                <span className="label">LANGUAGE</span>
                <span className="label text-right">STARS</span>
                <span className="label text-right">FORKS</span>
              </div>

              {displayRepos.map((repo, i) => (
                <a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer"
                  className={`grid sm:grid-cols-[1fr_100px_80px_70px] gap-2 sm:gap-0 px-4 py-4 items-start sm:items-center hover:bg-muted transition-colors ${i < displayRepos.length - 1 ? "border-b border-border" : ""} group`}>
                  <div className="min-w-0">
                    <div className="text-sm font-mono font-bold text-primary group-hover:underline truncate">{repo.name}</div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{repo.description}</p>
                    )}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {repo.topics.slice(0, 3).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 border border-border text-[9px] font-mono uppercase tracking-wider">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {repo.language && (
                      <>
                        <div className="w-2 h-2 shrink-0" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                        <span className="text-[11px] font-mono text-muted-foreground">{repo.language}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-muted-foreground">
                    <Star weight="regular" className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono">{formatNumber(repo.stargazers_count)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 text-muted-foreground">
                    <GitFork weight="regular" className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono">{formatNumber(repo.forks_count)}</span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* ── LANGUAGES ────────────────────────── */}
          {!hideSections.includes("languages") && topLanguages.length > 0 && (
            <div className="border border-border">
              <div className="border-b border-border px-4 py-2.5 bg-muted">
                <span className="label">[ LANGUAGE DISTRIBUTION ]</span>
              </div>
              <div className="p-6">
                {/* Full-width bar */}
                <div className="flex w-full h-3 mb-6">
                  {topLanguages.map(({ lang, pct }) => (
                    <div key={lang} style={{ width: `${pct}%`, backgroundColor: getLanguageColor(lang) }} title={`${lang}: ${pct}%`} />
                  ))}
                </div>

                {/* Legend grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-0 border border-border divide-x divide-y divide-border">
                  {topLanguages.map(({ lang, pct }) => (
                    <div key={lang} className="flex flex-col p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: getLanguageColor(lang) }} />
                        <span className="text-[11px] font-mono text-foreground truncate">{lang}</span>
                      </div>
                      <div className="font-mono text-base font-bold text-foreground">{pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── FOOTER ───────────────────────────── */}
        <footer className="border-t border-border mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="label text-foreground">{user.username}.initmyfolio.com</span>
            </div>
            <Link href="https://initmyfolio.com" target="_blank"
              className="label hover:text-foreground transition-colors">
              POWERED BY INITMYFOLIO
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
