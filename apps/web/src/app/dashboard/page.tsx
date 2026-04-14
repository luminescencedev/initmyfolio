"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  GithubLogo,
  ArrowClockwise,
  ArrowSquareOut,
  SignOut,
  Clock,
  WarningCircle,
  CheckCircle,
  Info,
  Gear,
  ArrowsClockwise,
  Copy,
  Check,
  Eye,
  List,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setToken,
  fetchUserRequested,
  syncRequested,
  clearUser,
} from "@/store/slices/user.slice";
import {
  selectUser,
  selectIsLoaded,
  selectIsSyncing,
  selectSyncMessage,
  selectCanSync,
  selectPreviewRefreshAt,
} from "@/store/selectors/user.selector";
import { purgePersistedStore } from "@/store/store";

const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

/* --- Portfolio preview iframe --- */
function PortfolioPreview({
  url,
  externalKey,
}: {
  url: string;
  externalKey?: number | null;
}) {
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevExternalKeyRef = useRef(externalKey);

  // Auto-reload when externalKey changes (settings saved / sync completed)
  useEffect(() => {
    if (externalKey !== prevExternalKeyRef.current) {
      prevExternalKeyRef.current = externalKey;
      setLoaded(false);
      setKey((k) => k + 1);
    }
  }, [externalKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const VIRTUAL_W = 1280;
    const observe = () => setScale(el.clientWidth / VIRTUAL_W);
    observe();
    const ro = new ResizeObserver(observe);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const VIRTUAL_W = 1280;
  const VIRTUAL_H = 900;
  const containerH = Math.round(VIRTUAL_H * scale);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
      <div className="border-b border-border px-3.5 py-2.5 bg-secondary/30 flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <div className="flex-1 bg-background/80 rounded-md px-3 py-1 border border-border/60 min-w-0">
          <span className="text-[11px] font-mono text-muted-foreground truncate block">
            {url.replace(/^https?:\/\//, "")}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setLoaded(false);
              setKey((k) => k + 1);
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Reload preview"
          >
            <ArrowsClockwise weight="bold" className="w-3.5 h-3.5" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Open in new tab"
          >
            <ArrowSquareOut weight="regular" className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-background"
        style={{ height: `${containerH}px` }}
      >
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background z-10">
            <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <span className="text-xs text-muted-foreground">
              Loading preview...
            </span>
          </div>
        )}
        <iframe
          key={key}
          src={url}
          title="Portfolio preview"
          onLoad={() => setLoaded(true)}
          style={{
            width: `${VIRTUAL_W}px`,
            height: `${VIRTUAL_H}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: "none",
            pointerEvents: "none",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

/* --- Main dashboard content --- */
function DashboardContent() {
  // Local UI state only
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Redux
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isLoaded = useAppSelector(selectIsLoaded);
  const isSyncing = useAppSelector(selectIsSyncing);
  const syncMessage = useAppSelector(selectSyncMessage);
  const canSync = useAppSelector(selectCanSync);
  const previewRefreshAt = useAppSelector(selectPreviewRefreshAt);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Bootstrap: resolve token, kick off initial fetch if data not yet in store.
  // After OAuth the API redirects here with ?code=<one-time-code>.
  // We exchange that code for a JWT via POST /auth/exchange so the real
  // JWT token never appears in a URL (browser history / proxy logs).
  useEffect(() => {
    const urlCode = searchParams.get("code");
    const storedToken = localStorage.getItem("auth_token");

    async function bootstrap() {
      let activeToken = storedToken;

      if (urlCode) {
        try {
          const res = await fetch(`${API_URL}/auth/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: urlCode }),
          });
          if (!res.ok) {
            router.push("/login?error=auth_failed");
            return;
          }
          const data = (await res.json()) as { token: string };
          activeToken = data.token;
          localStorage.setItem("auth_token", activeToken);
          router.replace("/dashboard"); // Strip ?code= from URL
        } catch {
          router.push("/login?error=auth_failed");
          return;
        }
      }

      if (!activeToken) {
        router.push("/login");
        return;
      }

      dispatch(setToken(activeToken));
      if (!isLoaded) {
        dispatch(fetchUserRequested(activeToken));
      }
    }

    bootstrap();
    // Run once on mount — isLoaded intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to login if fetch resolved without a user
  useEffect(() => {
    if (isLoaded && !user) {
      localStorage.removeItem("auth_token");
      dispatch(clearUser());
      purgePersistedStore();
      router.push("/login");
    }
  }, [isLoaded, user, router, dispatch]);

  const handleSync = () => {
    if (!canSync) return;
    dispatch(syncRequested());
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(portfolioUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem("auth_token");
    dispatch(clearUser());
    purgePersistedStore();
    router.push("/");
  };

  const portfolioUrl = user
    ? APP_URL.includes("localhost")
      ? `${APP_URL}/${user.username}`
      : `https://${user.username}.initmyfolio.com`
    : "#";

  /* Skeleton */
  if (!isLoaded) {
    return (
      <div className="min-h-dvh bg-background flex">
        <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 border-r border-border/60 h-screen sticky top-0 flex-col gap-4 p-5">
          <div className="h-8 w-32 bg-secondary rounded-lg animate-pulse" />
          <div className="mt-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-9 bg-secondary rounded-xl animate-pulse"
              />
            ))}
          </div>
        </aside>
        <div className="flex-1 p-6 space-y-4">
          <div className="h-120 bg-secondary rounded-2xl animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-secondary rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-dvh bg-background flex flex-col lg:flex-row">
      {/* SIDEBAR - desktop only */}
      <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 border-r border-border/60 h-screen sticky top-0 flex-col">
        {/* Brand */}
        <div className="px-5 h-14 flex items-center border-b border-border/60 shrink-0">
          <Link
            href="/"
            className="font-semibold text-sm text-foreground tracking-tight"
          >
            initmyfolio
          </Link>
        </div>

        {/* Profile */}
        <div className="p-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.username}
                width={40}
                height={40}
                className="rounded-full border border-border shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full border border-border bg-secondary flex items-center justify-center shrink-0">
                <GithubLogo
                  weight="fill"
                  className="w-4 h-4 text-muted-foreground"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {user.displayName ?? user.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{user.username}
              </p>
            </div>
          </div>

          {/* Portfolio URL */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 border border-border/60">
            <span className="text-[11px] font-mono text-muted-foreground truncate flex-1">
              {portfolioUrl.replace(/^https?:\/\//, "")}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Copy URL"
            >
              {copied ? (
                <Check weight="bold" className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy weight="regular" className="w-3 h-3" />
              )}
            </button>
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open portfolio"
            >
              <ArrowSquareOut weight="regular" className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Nav */}
        <nav
          aria-label="Dashboard navigation"
          className="flex-1 p-3 space-y-0.5 overflow-y-auto"
        >
          {/* Preview - active indicator (always on this page) */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-foreground/8 text-foreground">
            <Eye weight="fill" className="w-4 h-4 shrink-0" />
            Preview
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <Gear weight="regular" className="w-4 h-4 shrink-0" />
            Settings
          </Link>
          <a
            href={`https://github.com/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <GithubLogo weight="regular" className="w-4 h-4 shrink-0" />
            GitHub profile
          </a>
        </nav>

        {/* Sync + sign out */}
        <div className="p-4 border-t border-border/60 space-y-2 shrink-0">
          {user.lastSyncedAt && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
              <Clock weight="regular" className="w-3 h-3" />
              Synced{" "}
              {new Date(user.lastSyncedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          <button
            onClick={handleSync}
            disabled={!canSync}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowClockwise
              weight="bold"
              className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Syncing..." : "Sync GitHub data"}
          </button>
          <div className="flex items-center justify-between px-1">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <SignOut weight="regular" className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN COLUMN */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl h-14 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.username}
                width={28}
                height={28}
                className="rounded-full border border-border shrink-0"
              />
            ) : null}
            <span className="text-sm font-semibold text-foreground truncate">
              {user.displayName ?? user.username}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Open menu"
          >
            <List weight="bold" className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden fixed inset-0 z-50 bg-foreground/20 dark:bg-foreground/30 backdrop-blur-sm"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              {/* Panel */}
              <motion.div
                key="panel"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:hidden fixed top-0 right-0 z-50 h-full w-72 bg-background border-l border-border/60 flex flex-col shadow-2xl"
              >
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
                  <span className="text-sm font-semibold text-foreground">
                    Menu
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label="Close menu"
                  >
                    <X weight="bold" className="w-4 h-4" />
                  </button>
                </div>

                {/* Profile recap */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border/60 shrink-0">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.username}
                      width={36}
                      height={36}
                      className="rounded-full border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                      <GithubLogo
                        weight="fill"
                        className="w-4 h-4 text-muted-foreground"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.displayName ?? user.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleSync();
                      setMenuOpen(false);
                    }}
                    disabled={!canSync}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowClockwise
                      weight="bold"
                      className={`w-4 h-4 shrink-0 ${isSyncing ? "animate-spin" : ""}`}
                    />
                    <span className="flex-1 text-left">
                      {isSyncing ? "Syncing..." : "Refresh data"}
                    </span>
                    {user.lastSyncedAt && (
                      <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                        {new Date(user.lastSyncedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
                    <span className="text-sm font-medium text-muted-foreground flex-1">
                      Theme
                    </span>
                    <ThemeToggle />
                  </div>

                  <div className="pt-2 mt-1 border-t border-border/60 space-y-0.5">
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <Gear weight="regular" className="w-4 h-4 shrink-0" />
                      Settings
                    </Link>
                    <a
                      href={`https://github.com/${user.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <GithubLogo
                        weight="regular"
                        className="w-4 h-4 shrink-0"
                      />
                      GitHub profile
                    </a>
                  </div>
                </div>

                {/* Sign out */}
                <div className="p-4 border-t border-border/60 shrink-0">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/8 transition-colors"
                  >
                    <SignOut weight="regular" className="w-4 h-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Content */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl w-full mx-auto"
        >
          {/* Sync message */}
          {syncMessage && (
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm ${
                syncMessage.type === "success"
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                  : syncMessage.type === "warn"
                    ? "border-border bg-secondary/60 text-foreground"
                    : "border-red-500/20 bg-red-500/5 text-red-500"
              }`}
            >
              {syncMessage.type === "success" ? (
                <CheckCircle weight="fill" className="w-4 h-4 shrink-0" />
              ) : syncMessage.type === "warn" ? (
                <Info weight="fill" className="w-4 h-4 shrink-0" />
              ) : (
                <WarningCircle weight="fill" className="w-4 h-4 shrink-0" />
              )}
              {syncMessage.text}
            </div>
          )}

          {/* Portfolio preview */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 24,
              delay: 0.1,
            }}
          >
            <PortfolioPreview
              url={portfolioUrl}
              externalKey={previewRefreshAt}
            />
          </motion.div>

          {/* Quick actions */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.08, delayChildren: 0.2 },
              },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 270, damping: 24 },
                },
              }}
            >
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-card shadow-card hover:bg-secondary/40 active:scale-[0.98] transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Gear
                    weight="regular"
                    className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Customize
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Layout, colors, sections
                  </p>
                </div>
              </Link>
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 270, damping: 24 },
                },
              }}
            >
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-card shadow-card hover:bg-secondary/40 active:scale-[0.98] transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  {copied ? (
                    <Check weight="bold" className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy
                      weight="regular"
                      className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {copied ? "Copied!" : "Copy link"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Share your portfolio
                  </p>
                </div>
              </button>
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 270, damping: 24 },
                },
              }}
            >
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-card shadow-card hover:bg-secondary/40 active:scale-[0.98] transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <ArrowSquareOut
                    weight="regular"
                    className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Open live
                  </p>
                  <p className="text-xs text-muted-foreground">
                    View your live portfolio
                  </p>
                </div>
              </a>
            </motion.div>
          </motion.div>
        </main>
      </div>
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
