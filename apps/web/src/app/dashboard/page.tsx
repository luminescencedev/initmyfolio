"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  GithubLogo,
  MapPin,
  Globe,
  ArrowClockwise,
  ArrowSquareOut,
  Star,
  GitFork,
  ArrowRight,
  SignOut,
  Clock,
  WarningCircle,
  CheckCircle,
  Info,
  Lock,
  Lightning,
  Gear,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import type { PortfolioUser } from "@/lib/api";
import { getCurrentUser, triggerSync } from "@/lib/api";
import { formatNumber, getLanguageColor } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

const ALL_SECTIONS = ["stats", "repos", "languages", "about", "stack", "links"];

const ACCENT_LABELS: Record<string, string> = {
  red: "RED",
  cyan: "CYAN",
  emerald: "EMERALD",
  amber: "AMBER",
  rose: "ROSE",
  sky: "SKY",
};
const ACCENT_DOT: Record<string, string> = {
  red: "bg-[hsl(0_80%_50%)]",
  cyan: "bg-[hsl(188_85%_48%)]",
  emerald: "bg-[hsl(152_60%_42%)]",
  amber: "bg-[hsl(38_90%_50%)]",
  rose: "bg-[hsl(347_77%_50%)]",
  sky: "bg-[hsl(200_85%_50%)]",
};

/* ─── Skeleton row ─── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border animate-pulse">
      <div className="w-32 h-3 bg-muted" />
      <div className="w-16 h-3 bg-muted" />
      <div className="ml-auto w-12 h-3 bg-muted" />
    </div>
  );
}

/* ─── Portfolio preview iframe ─── */
function PortfolioPreview({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <div className="border border-border">
      <div className="border-b border-border px-4 py-2.5 bg-muted flex items-center justify-between">
        <span className="label">[ PORTFOLIO PREVIEW ]</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLoaded(false);
              setKey((k) => k + 1);
            }}
            className="flex items-center gap-1.5 label hover:text-foreground transition-colors active:scale-[0.98]"
          >
            <ArrowsClockwise weight="bold" className="w-3 h-3" />
            <span className="hidden sm:inline">REFRESH</span>
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 label hover:text-foreground transition-colors"
          >
            <ArrowSquareOut weight="regular" className="w-3 h-3" />
            OPEN
          </a>
        </div>
      </div>

      <div
        className="relative w-full overflow-hidden bg-background flex justify-center"
        style={{ height: "480px" }}
      >
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/40 z-10">
            <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground animate-spin" />
            <span className="label text-muted-foreground">
              LOADING PREVIEW…
            </span>
          </div>
        )}
        <iframe
          key={key}
          src={url}
          title="Portfolio preview"
          onLoad={() => setLoaded(true)}
          style={{
            width: "1200px",
            height: "800px",
            transform: "scale(0.6)",
            transformOrigin: "top center",
            border: "none",
            pointerEvents: "none",
            flexShrink: 0,
          }}
        />
      </div>

      <div className="border-t border-border px-4 py-2 flex items-center justify-between gap-4">
        <span className="label text-muted-foreground text-[9px]">
          PREVIEW — CACHE MAY TAKE UP TO 1H TO REFLECT CHANGES
        </span>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 label hover:text-foreground transition-colors shrink-0"
        >
          <Gear weight="regular" className="w-3 h-3" />
          EDIT SETTINGS
        </Link>
      </div>
    </div>
  );
}

/* ─── Settings row ─── */
function SettingRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <span className="label text-muted-foreground">{label}</span>
      <span className="label text-foreground text-right">{value}</span>
    </div>
  );
}

/* ─── Main dashboard content ─── */
function DashboardContent() {
  const [user, setUser] = useState<PortfolioUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    text: string;
    type: "success" | "error" | "warn";
  } | null>(null);
  const [syncAvailableAt, setSyncAvailableAt] = useState<Date | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlToken = searchParams.get("token");
    const storedToken = localStorage.getItem("auth_token");
    const activeToken = urlToken ?? storedToken;
    if (!activeToken) {
      router.push("/login");
      return;
    }
    if (urlToken) {
      localStorage.setItem("auth_token", urlToken);
      router.replace("/dashboard");
    }
    setToken(activeToken);
    getCurrentUser(activeToken).then((u) => {
      setLoading(false);
      if (!u) {
        localStorage.removeItem("auth_token");
        router.push("/login");
        return;
      }
      setUser(u);
    });
  }, [router, searchParams]);

  const syncCooldownMs = 5 * 60 * 1000;
  const canSync =
    !isSyncing &&
    !syncAvailableAt &&
    (!user?.lastSyncedAt ||
      Date.now() - new Date(user.lastSyncedAt).getTime() > syncCooldownMs);

  const handleSync = async () => {
    if (!token || !user || !canSync) return;
    setIsSyncing(true);
    setSyncMessage(null);
    const result = await triggerSync(token, user.username);
    setIsSyncing(false);
    if (result.ok) {
      setSyncMessage({
        text: "SYNC COMPLETE — DATA UPDATED.",
        type: "success",
      });
      const updated = await getCurrentUser(token);
      if (updated) setUser(updated);
    } else if (result.rateLimited && result.availableAt) {
      setSyncAvailableAt(result.availableAt);
      const mins = Math.ceil((result.retryAfter ?? 300) / 60);
      setSyncMessage({
        text: `RATE LIMITED — NEXT SYNC IN ${mins}M.`,
        type: "warn",
      });
    } else {
      setSyncMessage({ text: "SYNC FAILED. PLEASE RETRY.", type: "error" });
    }
  };

  const portfolioUrl = user
    ? APP_URL.includes("localhost")
      ? `${APP_URL}/${user.username}`
      : `https://${user.username}.initmyfolio.com`
    : "#";

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <header className="border-b border-border h-12 bg-background" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="border border-border">
            <div className="border-b border-border p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="w-40 h-4 bg-muted" />
                  <div className="w-24 h-3 bg-muted" />
                </div>
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const s = user.settings ?? {};
  const topRepos = [...(user.githubData?.repos ?? [])]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 8);
  const totalBytes = Object.values(user.githubData?.languages ?? {}).reduce(
    (a, b) => a + b,
    0,
  );
  const topLanguages = Object.entries(user.githubData?.languages ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([lang, bytes]) => ({
      lang,
      pct: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0",
    }));
  const visibleSections = ALL_SECTIONS.filter(
    (sec) => !(s.hideSections ?? []).includes(sec),
  );

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── HEADER ─────────────────────────────── */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-display text-sm uppercase tracking-tighter text-foreground">
              INITMYFOLIO
            </span>
            <div className="hidden sm:flex items-center gap-1 border border-border px-2 py-1 bg-muted">
              <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full" />
              <span className="label">FREE TIER</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors active:scale-[0.98]"
            >
              <Gear weight="regular" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SETTINGS</span>
            </Link>
            <Link
              href={portfolioUrl}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors active:scale-[0.98]"
            >
              <ArrowSquareOut weight="regular" className="w-3.5 h-3.5" />
              VIEW PORTFOLIO
            </Link>
            <ThemeToggle />
            <button
              onClick={() => {
                localStorage.removeItem("auth_token");
                router.push("/");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors active:scale-[0.98]"
            >
              <SignOut weight="regular" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SIGN OUT</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── PROFILE ─────────────────────────── */}
        <div className="border border-border mb-0">
          <div className="border-b border-border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  width={48}
                  height={48}
                  className="rounded-full border border-border shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border border-border bg-muted flex items-center justify-center shrink-0">
                  <GithubLogo className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-display uppercase tracking-tighter text-foreground text-xl truncate">
                  {user.displayName ?? user.username}
                </div>
                <div className="label mt-0.5">@{user.username}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSync}
                disabled={!canSync}
                title={
                  !canSync && syncAvailableAt
                    ? `AVAILABLE AT ${syncAvailableAt.toLocaleTimeString()}`
                    : undefined
                }
                className="flex items-center gap-1.5 px-3 py-2 border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowClockwise
                  weight="bold"
                  className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
                />
                {isSyncing ? "SYNCING…" : "SYNC NOW"}
              </button>
            </div>
          </div>

          {(user.bio || user.location || user.website || user.lastSyncedAt) && (
            <div className="border-b border-border px-5 py-3 space-y-2">
              {user.bio && (
                <p className="text-xs text-muted-foreground">{user.bio}</p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
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
                    className="flex items-center gap-1.5 label hover:text-foreground transition-colors"
                  >
                    <Globe weight="regular" className="w-3.5 h-3.5" />
                    {user.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {user.lastSyncedAt && (
                  <span className="flex items-center gap-1.5 label">
                    <Clock weight="regular" className="w-3.5 h-3.5" />
                    SYNCED {new Date(user.lastSyncedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {syncMessage && (
            <div
              className={`px-5 py-2.5 border-b border-border flex items-center gap-2.5 ${
                syncMessage.type === "success"
                  ? "bg-foreground/5"
                  : syncMessage.type === "warn"
                    ? "bg-primary/5"
                    : "bg-primary/10"
              }`}
            >
              {syncMessage.type === "success" ? (
                <CheckCircle
                  weight="fill"
                  className="w-3.5 h-3.5 text-foreground shrink-0"
                />
              ) : syncMessage.type === "warn" ? (
                <Info
                  weight="fill"
                  className="w-3.5 h-3.5 text-primary shrink-0"
                />
              ) : (
                <WarningCircle
                  weight="fill"
                  className="w-3.5 h-3.5 text-primary shrink-0"
                />
              )}
              <span className="label text-foreground">{syncMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            {[
              {
                label: "REPOSITORIES",
                value: user.githubData?.profile?.public_repos ?? 0,
              },
              { label: "TOTAL STARS", value: user.githubData?.totalStars ?? 0 },
              { label: "TOTAL FORKS", value: user.githubData?.totalForks ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="px-5 py-4 text-center">
                <div className="font-mono text-2xl font-bold text-foreground">
                  {formatNumber(stat.value)}
                </div>
                <div className="label mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="label mb-0.5">YOUR PORTFOLIO</div>
              <a
                href={portfolioUrl}
                target="_blank"
                className="text-xs font-mono text-primary hover:underline underline-offset-2 break-all"
              >
                {portfolioUrl}
              </a>
            </div>
            <a
              href={portfolioUrl}
              target="_blank"
              className="flex items-center gap-1.5 label hover:text-foreground transition-colors shrink-0"
            >
              <ArrowSquareOut weight="regular" className="w-3.5 h-3.5" />
              OPEN
            </a>
          </div>
        </div>

        {/* ── PORTFOLIO PREVIEW ──────────────── */}
        <PortfolioPreview url={portfolioUrl} />

        {/* ── MAIN GRID ─────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_280px] border-l border-r border-b border-border">
          {/* Repos */}
          <div className="lg:border-r border-border">
            <div className="border-b border-border px-4 py-2.5 flex items-center justify-between bg-muted">
              <span className="label">[ REPOSITORIES ]</span>
              <span className="label">
                {user.githubData?.profile?.public_repos ?? 0} TOTAL
              </span>
            </div>

            {topRepos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <GithubLogo
                  weight="thin"
                  className="w-10 h-10 text-muted-foreground/30 mb-4"
                />
                <div className="label mb-2">NO REPOSITORIES FOUND</div>
                <div className="text-xs text-muted-foreground mb-4">
                  TRIGGER A SYNC TO FETCH YOUR DATA
                </div>
                <button
                  onClick={handleSync}
                  disabled={!canSync}
                  className="flex items-center gap-2 px-4 py-2 border border-border text-[11px] font-mono uppercase tracking-wider hover:border-foreground transition-colors disabled:opacity-40"
                >
                  <ArrowClockwise weight="bold" className="w-3.5 h-3.5" />
                  SYNC NOW
                </button>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[1fr_80px_60px_60px] border-b border-border px-4 py-2 bg-muted/50">
                  <span className="label">NAME</span>
                  <span className="label">LANG</span>
                  <span className="label text-right">STARS</span>
                  <span className="label text-right">FORKS</span>
                </div>
                {topRepos.map((repo, i) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    className={`block px-4 py-3 hover:bg-muted transition-colors ${i < topRepos.length - 1 ? "border-b border-border" : ""} group sm:grid sm:grid-cols-[1fr_80px_60px_60px] sm:items-center`}
                  >
                    <div className="min-w-0 mb-1.5 sm:mb-0">
                      <div className="text-xs font-mono text-primary group-hover:underline truncate">
                        {repo.name}
                      </div>
                      {repo.description && (
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {repo.description}
                        </div>
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
                            <span className="text-[10px] font-mono text-muted-foreground truncate">
                              {repo.language}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:justify-end">
                        <Star weight="regular" className="w-3 h-3" />
                        <span className="text-[10px] font-mono">
                          {formatNumber(repo.stargazers_count)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:justify-end">
                        <GitFork weight="regular" className="w-3 h-3" />
                        <span className="text-[10px] font-mono">
                          {formatNumber(repo.forks_count)}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col">
            {/* Languages */}
            <div className="border-b border-border">
              <div className="border-b border-border px-4 py-2.5 bg-muted">
                <span className="label">[ LANGUAGES ]</span>
              </div>
              {topLanguages.length > 0 ? (
                <div className="p-4">
                  <div className="flex h-1.5 w-full mb-4">
                    {topLanguages.map(({ lang, pct }) => (
                      <div
                        key={lang}
                        style={{
                          width: `${pct}%`,
                          backgroundColor: getLanguageColor(lang),
                        }}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {topLanguages.map(({ lang, pct }) => (
                      <div
                        key={lang}
                        className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 shrink-0"
                            style={{ backgroundColor: getLanguageColor(lang) }}
                          />
                          <span className="text-[11px] font-mono text-foreground">
                            {lang}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="label">NO DATA YET</div>
                </div>
              )}
            </div>

            {/* Settings summary */}
            <div className="border-b border-border">
              <div className="border-b border-border px-4 py-2.5 bg-muted">
                <span className="label">[ PORTFOLIO SETTINGS ]</span>
              </div>
              <div className="divide-y divide-border">
                <SettingRow
                  label="ACCENT"
                  value={
                    s.accentColor ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 shrink-0 ${ACCENT_DOT[s.accentColor] ?? "bg-foreground"}`}
                        />
                        {ACCENT_LABELS[s.accentColor] ??
                          s.accentColor.toUpperCase()}
                      </span>
                    ) : (
                      "DEFAULT"
                    )
                  }
                />
                <SettingRow
                  label="LAYOUT"
                  value={(s.layoutVariant ?? "BRUTALIST").toUpperCase()}
                />
                <SettingRow
                  label="HERO STYLE"
                  value={(s.heroStyle ?? "NAME-FULL").toUpperCase()}
                />
                <SettingRow
                  label="AVAILABILITY"
                  value={s.availability ? s.availability.toUpperCase() : "NONE"}
                />
                <SettingRow label="MAX REPOS" value={String(s.maxRepos ?? 8)} />
                <SettingRow
                  label="DISPLAY"
                  value={(s.repoDisplayStyle ?? "TABLE").toUpperCase()}
                />
                <SettingRow
                  label="SECTIONS"
                  value={`${visibleSections.length} / ${ALL_SECTIONS.length}`}
                />
                {(s.techStack ?? []).length > 0 && (
                  <SettingRow
                    label="TECH STACK"
                    value={`${s.techStack!.length} ITEMS`}
                  />
                )}
              </div>
              <div className="p-3">
                <Link
                  href="/settings"
                  className="w-full flex items-center justify-between px-3 py-2.5 border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2">
                    <Gear weight="regular" className="w-3.5 h-3.5" />
                    EDIT ALL SETTINGS
                  </div>
                  <ArrowRight
                    weight="bold"
                    className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            </div>

            {/* PRO */}
            <div className="border-b border-border">
              <div className="border-b border-border px-4 py-2.5 bg-muted flex items-center justify-between">
                <span className="label">[ PRO FEATURES ]</span>
                <span className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div className="p-4 space-y-2.5">
                {[
                  "CUSTOM DOMAIN",
                  "CUSTOM THEMES",
                  "ANALYTICS",
                  "PRIORITY SYNC",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 opacity-50">
                    <Lock
                      weight="bold"
                      className="w-3 h-3 text-primary shrink-0"
                    />
                    <span className="label">{f}</span>
                  </div>
                ))}
                <Link
                  href="#"
                  className="mt-3 w-full flex items-center justify-between px-3 py-2.5 border border-primary bg-primary/5 text-[11px] font-mono uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Lightning weight="bold" className="w-3.5 h-3.5" />
                    UPGRADE — $7/MO
                  </div>
                  <ArrowRight
                    weight="bold"
                    className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
                <p className="label text-center">LAUNCHING SOON</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
