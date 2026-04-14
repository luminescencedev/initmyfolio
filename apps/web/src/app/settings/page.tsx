"use client";

import { useEffect, useRef, useState, Suspense, KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeSlash,
  CheckCircle,
  Spinner,
  WarningCircle,
  X,
  FloppyDisk,
  SignOut,
} from "@phosphor-icons/react";
import type { PortfolioUser } from "@/lib/api";
import { getCurrentUser, updateSettings } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setUser,
  setPreviewRefreshAt,
  clearUser,
} from "@/store/slices/user.slice";
import { selectToken, selectUser } from "@/store/selectors/user.selector";
import { purgePersistedStore } from "@/store/store";
import { ThemeToggle } from "@/components/theme-toggle";

type UserSettings = PortfolioUser["settings"];

/* ── Constants ─────────────────────────────────────────── */
const ACCENT_OPTIONS = [
  "red",
  "cyan",
  "emerald",
  "amber",
  "rose",
  "sky",
] as const;
const ACCENT_COLORS: Record<string, { bg: string; label: string }> = {
  red: { bg: "hsl(0 80% 50%)", label: "Red" },
  cyan: { bg: "hsl(188 85% 48%)", label: "Cyan" },
  emerald: { bg: "hsl(152 60% 42%)", label: "Emerald" },
  amber: { bg: "hsl(38 90% 50%)", label: "Amber" },
  rose: { bg: "hsl(347 77% 50%)", label: "Rose" },
  sky: { bg: "hsl(200 85% 50%)", label: "Sky" },
};
const SECTION_LABELS: Record<string, string> = {
  stats: "Stats",
  repos: "Repositories",
  languages: "Languages",
  about: "About",
  stack: "Tech Stack",
  links: "Custom Links",
};
const ALL_SECTIONS = ["stats", "repos", "languages", "about", "stack", "links"];
const NAV_SECTIONS = [
  { id: "appearance", label: "Appearance" },
  { id: "content", label: "Content" },
  { id: "about", label: "About text" },
  { id: "stack", label: "Tech stack" },
  { id: "featured", label: "Featured repo" },
  { id: "sections", label: "Sections & order" },
  { id: "links", label: "Custom links" },
] as const;

/* ── Option group ────────────────────────────────────────── */
function OptionGroup<T extends string | number>({
  value,
  options,
  labels,
  onChange,
}: {
  value: T | undefined;
  options: readonly T[];
  labels?: Partial<Record<string, string>>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
            value === opt
              ? "border-foreground bg-foreground text-background shadow-sm"
              : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground hover:bg-secondary"
          }`}
        >
          {labels?.[String(opt)] ?? String(opt)}
        </button>
      ))}
    </div>
  );
}

/* ── Toggle ──────────────────────────────────────────────── */
function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const active = value ?? false;
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!active)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${active ? "bg-primary" : "bg-secondary border border-border"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

/* ── Section row (order + visibility) ───────────────────── */
function SectionRow({
  id,
  label,
  hidden,
  isFirst,
  isLast,
  onToggle,
  onMoveUp,
  onMoveDown,
}: {
  id: string;
  label: string;
  hidden: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-3 transition-opacity ${hidden ? "opacity-40" : ""}`}
    >
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          className="w-6 h-5 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ArrowUp weight="bold" className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          className="w-6 h-5 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ArrowDown weight="bold" className="w-2.5 h-2.5" />
        </button>
      </div>
      <span className="flex-1 text-sm font-medium text-foreground">
        {label}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
          hidden
            ? "border-border text-muted-foreground hover:border-foreground/50 hover:bg-secondary"
            : "border-foreground bg-foreground text-background"
        }`}
      >
        {hidden ? (
          <>
            <EyeSlash weight="bold" className="w-3 h-3" /> Hidden
          </>
        ) : (
          <>
            <Eye weight="bold" className="w-3 h-3" /> Visible
          </>
        )}
      </button>
    </div>
  );
}

/* ── Tech stack tag input ────────────────────────────────── */
function TechStackInput({
  value,
  onChange,
}: {
  value: Array<{ name: string; category?: string }>;
  onChange: (v: Array<{ name: string; category?: string }>) => void;
}) {
  const [input, setInput] = useState("");
  const addTag = () => {
    const t = input.trim().replace(/,$/, "").trim();
    if (!t || value.some((x) => x.name.toLowerCase() === t.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...value, { name: t }]);
    setInput("");
  };
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={addTag}
        placeholder="Add technology… (Enter or ,)"
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-secondary text-sm font-medium text-foreground"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
              >
                <X weight="bold" className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Section header ──────────────────────────────────────── */
function SectionHeader({ id, label }: { id: string; label: string }) {
  return (
    <div
      id={id}
      className="sticky top-16 z-10 -mx-6 px-6 py-3 bg-background/90 backdrop-blur-sm border-b border-border/60"
    >
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
    </div>
  );
}

/* ── Field block ─────────────────────────────────────────── */
function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-5 border-b border-border/60 last:border-0">
      <div className="text-sm font-medium text-foreground mb-1">{label}</div>
      {hint && <div className="text-xs text-muted-foreground mb-3">{hint}</div>}
      {children}
    </div>
  );
}

/* ── Main settings form ──────────────────────────────────── */
function SettingsContent() {
  const [user, setUserState] = useState<PortfolioUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [local, setLocal] = useState<UserSettings>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [activeSection, setActiveSection] =
    useState<(typeof NAV_SECTIONS)[number]["id"]>("appearance");
  const dispatch = useAppDispatch();
  const reduxToken = useAppSelector(selectToken);
  const reduxUser = useAppSelector(selectUser);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSettings = useRef<UserSettings>({});

  // Derive token: prefer Redux store, fall back to localStorage
  const token =
    reduxToken ??
    (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    // If Redux already has the user, bootstrap from store (no extra fetch)
    if (reduxUser) {
      setUserState(reduxUser);
      setLocal(reduxUser.settings ?? {});
      initialSettings.current = reduxUser.settings ?? {};
      setLoading(false);
      return;
    }
    getCurrentUser(storedToken).then((u) => {
      setLoading(false);
      if (!u) {
        localStorage.removeItem("auth_token");
        router.push("/login");
        return;
      }
      setUserState(u);
      setLocal(u.settings ?? {});
      initialSettings.current = u.settings ?? {};
    });
  }, [router, searchParams]);

  useEffect(() => {
    setIsDirty(
      JSON.stringify(local) !== JSON.stringify(initialSettings.current),
    );
  }, [local]);

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!token || !user) return;
    setSaveStatus("saving");
    const ok = await updateSettings(token, user.username, local);
    if (ok) {
      setSaveStatus("saved");
      setIsDirty(false);
      initialSettings.current = local;
      // Update Redux store so the dashboard preview is immediately fresh
      const updatedUser = { ...user, settings: local };
      setUserState(updatedUser);
      dispatch(setUser(updatedUser));
      dispatch(setPreviewRefreshAt(Date.now()));
      setTimeout(() => setSaveStatus("idle"), 2500);
    } else {
      setSaveStatus("error");
    }
  };

  const rawOrder: string[] = local.sectionOrder ?? [...ALL_SECTIONS];
  const sectionOrder = [
    ...rawOrder,
    ...ALL_SECTIONS.filter((s) => !rawOrder.includes(s)),
  ];
  const hideSections: string[] = local.hideSections ?? [];

  const moveSectionUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...sectionOrder];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    set("sectionOrder", next);
  };
  const moveSectionDown = (idx: number) => {
    if (idx === sectionOrder.length - 1) return;
    const next = [...sectionOrder];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    set("sectionOrder", next);
  };
  const toggleSection = (id: string) => {
    const next = hideSections.includes(id)
      ? hideSections.filter((s) => s !== id)
      : [...hideSections, id];
    set("hideSections", next);
  };

  useEffect(() => {
    if (loading) return;
    // Trigger line = 50% of viewport height.
    // A section becomes active as soon as its header crosses that line going up.
    // Edge cases: force first section at very top, last section at very bottom.
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight;

      if (scrollY < 10) {
        setActiveSection(NAV_SECTIONS[0].id);
        return;
      }
      if (scrollY + vh >= docH - 4) {
        setActiveSection(NAV_SECTIONS[NAV_SECTIONS.length - 1].id);
        return;
      }

      // getBoundingClientRect gives viewport-relative position — compare to 50% vh
      const trigger = vh * 0.5;
      let active: (typeof NAV_SECTIONS)[number]["id"] = NAV_SECTIONS[0].id;
      for (const { id } of NAV_SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= trigger) active = id;
      }
      setActiveSection(active);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-20" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-[220px_1fr] gap-8">
            <div className="hidden lg:block rounded-2xl border border-border bg-card h-64 animate-pulse" />
            <div className="space-y-5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-6 animate-pulse"
                >
                  <div className="w-32 h-4 bg-muted rounded mb-4" />
                  <div className="w-full h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <span className="text-border hidden sm:block">·</span>
            <span className="text-sm font-semibold text-foreground hidden sm:block">
              Settings
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {saveStatus === "saved" && (
              <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle weight="fill" className="w-4 h-4" /> Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-red-500">
                <WarningCircle weight="fill" className="w-4 h-4" /> Error
              </span>
            )}
            {isDirty && saveStatus === "idle" && (
              <span className="hidden sm:inline text-xs text-muted-foreground">
                Unsaved changes
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === "saving" || !isDirty}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                isDirty
                  ? "border-foreground bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                  : "border-border text-muted-foreground"
              }`}
            >
              {saveStatus === "saving" ? (
                <>
                  <Spinner weight="bold" className="w-3.5 h-3.5 animate-spin" />{" "}
                  Saving…
                </>
              ) : (
                <>
                  <FloppyDisk weight="bold" className="w-3.5 h-3.5" /> Save
                </>
              )}
            </button>

            <ThemeToggle />
            <button
              onClick={() => {
                localStorage.removeItem("auth_token");
                dispatch(clearUser());
                purgePersistedStore();
                router.push("/");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <SignOut weight="regular" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Unsaved banner (mobile) */}
      {isDirty && saveStatus === "idle" && (
        <div className="sm:hidden bg-secondary/60 border-b border-border/60 px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Unsaved changes</span>
          <button
            type="button"
            onClick={handleSave}
            className="text-sm font-semibold text-foreground"
          >
            Save
          </button>
        </div>
      )}

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          {/* ── SIDEBAR NAV ──────────────────────── */}
          <aside className="hidden lg:block">
            <nav
              aria-label="Settings sections"
              className="sticky top-24 rounded-2xl border border-border bg-card p-3 shadow-card"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-3 py-2">
                Sections
              </p>
              <ul className="space-y-0.5">
                {NAV_SECTIONS.map((sec) => (
                  <li key={sec.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(sec.id);
                        if (!el) return;
                        // Scroll so the section header lands exactly at the 50% trigger line
                        const top =
                          el.getBoundingClientRect().top +
                          window.scrollY -
                          window.innerHeight * 0.5;
                        window.scrollTo({ top, behavior: "smooth" });
                      }}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === sec.id
                          ? "bg-foreground text-background font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {sec.label}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus === "saving" || !isDirty}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDirty
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <FloppyDisk weight="bold" className="w-3.5 h-3.5" />
                  {saveStatus === "saving" ? "Saving…" : "Save changes"}
                </button>
              </div>
            </nav>
          </aside>

          {/* ── MAIN FORM ────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            <div className="px-6">
              {/* == APPEARANCE == */}
              <SectionHeader id="appearance" label="Appearance" />

              <FieldBlock
                label="Accent color"
                hint="Sets the primary color used throughout your portfolio."
              >
                <div className="flex flex-wrap gap-2">
                  {ACCENT_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => set("accentColor", color)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                        local.accentColor === color
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: ACCENT_COLORS[color]?.bg }}
                      />
                      {ACCENT_COLORS[color]?.label ?? color}
                    </button>
                  ))}
                </div>
              </FieldBlock>

              <FieldBlock
                label="Portfolio layout"
                hint="Brutalist is fully functional. Glass, Clean, and Editorial are coming soon."
              >
                <OptionGroup
                  value={local.layoutVariant}
                  options={
                    ["brutalist", "glass", "clean", "editorial"] as const
                  }
                  labels={{
                    brutalist: "Brutalist",
                    glass: "Glass",
                    clean: "Clean",
                    editorial: "Editorial",
                  }}
                  onChange={(v) =>
                    set("layoutVariant", v as UserSettings["layoutVariant"])
                  }
                />
              </FieldBlock>

              <FieldBlock label="Hero name style">
                <OptionGroup
                  value={local.heroStyle}
                  options={
                    ["name-full", "name-initials", "name-split"] as const
                  }
                  labels={{
                    "name-full": "Full name",
                    "name-initials": "Initials only",
                    "name-split": "Split letters",
                  }}
                  onChange={(v) => set("heroStyle", v)}
                />
              </FieldBlock>

              <FieldBlock label="Font style">
                <OptionGroup
                  value={local.fontStyle}
                  options={["display", "mono", "mixed"] as const}
                  labels={{
                    display: "Display",
                    mono: "Monospace",
                    mixed: "Mixed",
                  }}
                  onChange={(v) => set("fontStyle", v)}
                />
              </FieldBlock>

              {/* == CONTENT == */}
              <SectionHeader id="content" label="Content" />

              <FieldBlock label="Availability badge">
                <div className="flex flex-wrap gap-2">
                  {([null, "open", "busy", "closed"] as const).map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => set("availability", val)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                        local.availability === val
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {val === null ? (
                        "None"
                      ) : val === "open" ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Open to work
                        </>
                      ) : val === "busy" ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Busy
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-zinc-400" />
                          Closed
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </FieldBlock>

              <div className="py-2 border-b border-border/60">
                <Toggle
                  value={local.showEmail}
                  onChange={(v) => set("showEmail", v)}
                  label="Show email address"
                />
                <Toggle
                  value={local.showAvatar}
                  onChange={(v) => set("showAvatar", v)}
                  label="Show avatar in hero"
                />
                <Toggle
                  value={local.showTopics}
                  onChange={(v) => set("showTopics", v)}
                  label="Show repository topics"
                />
              </div>

              <FieldBlock label="Max repositories displayed">
                <OptionGroup
                  value={local.maxRepos}
                  options={[4, 6, 8, 12] as const}
                  onChange={(v) => set("maxRepos", v)}
                />
              </FieldBlock>

              <FieldBlock label="Sort repositories by">
                <OptionGroup
                  value={local.repoSortBy}
                  options={
                    ["stars", "forks", "updated", "pinned-first"] as const
                  }
                  labels={{
                    stars: "Stars",
                    forks: "Forks",
                    updated: "Recently updated",
                    "pinned-first": "Pinned first",
                  }}
                  onChange={(v) => set("repoSortBy", v)}
                />
              </FieldBlock>

              <FieldBlock label="Repository display style">
                <OptionGroup
                  value={local.repoDisplayStyle}
                  options={["table", "cards", "compact"] as const}
                  labels={{
                    table: "Table",
                    cards: "Cards (2 cols)",
                    compact: "Compact list",
                  }}
                  onChange={(v) => set("repoDisplayStyle", v)}
                />
              </FieldBlock>

              {/* == ABOUT == */}
              <SectionHeader id="about" label="About text" />

              <div className="py-5 border-b border-border/60 space-y-2">
                <textarea
                  value={local.aboutText ?? ""}
                  onChange={(e) =>
                    set("aboutText", e.target.value.slice(0, 1000))
                  }
                  placeholder="Write a short bio or description that appears on your portfolio…"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Displayed in the About section
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {(local.aboutText ?? "").length}/1000
                  </span>
                </div>
              </div>

              {/* == TECH STACK == */}
              <SectionHeader id="stack" label="Tech stack" />

              <div className="py-5 border-b border-border/60">
                <TechStackInput
                  value={local.techStack ?? []}
                  onChange={(v) => set("techStack", v)}
                />
                <p className="text-xs text-muted-foreground mt-3">
                  Up to 30 technologies — displayed as tags on your portfolio.
                </p>
              </div>

              {/* == FEATURED REPO == */}
              <SectionHeader id="featured" label="Featured repo" />

              <div className="py-5 border-b border-border/60">
                <p className="text-xs text-muted-foreground mb-3">
                  Select one repository to feature prominently at the top of
                  your repos section.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => set("featuredRepo", null)}
                    className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                      !local.featuredRepo
                        ? "border-foreground bg-foreground text-background shadow-sm"
                        : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    None
                  </button>
                  {(user.githubData?.repos ?? [])
                    .sort((a, b) => b.stargazers_count - a.stargazers_count)
                    .slice(0, 12)
                    .map((repo) => (
                      <button
                        key={repo.name}
                        type="button"
                        onClick={() => set("featuredRepo", repo.name)}
                        className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                          local.featuredRepo === repo.name
                            ? "border-foreground bg-foreground text-background shadow-sm"
                            : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {repo.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* == SECTIONS & ORDER == */}
              <SectionHeader id="sections" label="Sections & order" />

              <div className="py-4 border-b border-border/60">
                <p className="text-xs text-muted-foreground mb-4">
                  Reorder and toggle visibility of sections on your portfolio.
                </p>
                <div className="divide-y divide-border/60">
                  {sectionOrder.map((id, idx) => (
                    <SectionRow
                      key={id}
                      id={id}
                      label={SECTION_LABELS[id] ?? id}
                      hidden={hideSections.includes(id)}
                      isFirst={idx === 0}
                      isLast={idx === sectionOrder.length - 1}
                      onToggle={() => toggleSection(id)}
                      onMoveUp={() => moveSectionUp(idx)}
                      onMoveDown={() => moveSectionDown(idx)}
                    />
                  ))}
                </div>
              </div>

              {/* == CUSTOM LINKS == */}
              <SectionHeader id="links" label="Custom links" />

              <div className="py-5">
                <CustomLinksEditor
                  value={local.customLinks ?? []}
                  onChange={(v) => set("customLinks", v)}
                />
              </div>
            </div>

            {/* ── BOTTOM SAVE ─── */}
            <div className="px-6 py-5 border-t border-border/60 bg-secondary/20 flex items-center justify-between gap-4">
              <div>
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle weight="fill" className="w-4 h-4" /> Changes
                    saved successfully
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
                    <WarningCircle weight="fill" className="w-4 h-4" /> Save
                    failed — please retry
                  </span>
                )}
                {isDirty && saveStatus === "idle" && (
                  <span className="text-sm text-muted-foreground">
                    You have unsaved changes
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveStatus === "saving" || !isDirty}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDirty
                    ? "border-foreground bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                    : "border-border text-muted-foreground"
                }`}
              >
                {saveStatus === "saving" ? (
                  <>
                    <Spinner
                      weight="bold"
                      className="w-3.5 h-3.5 animate-spin"
                    />{" "}
                    Saving…
                  </>
                ) : (
                  <>
                    <FloppyDisk weight="bold" className="w-3.5 h-3.5" /> Save
                    changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Custom links editor ─────────────────────────────── */
function CustomLinksEditor({
  value,
  onChange,
}: {
  value: Array<{ label: string; url: string; icon?: string }>;
  onChange: (v: Array<{ label: string; url: string; icon?: string }>) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const addLink = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    const safeUrl = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
    onChange([...value, { label: newLabel.trim(), url: safeUrl }]);
    setNewLabel("");
    setNewUrl("");
  };

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {value.map((link, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 bg-secondary/20"
            >
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {link.label}
              </span>
              <span className="text-xs text-muted-foreground truncate flex-1 text-right">
                {link.url.replace(/^https?:\/\//, "")}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
              >
                <X weight="bold" className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < 10 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label"
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://…"
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            className="flex-[2] px-4 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
          />
          <button
            type="button"
            onClick={addLink}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors active:scale-[0.97] shrink-0"
          >
            Add
          </button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {value.length}/10 links — shown in the links section and meta strip.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
