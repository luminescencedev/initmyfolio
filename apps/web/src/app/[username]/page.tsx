import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import {
  GithubLogo,
  MapPin,
  Globe,
  EnvelopeSimple,
  Star,
  GitFork,
  ArrowSquareOut,
  ArrowLeft,
} from "@phosphor-icons/react/dist/ssr";
import { getPortfolioUser } from "@/lib/api";
import { formatNumber, getLanguageColor } from "@/lib/utils";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

// Memoize within a single request so generateMetadata and PortfolioPage
// share one fetch instead of making two identical API calls.
const getUser = cache(getPortfolioUser);

interface Props {
  params: Promise<{ username: string }>;
}

/* ── Accent colors map ─────────────────────────────── */
const ACCENT_COLORS: Record<string, { primary: string; ring: string }> = {
  red: { primary: "0 80% 50%", ring: "0 80% 50%" },
  cyan: { primary: "188 85% 48%", ring: "188 85% 48%" },
  emerald: { primary: "152 60% 42%", ring: "152 60% 42%" },
  amber: { primary: "38 90% 50%", ring: "38 90% 50%" },
  rose: { primary: "347 77% 50%", ring: "347 77% 50%" },
  sky: { primary: "200 85% 50%", ring: "200 85% 50%" },
};

const AVAILABILITY_CONFIG = {
  open: {
    label: "OPEN TO WORK",
    color: "text-emerald-400 border-emerald-400/50",
  },
  busy: {
    label: "CURRENTLY BUSY",
    color: "text-amber-400 border-amber-400/50",
  },
  closed: {
    label: "NOT AVAILABLE",
    color: "text-muted-foreground border-border",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUser(username);
  if (!user) return { title: "PORTFOLIO NOT FOUND // INITMYFOLIO" };
  const title = `${(user.displayName ?? user.username).toUpperCase()} // INITMYFOLIO`;
  const description =
    user.bio ??
    `${user.username} — ${user.githubData?.profile?.public_repos ?? 0} repos, ${formatNumber(user.githubData?.totalStars ?? 0)} stars.`;
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

export const revalidate = 3600;

export default async function PortfolioPage({ params }: Props) {
  const { username } = await params;
  const user = await getUser(username);
  if (!user) notFound();

  const settings = user.settings ?? {};
  const hideSections: string[] = settings.hideSections ?? [];
  const allRepos = user.githubData?.repos ?? [];
  const pinnedRepos = settings.pinnedRepos ?? [];
  const maxRepos = settings.maxRepos ?? 8;
  const repoSortBy = settings.repoSortBy ?? "stars";
  const repoDisplayStyle = settings.repoDisplayStyle ?? "table";
  const showTopics = settings.showTopics !== false;
  const showAvatar = settings.showAvatar !== false;
  const heroStyle = settings.heroStyle ?? "name-full";
  const fontStyle = settings.fontStyle ?? "display";
  const accentColor = settings.accentColor;
  const accent = accentColor ? ACCENT_COLORS[accentColor] : null;
  const availability = settings.availability ?? null;
  const aboutText = settings.aboutText ?? "";
  const techStack = settings.techStack ?? [];
  const featuredRepoName = settings.featuredRepo ?? null;

  /* ── Glass flag ──────────────────────────────────── */
  const isGlass = settings.layoutVariant === "glass";

  /* ── Repo sorting ─────────────────────────────── */
  const sortedRepos = (() => {
    if (repoSortBy === "pinned-first") {
      return [
        ...allRepos.filter((r) => pinnedRepos.includes(r.name)),
        ...allRepos
          .filter((r) => !pinnedRepos.includes(r.name))
          .sort((a, b) => b.stargazers_count - a.stargazers_count),
      ];
    }
    if (repoSortBy === "forks")
      return [...allRepos].sort((a, b) => b.forks_count - a.forks_count);
    if (repoSortBy === "updated") return [...allRepos]; // preserve GitHub API order (recently updated)
    // default: stars
    return [...allRepos].sort(
      (a, b) => b.stargazers_count - a.stargazers_count,
    );
  })();

  const featuredRepo = featuredRepoName
    ? (allRepos.find((r) => r.name === featuredRepoName) ?? null)
    : null;
  const displayRepos = sortedRepos
    .filter((r) => r.name !== featuredRepoName)
    .slice(0, maxRepos);

  /* ── Languages ─────────────────────────────────── */
  const totalBytes = Object.values(user.githubData?.languages ?? {}).reduce(
    (a, b) => a + b,
    0,
  );
  const topLanguages = Object.entries(user.githubData?.languages ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([lang, bytes]) => ({
      lang,
      pct: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0",
    }));

  /* ── Section order ─────────────────────────────── */
  const DEFAULT_SECTIONS = [
    "stats",
    "repos",
    "languages",
    "about",
    "stack",
    "links",
  ];
  const rawOrder: string[] = settings.sectionOrder ?? DEFAULT_SECTIONS;
  const sectionOrder = [
    ...rawOrder,
    ...DEFAULT_SECTIONS.filter((s) => !rawOrder.includes(s)),
  ];

  /* ── JSON-LD ───────────────────────────────────── */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.displayName ?? user.username,
    url: `https://${user.username}.initmyfolio.com`,
    image: user.avatarUrl,
    description: user.bio,
    sameAs: [`https://github.com/${user.username}`],
  };

  /* ── Hero name display ─────────────────────────── */
  const rawName = (user.displayName ?? user.username).toUpperCase();
  const displayName = rawName;
  const heroFontClass =
    fontStyle === "mono"
      ? "font-mono"
      : fontStyle === "mixed"
        ? "font-display"
        : "font-display";

  const heroNameContent = (() => {
    if (heroStyle === "name-initials") {
      const initials = displayName
        .split(/[\s_-]+/)
        .map((w) => w[0] ?? "")
        .join("");
      return (
        <span
          className={`${heroFontClass} uppercase tracking-tighter text-foreground leading-[0.85] pb-6 block break-words`}
          style={{ fontSize: "clamp(4rem, 20vw, 20rem)" }}
        >
          {initials}
        </span>
      );
    }
    if (heroStyle === "name-split") {
      return (
        <span
          className="flex flex-wrap pb-6"
          style={{ fontSize: "clamp(2.25rem, 11vw, 11rem)" }}
        >
          {displayName.split("").map((char, i) => (
            <span
              key={i}
              className={`${heroFontClass} uppercase tracking-tighter text-foreground leading-[0.85] inline-block`}
              style={{
                marginTop:
                  char === " " ? undefined : i % 2 === 0 ? "0px" : "8px",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>
      );
    }
    // name-full (default)
    return (
      <h1
        className={`${heroFontClass} uppercase tracking-tighter text-foreground leading-[0.85] pb-6 break-words`}
        style={{ fontSize: "clamp(2.25rem, 11vw, 11rem)" }}
      >
        {displayName}
      </h1>
    );
  })();

  /* ── Tech stack grouped ────────────────────────── */
  const techByCategory: Record<string, string[]> = {};
  for (const item of techStack) {
    const cat = item.category ?? "STACK";
    if (!techByCategory[cat]) techByCategory[cat] = [];
    techByCategory[cat].push(item.name);
  }

  /* ── Section renderers ─────────────────────────── */
  const renderSection = (id: string) => {
    if (hideSections.includes(id)) return null;

    switch (id) {
      case "stats":
        return (
          <div
            key="stats"
            className="border border-border grid grid-cols-2 sm:grid-cols-4 mb-8 pf-section"
          >
            <div className="px-4 py-5 text-center border-r border-b sm:border-b-0 border-border">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-foreground">
                {formatNumber(user.githubData?.profile?.public_repos ?? 0)}
              </div>
              <div className="label mt-1.5 text-[9px] sm:text-[10px]">
                REPOS
              </div>
            </div>
            <div className="px-4 py-5 text-center sm:border-r border-b sm:border-b-0 border-border">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-foreground">
                {formatNumber(user.githubData?.totalStars ?? 0)}
              </div>
              <div className="label mt-1.5 text-[9px] sm:text-[10px]">
                STARS
              </div>
            </div>
            <div className="px-4 py-5 text-center border-r border-border">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-foreground">
                {formatNumber(user.githubData?.totalForks ?? 0)}
              </div>
              <div className="label mt-1.5 text-[9px] sm:text-[10px]">
                FORKS
              </div>
            </div>
            <div className="px-4 py-5 text-center">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-foreground">
                {formatNumber(user.githubData?.profile?.followers ?? 0)}
              </div>
              <div className="label mt-1.5 text-[9px] sm:text-[10px]">
                FOLLOWERS
              </div>
            </div>
          </div>
        );

      case "repos":
        if (allRepos.length === 0 && !featuredRepo) return null;
        return (
          <div key="repos" className="border border-border mb-8 pf-section">
            <div className="border-b border-border px-4 py-2.5 bg-muted flex items-center justify-between">
              <span className="label">[ REPOSITORIES ]</span>
              <span className="label">{allRepos.length} TOTAL</span>
            </div>

            {/* Featured repo */}
            {featuredRepo && (
              <a
                href={featuredRepo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-b border-border bg-muted/30 hover:bg-muted transition-colors group"
              >
                <div className="border-b border-border px-4 py-1.5 flex items-center gap-2">
                  <span className="label text-[9px] tracking-widest">
                    FEATURED
                  </span>
                </div>
                <div className="p-4 border-2 border-border m-3">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="text-sm font-mono font-bold text-primary group-hover:underline truncate">
                      {featuredRepo.name}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star weight="regular" className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono">
                          {formatNumber(featuredRepo.stargazers_count)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork weight="regular" className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono">
                          {formatNumber(featuredRepo.forks_count)}
                        </span>
                      </span>
                    </div>
                  </div>
                  {featuredRepo.description && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {featuredRepo.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {featuredRepo.language && (
                        <span className="flex items-center gap-1 border border-border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                          <span
                            className="w-1.5 h-1.5"
                            style={{
                              backgroundColor: getLanguageColor(
                                featuredRepo.language,
                              ),
                            }}
                          />
                          {featuredRepo.language}
                        </span>
                      )}
                      {featuredRepo.topics.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="border border-border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1.5 label hover:text-foreground transition-colors">
                      <ArrowSquareOut weight="regular" className="w-3 h-3" />
                      VIEW ON GITHUB
                    </span>
                  </div>
                </div>
              </a>
            )}

            {/* Repo list */}
            {displayRepos.length > 0 && repoDisplayStyle === "table" && (
              <>
                <div className="hidden sm:grid grid-cols-[1fr_100px_80px_70px] border-b border-border px-4 py-2 bg-muted/50">
                  <span className="label">NAME</span>
                  <span className="label">LANGUAGE</span>
                  <span className="label text-right">STARS</span>
                  <span className="label text-right">FORKS</span>
                </div>
                {displayRepos.map((repo, i) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block px-4 py-3.5 hover:bg-muted transition-colors ${i < displayRepos.length - 1 ? "border-b border-border" : ""} group sm:grid sm:grid-cols-[1fr_100px_80px_70px] sm:items-center sm:py-3`}
                  >
                    <div className="min-w-0 mb-2 sm:mb-0">
                      <div className="text-sm font-mono font-bold text-primary group-hover:underline truncate">
                        {repo.name}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 sm:contents text-muted-foreground">
                      <div className="flex items-center gap-1.5 sm:col-start-2">
                        {repo.language && (
                          <>
                            <div
                              className="w-2 h-2 shrink-0"
                              style={{
                                backgroundColor: getLanguageColor(
                                  repo.language,
                                ),
                              }}
                            />
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {repo.language}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:justify-end">
                        <Star
                          weight="regular"
                          className="w-3.5 h-3.5 sm:w-3 sm:h-3"
                        />
                        <span className="text-xs sm:text-[10px] font-mono">
                          {formatNumber(repo.stargazers_count)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:justify-end">
                        <GitFork
                          weight="regular"
                          className="w-3.5 h-3.5 sm:w-3 sm:h-3"
                        />
                        <span className="text-xs sm:text-[10px] font-mono">
                          {formatNumber(repo.forks_count)}
                        </span>
                      </div>
                    </div>
                    {showTopics && repo.topics && repo.topics.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap sm:hidden">
                        {repo.topics.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 border border-border text-[9px] font-mono uppercase tracking-wider"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
              </>
            )}

            {displayRepos.length > 0 && repoDisplayStyle === "cards" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
                {displayRepos.map((repo) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-background p-4 hover:bg-muted transition-colors group flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-mono font-bold text-primary group-hover:underline truncate">
                        {repo.name}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star weight="regular" className="w-3 h-3" />
                          <span className="text-[10px] font-mono">
                            {formatNumber(repo.stargazers_count)}
                          </span>
                        </span>
                      </div>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 shrink-0"
                            style={{
                              backgroundColor: getLanguageColor(repo.language),
                            }}
                          />
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {repo.language}
                          </span>
                        </span>
                      )}
                      {showTopics &&
                        repo.topics.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="border border-border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                    </div>
                  </a>
                ))}
              </div>
            )}

            {displayRepos.length > 0 && repoDisplayStyle === "compact" && (
              <div>
                {displayRepos.map((repo, i) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-4 py-1.5 hover:bg-muted transition-colors group ${i < displayRepos.length - 1 ? "border-b border-border" : ""}`}
                  >
                    {repo.language && (
                      <span
                        className="w-2 h-2 shrink-0"
                        style={{
                          backgroundColor: getLanguageColor(repo.language),
                        }}
                      />
                    )}
                    <span className="text-[10px] font-mono text-primary group-hover:underline truncate flex-1">
                      {repo.name}
                    </span>
                    <span className="flex items-center gap-0.5 text-muted-foreground shrink-0">
                      <Star weight="regular" className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-mono">
                        {formatNumber(repo.stargazers_count)}
                      </span>
                    </span>
                    <span className="flex items-center gap-0.5 text-muted-foreground shrink-0">
                      <GitFork weight="regular" className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-mono">
                        {formatNumber(repo.forks_count)}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        );

      case "languages":
        if (topLanguages.length === 0) return null;
        return (
          <div key="languages" className="border border-border mb-8 pf-section">
            <div className="border-b border-border px-4 py-2.5 bg-muted">
              <span className="label">[ LANGUAGE DISTRIBUTION ]</span>
            </div>
            <div>
              <div className="flex w-full h-2.5 border-b border-border">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-border">
                {topLanguages.map(({ lang, pct }, i) => (
                  <div
                    key={lang}
                    className={`flex items-center justify-between px-5 py-3.5 border-b border-border ${i % 2 === 0 ? "sm:border-r" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 shrink-0"
                        style={{ backgroundColor: getLanguageColor(lang) }}
                      />
                      <span className="text-sm font-mono text-foreground">
                        {lang}
                      </span>
                    </div>
                    <span className="font-mono text-xl font-bold text-foreground">
                      {pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "about":
        if (!aboutText) return null;
        return (
          <section key="about" className="border border-border mb-8 pf-section">
            <div className="border-b border-border px-4 py-2.5 bg-muted">
              <span className="label">[ ABOUT ]</span>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch] whitespace-pre-wrap">
                {aboutText}
              </p>
            </div>
          </section>
        );

      case "stack":
        if (techStack.length === 0) return null;
        return (
          <section key="stack" className="border border-border mb-8 pf-section">
            <div className="border-b border-border px-4 py-2.5 bg-muted">
              <span className="label">[ TECH STACK ]</span>
            </div>
            <div className="px-5 py-4">
              {Object.entries(techByCategory).map(([cat, items]) => (
                <div key={cat} className="mb-4 last:mb-0">
                  {Object.keys(techByCategory).length > 1 && (
                    <div className="label text-[9px] tracking-widest mb-2">
                      {cat}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((name) => (
                      <span
                        key={name}
                        className="border border-border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "links":
        if ((settings.customLinks ?? []).length === 0) return null;
        return (
          <section key="links" className="border border-border mb-8 pf-section">
            <div className="border-b border-border px-4 py-2.5 bg-muted">
              <span className="label">[ LINKS ]</span>
            </div>
            <div className="divide-y divide-border">
              {(settings.customLinks ?? []).map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 hover:bg-muted transition-colors group"
                >
                  <ArrowSquareOut
                    weight="regular"
                    className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                  />
                  <span className="label text-foreground group-hover:underline">
                    {link.label}
                  </span>
                  <span className="label text-muted-foreground ml-auto truncate text-right">
                    {link.url.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {accent && (
        <style>{`:root,:root.dark{--primary:${accent.primary};--accent:${accent.primary};--ring:${accent.ring}}`}</style>
      )}

      {isGlass ? (
        /* ══════════════════════════════════════════
           GLASS BENTO LAYOUT
           ══════════════════════════════════════════ */
        <div className="theme-glass min-h-[100dvh]">
          {/* ── NAV */}
          <nav className="pf-glass-nav sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                <ArrowLeft weight="bold" className="w-4 h-4" />
                initmyfolio
              </Link>
              <div className="flex items-center gap-2">
                <a
                  href={`https://github.com/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pf-chip"
                >
                  <GithubLogo weight="fill" className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
                <ThemeToggle />
              </div>
            </div>
          </nav>

          {/* ── BENTO GRID */}
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="pf-bento-grid">
              {/* HERO — full width */}
              <div className="pf-glass-card pf-bento-wide p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
                {showAvatar && user.avatarUrl && (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName ?? user.username}
                    width={88}
                    height={88}
                    className="rounded-2xl ring-2 ring-white/50 dark:ring-white/10 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1.5">
                    {user.displayName ?? user.username}
                  </h1>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 max-w-[55ch]">
                      {user.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {availability && AVAILABILITY_CONFIG[availability] && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${AVAILABILITY_CONFIG[availability].color}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {AVAILABILITY_CONFIG[availability].label.toLowerCase()}
                      </span>
                    )}
                    {user.location && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin weight="fill" className="w-3.5 h-3.5" />
                        {user.location}
                      </span>
                    )}
                    {user.website && (
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Globe weight="fill" className="w-3.5 h-3.5" />
                        {user.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {settings.showEmail && user.email && (
                      <a
                        href={`mailto:${user.email}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <EnvelopeSimple weight="fill" className="w-3.5 h-3.5" />
                        {user.email}
                      </a>
                    )}
                  </div>
                </div>
                <a
                  href={`https://github.com/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pf-chip shrink-0 self-start sm:self-center"
                >
                  <GithubLogo weight="fill" className="w-4 h-4" />
                  View profile
                </a>
              </div>

              {/* STATS — 4 tiles × 3 cols = full row at lg */}
              {!hideSections.includes("stats") &&
                (
                  [
                    {
                      val: formatNumber(
                        user.githubData?.profile?.public_repos ?? 0,
                      ),
                      label: "Repos",
                    },
                    {
                      val: formatNumber(user.githubData?.totalStars ?? 0),
                      label: "Stars",
                    },
                    {
                      val: formatNumber(user.githubData?.totalForks ?? 0),
                      label: "Forks",
                    },
                    {
                      val: formatNumber(
                        user.githubData?.profile?.followers ?? 0,
                      ),
                      label: "Followers",
                    },
                  ] as const
                ).map(({ val, label }) => (
                  <div
                    key={label}
                    className="pf-glass-card pf-bento-3 p-5 flex flex-col justify-between gap-2"
                  >
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-3xl font-bold font-mono text-foreground tracking-tight tabular-nums">
                      {val}
                    </span>
                  </div>
                ))}

              {/* REPOS — 7 cols */}
              {!hideSections.includes("repos") &&
                (allRepos.length > 0 || featuredRepo) && (
                  <div className="pf-glass-card pf-bento-7 overflow-hidden">
                    <div className="px-5 pt-5 pb-3 border-b border-border/40 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        Repositories
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {allRepos.length} total
                      </span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {featuredRepo && (
                        <a
                          href={featuredRepo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/30 dark:hover:bg-white/5 transition-colors group"
                        >
                          <span className="text-[10px] font-semibold text-primary border border-primary/30 bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                            featured
                          </span>
                          {featuredRepo.language && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: getLanguageColor(
                                  featuredRepo.language,
                                ),
                              }}
                            />
                          )}
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate flex-1">
                            {featuredRepo.name}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Star
                              weight="fill"
                              className="w-3 h-3 text-amber-400"
                            />
                            {formatNumber(featuredRepo.stargazers_count)}
                          </span>
                        </a>
                      )}
                      {displayRepos.map((repo) => (
                        <a
                          key={repo.id}
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-5 py-3 hover:bg-white/30 dark:hover:bg-white/5 transition-colors group"
                        >
                          {repo.language && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: getLanguageColor(
                                  repo.language,
                                ),
                              }}
                            />
                          )}
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate flex-1">
                            {repo.name}
                          </span>
                          {repo.description && (
                            <span className="text-xs text-muted-foreground truncate hidden lg:block max-w-[180px]">
                              {repo.description}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Star
                              weight="fill"
                              className="w-3 h-3 text-amber-400"
                            />
                            {formatNumber(repo.stargazers_count)}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {/* LANGUAGES — 5 cols */}
              {!hideSections.includes("languages") &&
                topLanguages.length > 0 && (
                  <div className="pf-glass-card pf-bento-5 p-6">
                    <span className="text-sm font-semibold text-foreground block mb-4">
                      Languages
                    </span>
                    <div className="flex w-full h-2.5 rounded-full overflow-hidden mb-5">
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
                    <div className="space-y-3">
                      {topLanguages.slice(0, 6).map(({ lang, pct }) => (
                        <div key={lang} className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: getLanguageColor(lang) }}
                          />
                          <span className="text-sm text-foreground flex-1 truncate">
                            {lang}
                          </span>
                          <span className="text-sm font-mono font-semibold text-foreground tabular-nums">
                            {pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* ABOUT — 6 cols */}
              {!hideSections.includes("about") && aboutText && (
                <div className="pf-glass-card pf-bento-6 p-6">
                  <span className="text-sm font-semibold text-foreground block mb-3">
                    About
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[55ch] whitespace-pre-wrap">
                    {aboutText}
                  </p>
                </div>
              )}

              {/* TECH STACK — 6 cols */}
              {!hideSections.includes("stack") && techStack.length > 0 && (
                <div className="pf-glass-card pf-bento-6 p-6">
                  <span className="text-sm font-semibold text-foreground block mb-4">
                    Tech stack
                  </span>
                  {Object.entries(techByCategory).map(([cat, items]) => (
                    <div key={cat} className="mb-3 last:mb-0">
                      {Object.keys(techByCategory).length > 1 && (
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {cat}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((name) => (
                          <span
                            key={name}
                            className="px-2.5 py-1 rounded-lg bg-white/50 dark:bg-white/[0.08] border border-white/70 dark:border-white/[0.12] text-xs font-medium text-foreground"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LINKS — full width */}
              {!hideSections.includes("links") &&
                (settings.customLinks ?? []).length > 0 && (
                  <div className="pf-glass-card pf-bento-wide p-6">
                    <span className="text-sm font-semibold text-foreground block mb-4">
                      Links
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {(settings.customLinks ?? []).map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pf-chip hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        >
                          <ArrowSquareOut
                            weight="bold"
                            className="w-3.5 h-3.5"
                          />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </main>

          {/* ── FOOTER */}
          <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 mt-4 flex items-center justify-between flex-wrap gap-4">
            <span className="text-xs text-muted-foreground">
              {user.username}.initmyfolio.com
            </span>
            <Link
              href="https://initmyfolio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Built with initmyfolio
            </Link>
          </footer>
        </div>
      ) : (
        /* ══════════════════════════════════════════
           DEFAULT LAYOUT (brutalist / clean / editorial)
           ══════════════════════════════════════════ */
        <div
          className={`min-h-[100dvh] bg-background${settings.layoutVariant === "brutalist" ? " theme-brutalist" : settings.layoutVariant === "clean" ? " theme-clean" : settings.layoutVariant === "editorial" ? " theme-editorial" : ""}`}
        >
          {/* ── NAV */}
          <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 label hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  INITMYFOLIO
                </Link>
                <span className="label hidden sm:block">///</span>
                <span className="label hidden sm:block text-foreground">
                  {user.username}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://github.com/${user.username}`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors active:scale-[0.98]"
                >
                  <GithubLogo weight="regular" className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">GITHUB</span>
                </a>
                <ThemeToggle />
              </div>
            </div>
          </nav>

          {/* ── HERO */}
          <header className="border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-0">
              <div className="overflow-hidden">{heroNameContent}</div>
              <div className="border-t border-border py-4 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-4 sm:items-center">
                <div className="flex items-start gap-3 sm:contents">
                  {showAvatar && user.avatarUrl && (
                    <Image
                      src={user.avatarUrl}
                      alt={displayName}
                      width={32}
                      height={32}
                      className="rounded-full border border-border shrink-0"
                    />
                  )}
                  <div className="flex flex-col gap-1.5">
                    {user.bio && (
                      <p className="text-xs text-muted-foreground">
                        {user.bio}
                      </p>
                    )}
                    {availability && AVAILABILITY_CONFIG[availability] && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-mono uppercase tracking-widest w-fit ${AVAILABILITY_CONFIG[availability].color}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {AVAILABILITY_CONFIG[availability].label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap sm:ml-auto">
                  {user.location && (
                    <span className="flex items-center gap-1.5 label">
                      <MapPin weight="regular" className="w-3.5 h-3.5" />
                      {user.location}
                    </span>
                  )}
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 label hover:text-foreground transition-colors"
                    >
                      <Globe weight="regular" className="w-3.5 h-3.5" />
                      {user.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {settings.showEmail && user.email && (
                    <a
                      href={`mailto:${user.email}`}
                      className="flex items-center gap-1.5 label hover:text-foreground transition-colors"
                    >
                      <EnvelopeSimple
                        weight="regular"
                        className="w-3.5 h-3.5"
                      />
                      {user.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {sectionOrder.map((id) => renderSection(id))}
          </main>

          <footer className="border-t border-border mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-4">
              <span className="label text-foreground">
                {user.username}.initmyfolio.com
              </span>
              <Link
                href="https://initmyfolio.com"
                target="_blank"
                className="label hover:text-foreground transition-colors"
              >
                POWERED BY INITMYFOLIO
              </Link>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
