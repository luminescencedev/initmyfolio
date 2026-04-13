"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Github,
  MapPin,
  Globe,
  RefreshCw,
  ExternalLink,
  Star,
  GitFork,
  Code2,
  Settings,
  LogOut,
} from "lucide-react";
import type { PortfolioUser } from "@/lib/api";
import { getCurrentUser, triggerSync } from "@/lib/api";
import { formatNumber, getLanguageColor } from "@/lib/utils";

const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

function DashboardContent() {
  const [user, setUser] = useState<PortfolioUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" | "warn" } | null>(null);
  const [syncAvailableAt, setSyncAvailableAt] = useState<Date | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get token from URL params (after OAuth callback) or localStorage
    const urlToken = searchParams.get("token");
    const storedToken = localStorage.getItem("auth_token");
    const activeToken = urlToken ?? storedToken;

    if (!activeToken) {
      router.push("/login");
      return;
    }

    if (urlToken) {
      localStorage.setItem("auth_token", urlToken);
      // Remove token from URL
      router.replace("/dashboard");
    }

    setToken(activeToken);

    getCurrentUser(activeToken).then((u) => {
      if (!u) {
        localStorage.removeItem("auth_token");
        router.push("/login");
        return;
      }
      setUser(u);
    });
  }, [router, searchParams]);

  // Compute whether sync is available based on lastSyncedAt
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
      setSyncMessage({ text: "Sync complete! Data updated.", type: "success" });
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

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  const topRepos = [...(user.githubData?.repos ?? [])]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);

  const totalBytes = Object.values(user.githubData?.languages ?? {}).reduce(
    (a, b) => a + b,
    0
  );

  const topLanguages = Object.entries(user.githubData?.languages ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([lang, bytes]) => ({
      lang,
      pct: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0",
    }));

  const portfolioUrl = APP_URL.includes("localhost")
    ? `${APP_URL}/${user.username}` // Dev mode
    : `https://${user.username}.initmyfolio.com`;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">InitMyFolio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={portfolioUrl}
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View portfolio
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Profile banner */}
        <div className="bg-[#161b22] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            {user.avatarUrl && (
              <Image
                src={user.avatarUrl}
                alt={user.displayName ?? user.username}
                width={72}
                height={72}
                className="rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">{user.displayName ?? user.username}</h1>
              <p className="text-gray-400 text-sm">@{user.username}</p>
              {user.bio && (
                <p className="text-gray-300 text-sm mt-2">{user.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {user.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {user.location}
                  </span>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {user.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <a
                  href={`https://github.com/${user.username}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
                >
                  <Github className="w-3.5 h-3.5" />
                  github.com/{user.username}
                </a>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <a
                href={portfolioUrl}
                target="_blank"
                className="flex items-center gap-1.5 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open portfolio
              </a>
              <button
                onClick={handleSync}
                disabled={!canSync}
                title={!canSync && syncAvailableAt ? `Available at ${syncAvailableAt.toLocaleTimeString()}` : undefined}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync now"}
              </button>
              {user.lastSyncedAt && (
                <span className="text-xs text-gray-600">
                  Last synced: {new Date(user.lastSyncedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {syncMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm border ${
              syncMessage.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" :
              syncMessage.type === "warn"    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                              "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {syncMessage.text}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Public repos", value: user.githubData?.profile?.public_repos ?? 0 },
            { label: "Total stars", value: user.githubData?.totalStars ?? 0 },
            { label: "Total forks", value: user.githubData?.totalForks ?? 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#161b22] border border-white/10 rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-primary">
                {formatNumber(stat.value)}
              </div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Top repos */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Top repositories</h2>
            <div className="space-y-3">
              {topRepos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  className="block bg-[#161b22] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-primary text-sm">
                      {repo.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Star className="w-3 h-3" />
                        {formatNumber(repo.stargazers_count)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <GitFork className="w-3 h-3" />
                        {formatNumber(repo.forks_count)}
                      </span>
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                      {repo.description}
                    </p>
                  )}
                  {repo.language && (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                      />
                      <span className="text-xs text-gray-400">{repo.language}</span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Languages</h2>
            <div className="bg-[#161b22] border border-white/10 rounded-xl p-4">
              {/* Language bar */}
              <div className="flex rounded-full overflow-hidden h-2 mb-4">
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
                {topLanguages.map(({ lang, pct }) => (
                  <div key={lang} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: getLanguageColor(lang) }}
                      />
                      <span className="text-sm">{lang}</span>
                    </div>
                    <span className="text-sm text-gray-400">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio URL */}
            <div className="mt-4 bg-[#161b22] border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium mb-2">Your portfolio URL</h3>
              <a
                href={portfolioUrl}
                target="_blank"
                className="text-primary text-sm hover:underline break-all"
              >
                {portfolioUrl}
              </a>
              <p className="text-xs text-gray-500 mt-2">
                Share this link to showcase your work. It updates automatically every hour.
              </p>
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
