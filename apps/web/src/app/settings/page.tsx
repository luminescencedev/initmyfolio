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
const ACCENT_CLASSES: Record<string, string> = {
  red: "bg-[hsl(0_80%_50%)]",
  cyan: "bg-[hsl(188_85%_48%)]",
  emerald: "bg-[hsl(152_60%_42%)]",
  amber: "bg-[hsl(38_90%_50%)]",
  rose: "bg-[hsl(347_77%_50%)]",
  sky: "bg-[hsl(200_85%_50%)]",
};
const SECTION_LABELS: Record<string, string> = {
  stats: "STATS",
  repos: "REPOSITORIES",
  languages: "LANGUAGES",
  about: "ABOUT",
  stack: "TECH STACK",
  links: "CUSTOM LINKS",
};
const ALL_SECTIONS = ["stats", "repos", "languages", "about", "stack", "links"];
const NAV_SECTIONS = [
  { id: "appearance", label: "APPEARANCE" },
  { id: "content", label: "CONTENT" },
  { id: "about", label: "ABOUT" },
  { id: "stack", label: "TECH STACK" },
  { id: "featured", label: "FEATURED REPO" },
  { id: "sections", label: "SECTIONS & ORDER" },
  { id: "links", label: "CUSTOM LINKS" },
] as const;

/* ── Generic option group ──────────────────────────────── */
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
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-2.5 py-1 border text-[10px] font-mono uppercase tracking-wider transition-colors active:scale-[0.98] ${
            value === opt
              ? "border-foreground text-foreground bg-muted"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          }`}
        >
          {labels?.[String(opt)] ?? String(opt)}
        </button>
      ))}
    </div>
  );
}

/* ── Toggle button ─────────────────────────────────────── */
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
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="label">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!active)}
        className={`px-3 py-1 border text-[10px] font-mono uppercase tracking-wider transition-colors active:scale-[0.98] ${
          active
            ? "border-foreground bg-foreground text-background"
            : "border-border text-muted-foreground hover:border-foreground"
        }`}
      >
        {active ? "ON" : "OFF"}
      </button>
    </div>
  );
}

/* ── Section row (order + visibility) ─────────────────── */
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
      className={`flex items-center gap-2 px-4 py-2.5 border-b border-border last:border-0 ${hidden ? "opacity-40" : ""}`}
    >
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          className="w-5 h-4 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ArrowUp weight="bold" className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          className="w-5 h-4 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ArrowDown weight="bold" className="w-2.5 h-2.5" />
        </button>
      </div>
      <span className="flex-1 label text-foreground">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-2 py-1 border text-[10px] font-mono uppercase tracking-wider transition-colors active:scale-[0.98] ${
          hidden
            ? "border-border text-muted-foreground hover:border-foreground"
            : "border-foreground bg-foreground text-background"
        }`}
      >
        {hidden ? (
          <>
            <EyeSlash weight="bold" className="w-3 h-3" /> HIDDEN
          </>
        ) : (
          <>
            <Eye weight="bold" className="w-3 h-3" /> VISIBLE
          </>
        )}
      </button>
    </div>
  );
}

/* ── Tech stack tag input ──────────────────────────────── */
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
    onChange([...value, { name: t.toUpperCase() }]);
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
        placeholder="ADD TECH… (ENTER OR ,)"
        className="w-full px-3 py-2 border border-border bg-background font-mono text-xs uppercase tracking-wider placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 border border-border font-mono text-[10px] px-2 py-0.5 text-foreground"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
              >
                <X weight="bold" className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Section header ────────────────────────────────────── */
function SectionHeader({ id, label }: { id: string; label: string }) {
  return (
    <div
      id={id}
      className="border-b border-border px-6 py-2.5 bg-background sticky top-[48px] z-10"
    >
      <span className="label text-[9px] tracking-widest">{label}</span>
    </div>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-4 border-b border-border">
      <div className="label mb-2 text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

/* ── Main settings form ────────────────────────────────── */
function SettingsContent() {
  const [user, setUser] = useState<PortfolioUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [local, setLocal] = useState<UserSettings>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [activeSection, setActiveSection] = useState("appearance");
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSettings = useRef<UserSettings>({});

  /* ── Auth ── */
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setToken(storedToken);
    getCurrentUser(storedToken).then((u) => {
      setLoading(false);
      if (!u) {
        localStorage.removeItem("auth_token");
        router.push("/login");
        return;
      }
      setUser(u);
      setLocal(u.settings ?? {});
      initialSettings.current = u.settings ?? {};
    });
  }, [router, searchParams]);

  /* ── Dirty tracking ── */
  useEffect(() => {
    setIsDirty(
      JSON.stringify(local) !== JSON.stringify(initialSettings.current),
    );
  }, [local]);

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  /* ── Save ── */
  const handleSave = async () => {
    if (!token || !user) return;
    setSaveStatus("saving");
    const ok = await updateSettings(token, user.username, local);
    if (ok) {
      setSaveStatus("saved");
      setIsDirty(false);
      initialSettings.current = local;
      setTimeout(() => setSaveStatus("idle"), 2500);
    } else {
      setSaveStatus("error");
    }
  };

  /* ── Section order ── */
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

  /* ── Intersection observer for active nav ── */
  useEffect(() => {
    const sections = NAV_SECTIONS.map((s) =>
      document.getElementById(s.id),
    ).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { threshold: 0.2, rootMargin: "-60px 0px -60% 0px" },
    );
    sections.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [loading]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <header className="border-b border-border h-12 bg-background sticky top-0 z-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="border border-border animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-border">
                <div className="w-32 h-3 bg-muted mb-2" />
                <div className="w-full h-8 bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="border-b border-border sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 label hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
              DASHBOARD
            </Link>
            <span className="label hidden sm:block text-muted-foreground">
              ///
            </span>
            <span className="label hidden sm:block text-foreground truncate">
              SETTINGS
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Save status */}
            {saveStatus === "saved" && (
              <span className="hidden sm:flex items-center gap-1.5 label text-foreground">
                <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                SAVED
              </span>
            )}
            {saveStatus === "error" && (
              <span className="hidden sm:flex items-center gap-1.5 label text-primary">
                <WarningCircle weight="fill" className="w-3.5 h-3.5" />
                ERROR
              </span>
            )}
            {isDirty && saveStatus === "idle" && (
              <span className="hidden sm:flex items-center gap-1.5 label text-muted-foreground">
                UNSAVED CHANGES
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === "saving" || !isDirty}
              className={`flex items-center gap-1.5 px-4 py-1.5 border text-[11px] font-mono uppercase tracking-wider transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                isDirty
                  ? "border-foreground bg-foreground text-background hover:bg-foreground/90"
                  : "border-border text-muted-foreground"
              }`}
            >
              {saveStatus === "saving" ? (
                <>
                  <Spinner weight="bold" className="w-3.5 h-3.5 animate-spin" />{" "}
                  SAVING…
                </>
              ) : (
                <>
                  <FloppyDisk weight="bold" className="w-3.5 h-3.5" /> SAVE
                  CHANGES
                </>
              )}
            </button>

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

      {/* Unsaved changes banner (mobile) */}
      {isDirty && saveStatus === "idle" && (
        <div className="sm:hidden border-b border-border bg-muted/60 px-4 py-2 flex items-center justify-between">
          <span className="label text-muted-foreground">UNSAVED CHANGES</span>
          <button
            type="button"
            onClick={handleSave}
            className="label text-foreground hover:underline"
          >
            SAVE
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[200px_1fr]">
          {/* ── SIDEBAR NAV ──────────────────────── */}
          <aside className="hidden lg:block border-r border-border">
            <nav className="sticky top-12 pt-6 pb-8">
              <div className="label text-[9px] tracking-widest text-muted-foreground px-4 mb-3">
                SECTIONS
              </div>
              <ul className="space-y-0">
                {NAV_SECTIONS.map((sec) => (
                  <li key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      className={`block px-4 py-2 label transition-colors border-l-2 ${
                        activeSection === sec.id
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      }`}
                    >
                      {sec.label}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-6 px-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus === "saving" || !isDirty}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 border text-[10px] font-mono uppercase tracking-wider transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDirty
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <FloppyDisk weight="bold" className="w-3 h-3" />
                  {saveStatus === "saving" ? "SAVING…" : "SAVE"}
                </button>
              </div>
            </nav>
          </aside>

          {/* ── MAIN SETTINGS FORM ───────────────── */}
          <div className="border-r-0 lg:border-l-0">
            {/* == APPEARANCE == */}
            <SectionHeader id="appearance" label="APPEARANCE" />

            <FieldBlock label="ACCENT COLOR">
              <div className="flex flex-wrap gap-1.5">
                {ACCENT_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => set("accentColor", color)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-mono uppercase tracking-wider transition-colors active:scale-[0.98] ${
                      local.accentColor === color
                        ? "border-foreground text-foreground bg-muted"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 shrink-0 ${ACCENT_CLASSES[color]}`}
                    />
                    {color.toUpperCase()}
                  </button>
                ))}
              </div>
            </FieldBlock>

            <FieldBlock label="LAYOUT VARIANT">
              <OptionGroup
                value={local.layoutVariant}
                options={["brutalist", "terminal", "minimal"] as const}
                labels={{
                  brutalist: "BRUTALIST",
                  terminal: "TERMINAL",
                  minimal: "MINIMAL",
                }}
                onChange={(v) => set("layoutVariant", v)}
              />
              <p className="label text-muted-foreground mt-2 text-[9px]">
                TERMINAL AND MINIMAL ARE COMING SOON — CURRENTLY RENDERS AS
                BRUTALIST
              </p>
            </FieldBlock>

            <FieldBlock label="HERO NAME STYLE">
              <OptionGroup
                value={local.heroStyle}
                options={["name-full", "name-initials", "name-split"] as const}
                labels={{
                  "name-full": "FULL NAME",
                  "name-initials": "INITIALS ONLY",
                  "name-split": "SPLIT LETTERS",
                }}
                onChange={(v) => set("heroStyle", v)}
              />
            </FieldBlock>

            <FieldBlock label="FONT STYLE">
              <OptionGroup
                value={local.fontStyle}
                options={["display", "mono", "mixed"] as const}
                labels={{
                  display: "DISPLAY (CABINET GROTESK)",
                  mono: "MONO",
                  mixed: "MIXED",
                }}
                onChange={(v) => set("fontStyle", v)}
              />
            </FieldBlock>

            {/* == CONTENT == */}
            <SectionHeader id="content" label="CONTENT" />

            <FieldBlock label="AVAILABILITY BADGE">
              <div className="flex flex-wrap gap-1">
                {([null, "open", "busy", "closed"] as const).map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => set("availability", val)}
                    className={`px-2.5 py-1 border text-[10px] font-mono uppercase tracking-wider transition-colors active:scale-[0.98] ${
                      local.availability === val
                        ? "border-foreground text-foreground bg-muted"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {val === null
                      ? "NONE"
                      : val === "open"
                        ? "OPEN TO WORK"
                        : val === "busy"
                          ? "BUSY"
                          : "CLOSED"}
                  </button>
                ))}
              </div>
            </FieldBlock>

            <div className="px-6 py-4 border-b border-border">
              <Toggle
                value={local.showEmail}
                onChange={(v) => set("showEmail", v)}
                label="SHOW EMAIL ADDRESS"
              />
              <Toggle
                value={local.showAvatar}
                onChange={(v) => set("showAvatar", v)}
                label="SHOW AVATAR IN HERO"
              />
              <Toggle
                value={local.showTopics}
                onChange={(v) => set("showTopics", v)}
                label="SHOW REPO TOPICS"
              />
            </div>

            <FieldBlock label="MAX REPOS DISPLAYED">
              <OptionGroup
                value={local.maxRepos}
                options={[4, 6, 8, 12] as const}
                onChange={(v) => set("maxRepos", v)}
              />
            </FieldBlock>

            <FieldBlock label="SORT REPOS BY">
              <OptionGroup
                value={local.repoSortBy}
                options={["stars", "forks", "updated", "pinned-first"] as const}
                labels={{
                  stars: "STARS",
                  forks: "FORKS",
                  updated: "RECENTLY UPDATED",
                  "pinned-first": "PINNED FIRST",
                }}
                onChange={(v) => set("repoSortBy", v)}
              />
            </FieldBlock>

            <FieldBlock label="REPO DISPLAY STYLE">
              <OptionGroup
                value={local.repoDisplayStyle}
                options={["table", "cards", "compact"] as const}
                labels={{
                  table: "TABLE",
                  cards: "CARDS (2 COLS)",
                  compact: "COMPACT LIST",
                }}
                onChange={(v) => set("repoDisplayStyle", v)}
              />
            </FieldBlock>

            {/* == ABOUT == */}
            <SectionHeader id="about" label="ABOUT TEXT" />

            <div className="px-6 py-4 border-b border-border space-y-1.5">
              <textarea
                value={local.aboutText ?? ""}
                onChange={(e) =>
                  set("aboutText", e.target.value.slice(0, 1000))
                }
                placeholder="WRITE A SHORT BIO OR DESCRIPTION THAT APPEARS ON YOUR PORTFOLIO…"
                rows={6}
                className="w-full px-3 py-2.5 border border-border bg-background font-mono text-xs resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
              />
              <div className="flex items-center justify-between">
                <span className="label text-muted-foreground text-[9px]">
                  DISPLAYED IN THE ABOUT SECTION ON YOUR PORTFOLIO
                </span>
                <span className="label text-[9px]">
                  {(local.aboutText ?? "").length}/1000
                </span>
              </div>
            </div>

            {/* == TECH STACK == */}
            <SectionHeader id="stack" label="TECH STACK" />

            <div className="px-6 py-4 border-b border-border">
              <TechStackInput
                value={local.techStack ?? []}
                onChange={(v) => set("techStack", v)}
              />
              <p className="label text-muted-foreground mt-3 text-[9px]">
                UP TO 30 TECHNOLOGIES — DISPLAYED AS TAGS ON YOUR PORTFOLIO
              </p>
            </div>

            {/* == FEATURED REPO == */}
            <SectionHeader id="featured" label="FEATURED REPO" />

            <div className="px-6 py-4 border-b border-border space-y-2">
              <p className="label text-muted-foreground text-[9px]">
                SELECT ONE REPO TO FEATURE AT THE TOP OF YOUR REPOSITORIES
                SECTION
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => set("featuredRepo", null)}
                  className={`px-2.5 py-1 border text-[10px] font-mono uppercase tracking-wider transition-colors active:scale-[0.98] ${
                    !local.featuredRepo
                      ? "border-foreground text-foreground bg-muted"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  NONE
                </button>
                {(user.githubData?.repos ?? [])
                  .sort((a, b) => b.stargazers_count - a.stargazers_count)
                  .slice(0, 12)
                  .map((repo) => (
                    <button
                      key={repo.name}
                      type="button"
                      onClick={() => set("featuredRepo", repo.name)}
                      className={`px-2.5 py-1 border text-[10px] font-mono uppercase tracking-wider transition-colors active:scale-[0.98] ${
                        local.featuredRepo === repo.name
                          ? "border-foreground text-foreground bg-muted"
                          : "border-border text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {repo.name}
                    </button>
                  ))}
              </div>
            </div>

            {/* == SECTIONS & ORDER == */}
            <SectionHeader id="sections" label="SECTIONS & ORDER" />

            <div className="border-b border-border">
              <div className="px-6 py-3">
                <p className="label text-muted-foreground text-[9px]">
                  DRAG THE ORDER OF SECTIONS AND TOGGLE THEIR VISIBILITY ON YOUR
                  PORTFOLIO
                </p>
              </div>
              {sectionOrder.map((id, idx) => (
                <SectionRow
                  key={id}
                  id={id}
                  label={SECTION_LABELS[id] ?? id.toUpperCase()}
                  hidden={hideSections.includes(id)}
                  isFirst={idx === 0}
                  isLast={idx === sectionOrder.length - 1}
                  onToggle={() => toggleSection(id)}
                  onMoveUp={() => moveSectionUp(idx)}
                  onMoveDown={() => moveSectionDown(idx)}
                />
              ))}
            </div>

            {/* == CUSTOM LINKS == */}
            <SectionHeader id="links" label="CUSTOM LINKS" />

            <div className="px-6 py-4 border-b border-border">
              <CustomLinksEditor
                value={local.customLinks ?? []}
                onChange={(v) => set("customLinks", v)}
              />
            </div>

            {/* ── BOTTOM SAVE ─── */}
            <div className="px-6 py-6 flex items-center justify-between gap-4">
              <div>
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1.5 label text-foreground">
                    <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                    CHANGES SAVED SUCCESSFULLY
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="flex items-center gap-1.5 label text-primary">
                    <WarningCircle weight="fill" className="w-3.5 h-3.5" />
                    SAVE FAILED — PLEASE RETRY
                  </span>
                )}
                {isDirty && saveStatus === "idle" && (
                  <span className="label text-muted-foreground">
                    YOU HAVE UNSAVED CHANGES
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveStatus === "saving" || !isDirty}
                className={`flex items-center gap-2 px-6 py-2.5 border text-[11px] font-mono uppercase tracking-wider transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDirty
                    ? "border-foreground bg-foreground text-background hover:bg-foreground/90"
                    : "border-border text-muted-foreground"
                }`}
              >
                {saveStatus === "saving" ? (
                  <>
                    <Spinner
                      weight="bold"
                      className="w-3.5 h-3.5 animate-spin"
                    />{" "}
                    SAVING…
                  </>
                ) : (
                  <>
                    <FloppyDisk weight="bold" className="w-3.5 h-3.5" /> SAVE
                    CHANGES
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
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
    onChange([
      ...value,
      { label: newLabel.trim().toUpperCase(), url: safeUrl },
    ]);
    setNewLabel("");
    setNewUrl("");
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="divide-y divide-border border border-border">
          {value.map((link, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <span className="label text-foreground truncate flex-1">
                {link.label}
              </span>
              <span className="label text-muted-foreground truncate flex-1 text-right">
                {link.url.replace(/^https?:\/\//, "")}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
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
            placeholder="LABEL"
            className="flex-1 px-3 py-2 border border-border bg-background font-mono text-xs uppercase tracking-wider placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            className="flex-[2] px-3 py-2 border border-border bg-background font-mono text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
          />
          <button
            type="button"
            onClick={addLink}
            className="px-4 py-2 border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors active:scale-[0.98] shrink-0"
          >
            ADD
          </button>
        </div>
      )}
      <p className="label text-muted-foreground text-[9px]">
        {value.length}/10 LINKS — SHOWN IN THE LINKS SECTION AND META STRIP
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
