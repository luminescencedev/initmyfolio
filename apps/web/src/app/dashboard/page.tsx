"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  GithubLogo, MapPin, Globe, ArrowClockwise, ArrowSquareOut,
  Star, GitFork, Code, SignOut, Clock, WarningCircle, CheckCircle, Info
} from "@phosphor-icons/react";
import type { PortfolioUser } from "@/lib/api";
import { getCurrentUser, triggerSync } from "@/lib/api";
import { formatNumber, getLanguageColor } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-2xl animate-pulse ${className}`}>
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
        </div>
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

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
    if (urlToken) { localStorage.setItem("auth_token", urlToken); router.replace("/dashboard"); }
    setToken(activeToken);
    getCurrentUser(activeToken).then((u) => {
      setLoading(false);
      if (!u) { localStorage.removeItem("auth_token"); router.push("/login"); return; }
      setUser(u);
    });
  }, [router, searchParams]);

  const syncCooldownMs = 5 * 60 * 1000;
  const canSync = !isSyncing && !syncAvailableAt &&
    (!user?.lastSyncedAt || Date.now() - new Date(user.lastSyncedAt).getTime() > syncCooldownMs);

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
      setSyncMessage({ text: `Rate limited — next sync available in ${mins} min.`, type: "warn" });
    } else {
      setSyncMessage({ text: "Sync failed. Please try again.", type: "error" });
    }
  };

  const portfolioUrl = user
    ? APP_URL.includes("localhost") ? `${APP_URL}/${user.username}` : `https://${user.username}.initmyfolio.com`
    : "#";

  // Skeleton state
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <header className="border-b border-border h-14 bg-background" />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
          <SkeletonCard />
          <div className="grid grid-cols-3 gap-4">
            {[0,1,2].map(i => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const topRepos = [...(user.githubData?.repos ?? [])].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
  const totalBytes = Object.values(user.githubData?.languages ?? {}).reduce((a, b) => a + b, 0);
  const topLanguages = Object.entries(user.githubData?.languages ?? {})
    .sort(([, a], [, b]) => b - a).slice(0, 8)
    .map(([lang, bytes]) => ({ lang, pct: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0" }));

  const SyncIcon = () => (
    <span className={`inline-block ${isSyncing ? "animate-spin" : ""}`}>
      <ArrowClockwise weight="bold" className="w-3.5 h-3.5" />
    </span>
  );

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Code weight="bold" className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">InitMyFolio</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={portfolioUrl} target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-all duration-200 active:scale-[0.98]">
              <ArrowSquareOut weight="regular" className="w-3.5 h-3.5" />
              View portfolio
            </Link>
            <ThemeToggle />
            <button
              onClick={() => { localStorage.removeItem("auth_token"); router.push("/"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-all duration-200 active:scale-[0.98]"
            >
              <SignOut weight="regular" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.displayName ?? user.username}
                width={64} height={64} className="rounded-full ring-2 ring-border shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted shrink-0 flex items-center justify-center">
                <GithubLogo className="w-8 h-8 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div>
                  <h1 className="text-lg font-bold text-foreground tracking-tight">{user.displayName ?? user.username}</h1>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleSync} disabled={!canSync}
                    title={!canSync && syncAvailableAt ? `Available at ${syncAvailableAt.toLocaleTimeString()}` : undefined}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg bg-background hover:bg-muted text-foreground transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
                    <SyncIcon />
                    {isSyncing ? "Syncing…" : "Sync"}
                  </button>
                </div>
              </div>

              {user.bio && <p className="text-sm text-muted-foreground mb-3 max-w-prose">{user.bio}</p>}

              <div className="flex flex-wrap gap-4">
                {user.location && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin weight="regular" className="w-3.5 h-3.5" />{user.location}
                  </span>
                )}
                {user.website && (
                  <a href={user.website} target="_blank"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Globe weight="regular" className="w-3.5 h-3.5" />
                    {user.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <a href={`https://github.com/${user.username}`} target="_blank"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <GithubLogo weight="regular" className="w-3.5 h-3.5" />
                  github.com/{user.username}
                </a>
                {user.lastSyncedAt && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock weight="regular" className="w-3.5 h-3.5" />
                    Synced {new Date(user.lastSyncedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {syncMessage && (
            <div className={`mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border ${
              syncMessage.type === "success" ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" :
              syncMessage.type === "warn" ? "bg-amber-500/8 border-amber-500/20 text-amber-700 dark:text-amber-400" :
              "bg-destructive/8 border-destructive/20 text-destructive"
            }`}>
              {syncMessage.type === "success" ? <CheckCircle weight="fill" className="w-4 h-4 mt-0.5 shrink-0" /> :
               syncMessage.type === "warn" ? <Info weight="fill" className="w-4 h-4 mt-0.5 shrink-0" /> :
               <WarningCircle weight="fill" className="w-4 h-4 mt-0.5 shrink-0" />}
              {syncMessage.text}
            </div>
          )}
        </div>

        {/* Stats — horizontal dividers instead of boxed cards at density 4 */}
        <div className="bg-card border border-border rounded-2xl divide-x divide-border grid grid-cols-3">
          {[
            { label: "Repositories", value: user.githubData?.profile?.public_repos ?? 0 },
            { label: "Total stars", value: user.githubData?.totalStars ?? 0 },
            { label: "Total forks", value: user.githubData?.totalForks ?? 0 },
          ].map((s) => (
            <div key={s.label} className="px-4 py-5 text-center">
              <div className="text-xl font-bold text-foreground font-mono">{formatNumber(s.value)}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main grid: repos + sidebar */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          {/* Repos */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top repositories</h2>
            {topRepos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 border border-dashed border-border rounded-2xl text-center">
                <GithubLogo weight="thin" className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No repositories found</p>
                <p className="text-xs text-muted-foreground mt-1">Try syncing your data</p>
                <button onClick={handleSync} disabled={!canSync}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 text-xs border border-border rounded-lg bg-background hover:bg-muted transition-colors active:scale-[0.98] disabled:opacity-40">
                  <ArrowClockwise weight="bold" className="w-3.5 h-3.5" />
                  Sync now
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {topRepos.map((repo) => (
                  <a key={repo.id} href={repo.html_url} target="_blank"
                    className="flex items-start justify-between gap-3 p-4 bg-card border border-border rounded-xl hover:border-border/70 hover:bg-muted/30 transition-all duration-200 group">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-primary group-hover:underline truncate">{repo.name}</div>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{repo.description}</p>
                      )}
                      {repo.language && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                          <span className="text-xs text-muted-foreground">{repo.language}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                      <span className="flex items-center gap-1 text-xs">
                        <Star weight="regular" className="w-3.5 h-3.5" />{formatNumber(repo.stargazers_count)}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <GitFork weight="regular" className="w-3.5 h-3.5" />{formatNumber(repo.forks_count)}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Languages */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Languages</h2>
              {topLanguages.length > 0 ? (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex rounded-full overflow-hidden h-1.5 mb-4">
                    {topLanguages.map(({ lang, pct }) => (
                      <div key={lang} style={{ width: `${pct}%`, backgroundColor: getLanguageColor(lang) }} />
                    ))}
                  </div>
                  <div className="space-y-2.5">
                    {topLanguages.map(({ lang, pct }) => (
                      <div key={lang} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getLanguageColor(lang) }} />
                          <span className="text-xs text-foreground">{lang}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">No language data yet</p>
                </div>
              )}
            </div>

            {/* Portfolio URL */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your portfolio</p>
              <a href={portfolioUrl} target="_blank"
                className="text-xs text-primary hover:underline break-all font-mono">{portfolioUrl}</a>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Refreshes automatically every hour.
              </p>
              <a href={portfolioUrl} target="_blank"
                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 border border-border rounded-lg text-xs text-foreground hover:bg-muted transition-colors active:scale-[0.98]">
                <ArrowSquareOut weight="regular" className="w-3.5 h-3.5" />
                Open portfolio
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}
