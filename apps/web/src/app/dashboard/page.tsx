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

const ACCENT_DOT: Record<string, string> = {
  red: "bg-[hsl(0_80%_50%)]",
  cyan: "bg-[hsl(188_85%_48%)]",
  emerald: "bg-[hsl(152_60%_42%)]",
  amber: "bg-[hsl(38_90%_50%)]",
  rose: "bg-[hsl(347_77%_50%)]",
  sky: "bg-[hsl(200_85%_50%)]",
};
const ACCENT_LABELS: Record<string, string> = {
  red: "Red", cyan: "Cyan", emerald: "Emerald",
  amber: "Amber", rose: "Rose", sky: "Sky",
};

/* ─── Skeleton ─── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
      <div className="w-32 h-3 bg-muted rounded mb-3" />
      <div className="w-full h-5 bg-muted rounded mb-2" />
      <div className="w-2/3 h-4 bg-muted rounded" />
    </div>
  );
}

/* ─── Portfolio preview iframe ─── */
function PortfolioPreview({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
      {/* Browser bar */}
      <div className="border-b border-border px-4 py-3 bg-secondary/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <div className="flex-1 bg-background rounded-lg px-3 py-1 border border-border/60">
          <span className="text-[11px] font-mono text-muted-foreground truncate block">{url.replace(/^https?:\/\//, "")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setLoaded(false); setKey(k => k + 1); }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowsClockwise weight="bold" className="w-3.5 h-3.5" />
          </button>
          <a
            href={url} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowSquareOut weight="regular" className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="relative w-full overflow-hidden bg-background flex justify-center" style={{ height: "480px" }}>
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 z-10 backdrop-blur-sm">
            <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Loading preview…</span>
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

      <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-between gap-4 bg-secondary/20">
        <span className="text-[10px] text-muted-foreground/60 font-mono">
          Preview — cache may take up to 1h to reflect changes
        </span>
        <Link href="/settings" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <Gear weight="regular" className="w-3.5 h-3.5" />
          Edit settings
        </Link>
      </div>
    </div>
  );
}

/* ─── Main dashboard content ─── */
function DashboardContent() {
  const [user, setUser] = useState<PortfolioUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" | "warn" } | null>(null);
  const [syncAvailableAt, setSyncAvailableAt] = useState<Date | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlToken = searchParams.get("token");
    const storedToken = localStorage.getItem("auth_token");
    const activeToken = urlToken ?? storedToken;
    if (!activeToken) { router.push("/login"); return; }
    if (urlToken) {
      localStorage.setItem("auth_token", urlToken);
      router.replace("/dashboard");
    }
    setToken(activeToken);
    getCurrentUser(activeToken).then(u => {
      setLoading(false);
      if (!u) { localStorage.removeItem("auth_token"); router.push("/login"); return; }
      setUser(u);
    });
  }, [router, searchParams]);

  const syncCooldownMs = 5 * 60 * 1000;
  const canSync = !isSyncing && !syncAvailableAt && (!user?.lastSyncedAt || Date.now() - new Date(user.lastSyncedAt).getTime() > syncCooldownMs);

  const handleSync = async () => {
    if (!token || !user || !canSync) return;
    setIsSyncing(true);
    setSyncMessage(null);
    const result = await triggerSync(token, user.username);
    setIsSyncing(false);
    if (result.ok) {
      setSyncMessage({ text: "Sync complete — data updated.", type: "success" });
      const updated = await getCurrentUser(token);
      if (updated) setUser(updated);
    } else if (result.rateLimited && result.availableAt) {
      setSyncAvailableAt(result.availableAt);
      const mins = Math.ceil((result.retryAfter ?? 300) / 60);
      setSyncMessage({ text: `Rate limited — next sync in ${mins}m.`, type: "warn" });
    } else {
      setSyncMessage({ text: "Sync failed. Please retry.", type: "error" });
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
        <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl" />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </main>
      </div>
    );
  }
  if (!user) return null;

  const s = user.settings ?? {};
  const topRepos = [...(user.githubData?.repos ?? [])].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 8);
  const totalBytes = Object.values(user.githubData?.languages ?? {}).reduce((a, b) => a + b, 0);
  const topLanguages = Object.entries(user.githubData?.languages ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([lang, bytes]) => ({ lang, pct: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0" }));
  const visibleSections = ALL_SECTIONS.filter(sec => !(s.hideSections ?? []).includes(sec));

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold text-sm text-foreground">InitMyFolio</Link>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border/60 text-xs font-medium text-muted-foreground">
              Free tier
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <Gear weight="regular" className="w-3.5 h-3.5" />
              Settings
            </Link>
            <a
              href={portfolioUrl} target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <ArrowSquareOut weight="regular" className="w-3.5 h-3.5" />
              Portfolio
            </a>
            <ThemeToggle />
            <button
              onClick={() => { localStorage.removeItem("auth_token"); router.push("/"); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <SignOut weight="regular" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* ── PROFILE CARD ────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          {/* Profile top */}
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.username} width={52} height={52} className="rounded-full border-2 border-border shrink-0" />
              ) : (
                <div className="w-13 h-13 rounded-full border-2 border-border bg-secondary flex items-center justify-center shrink-0">
                  <GithubLogo className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-lg text-foreground tracking-tight truncate">
                  {user.displayName ?? user.username}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">@{user.username}</div>
                {(user.bio || user.location || user.website) && (
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {user.bio && <p className="text-xs text-muted-foreground truncate max-w-[40ch]">{user.bio}</p>}
                    {user.location && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin weight="regular" className="w-3 h-3" />{user.location}
                      </span>
                    )}
                    {user.website && (
                      <a href={user.website} target="_blank" className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Globe weight="regular" className="w-3 h-3" />{user.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {user.lastSyncedAt && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock weight="regular" className="w-3 h-3" />
                  Synced {new Date(user.lastSyncedAt).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleSync} disabled={!canSync}
                title={!canSync && syncAvailableAt ? `Available at ${syncAvailableAt.toLocaleTimeString()}` : undefined}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowClockwise weight="bold" className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing…" : "Sync now"}
              </button>
            </div>
          </div>

          {/* Sync message */}
          {syncMessage && (
            <div className={`px-6 py-3 border-t border-border/60 flex items-center gap-2.5 ${
              syncMessage.type === "success" ? "bg-emerald-500/5" : syncMessage.type === "warn" ? "bg-amber-500/5" : "bg-red-500/5"
            }`}>
              {syncMessage.type === "success" ? (
                <CheckCircle weight="fill" className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : syncMessage.type === "warn" ? (
                <Info weight="fill" className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <WarningCircle weight="fill" className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <span className="text-sm text-foreground">{syncMessage.text}</span>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-border/60 border-t border-border/60">
            {[
              { label: "Repositories", value: user.githubData?.profile?.public_repos ?? 0 },
              { label: "Total stars", value: user.githubData?.totalStars ?? 0 },
              { label: "Total forks", value: user.githubData?.totalForks ?? 0 },
            ].map(stat => (
              <div key={stat.label} className="px-6 py-5 text-center">
                <div className="font-mono text-2xl font-bold text-foreground">{formatNumber(stat.value)}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Portfolio URL */}
          <div className="px-6 py-4 border-t border-border/60 bg-secondary/20 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground mb-1">Your portfolio</div>
              <a href={portfolioUrl} target="_blank" className="text-sm font-medium text-primary hover:underline break-all">
                {portfolioUrl}
              </a>
            </div>
            <a href={portfolioUrl} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0">
              <ArrowSquareOut weight="regular" className="w-3.5 h-3.5" />
              Open
            </a>
          </div>
        </div>

        {/* ── PORTFOLIO PREVIEW ───────────────────────────── */}
        <PortfolioPreview url={portfolioUrl} />

        {/* ── MAIN GRID ───────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          {/* Repos */}
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">Repositories</span>
              <span className="text-xs text-muted-foreground">{user.githubData?.profile?.public_repos ?? 0} total</span>
            </div>

            {topRepos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <GithubLogo weight="thin" className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium text-foreground mb-1">No repositories found</div>
                <div className="text-xs text-muted-foreground mb-5">Trigger a sync to fetch your data</div>
                <button
                  onClick={handleSync} disabled={!canSync}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-40"
                >
                  <ArrowClockwise weight="bold" className="w-3.5 h-3.5" />
                  Sync now
                </button>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[1fr_80px_60px_60px] border-b border-border/60 px-5 py-2.5 bg-secondary/30">
                  {["Name", "Lang", "Stars", "Forks"].map(h => (
                    <span key={h} className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider last:text-right [&:nth-child(3)]:text-right">{h}</span>
                  ))}
                </div>
                {topRepos.map((repo, i) => (
                  <a
                    key={repo.id}
                    href={repo.html_url} target="_blank"
                    className={`block px-5 py-3 hover:bg-secondary/40 transition-colors ${i < topRepos.length - 1 ? "border-b border-border/60" : ""} group sm:grid sm:grid-cols-[1fr_80px_60px_60px] sm:items-center`}
                  >
                    <div className="min-w-0 mb-1 sm:mb-0">
                      <div className="text-sm font-medium text-primary group-hover:underline truncate">{repo.name}</div>
                      {repo.description && <div className="text-xs text-muted-foreground truncate mt-0.5">{repo.description}</div>}
                    </div>
                    <div className="flex items-center gap-3 sm:contents text-muted-foreground">
                      <div className="flex items-center gap-1.5 sm:col-start-2">
                        {repo.language && (
                          <>
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                            <span className="text-xs text-muted-foreground truncate">{repo.language}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:justify-end">
                        <Star weight="regular" className="w-3 h-3" />
                        <span className="text-xs font-mono">{formatNumber(repo.stargazers_count)}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:justify-end">
                        <GitFork weight="regular" className="w-3 h-3" />
                        <span className="text-xs font-mono">{formatNumber(repo.forks_count)}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            {/* Languages */}
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60">
                <span className="font-semibold text-sm text-foreground">Languages</span>
              </div>
              {topLanguages.length > 0 ? (
                <div className="p-5">
                  <div className="h-2 rounded-full overflow-hidden flex gap-px mb-4">
                    {topLanguages.map(({ lang, pct }) => (
                      <div key={lang} className="first:rounded-l-full last:rounded-r-full" style={{ width: `${pct}%`, backgroundColor: getLanguageColor(lang) }} />
                    ))}
                  </div>
                  <div className="space-y-2.5">
                    {topLanguages.map(({ lang, pct }) => (
                      <div key={lang} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getLanguageColor(lang) }} />
                          <span className="text-sm text-foreground">{lang}</span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">No data yet</div>
              )}
            </div>

            {/* Settings summary */}
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60">
                <span className="font-semibold text-sm text-foreground">Portfolio settings</span>
              </div>
              <div className="divide-y divide-border/60">
                {[
                  ["Accent", s.accentColor ? (
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${ACCENT_DOT[s.accentColor] ?? "bg-foreground"}`} />
                      {ACCENT_LABELS[s.accentColor] ?? s.accentColor}
                    </span>
                  ) : "Default"],
                  ["Layout", (s.layoutVariant ?? "Brutalist")],
                  ["Availability", s.availability ?? "None"],
                  ["Max repos", String(s.maxRepos ?? 8)],
                  ["Sections", `${visibleSections.length} / ${ALL_SECTIONS.length} visible`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between px-5 py-3">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border/60">
                <Link
                  href="/settings"
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-sm font-medium text-foreground hover:bg-secondary transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Gear weight="regular" className="w-3.5 h-3.5 text-muted-foreground" />
                    Edit all settings
                  </div>
                  <ArrowRight weight="bold" className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Pro features */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/8 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-primary/15 flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">Pro features</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold tracking-wide">
                  <Lightning weight="fill" className="w-2.5 h-2.5" />
                  Soon
                </span>
              </div>
              <div className="p-5 space-y-3">
                {["Custom domain", "Custom themes", "Analytics dashboard", "Priority sync"].map(f => (
                  <div key={f} className="flex items-center gap-2.5 opacity-50">
                    <Lock weight="regular" className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
                <Link
                  href="#"
                  className="mt-2 flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Lightning weight="bold" className="w-3.5 h-3.5" />
                    Upgrade — $7/mo
                  </div>
                  <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <p className="text-xs text-center text-muted-foreground pt-1">Launching soon</p>
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
