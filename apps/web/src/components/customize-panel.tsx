"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import {
  CheckCircle,
  Spinner,
  WarningCircle,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";
import type { PortfolioUser } from "@/lib/api";
import { updateSettings } from "@/lib/api";

type UserSettings = PortfolioUser["settings"];

interface Props {
  user: PortfolioUser;
  token: string;
  onSettingsSaved?: (settings: UserSettings) => void;
}

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

/* ─── sub-components ─── */

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
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
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

/* ─── TechStackInput ─── */
function TechStackInput({
  value,
  onChange,
}: {
  value: Array<{ name: string; category?: string }>;
  onChange: (v: Array<{ name: string; category?: string }>) => void;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim().replace(/,$/, "").trim();
    if (!trimmed) return;
    if (value.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...value, { name: trimmed.toUpperCase() }]);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder="ADD TECH... (ENTER OR ,)"
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

/* ─── Main panel ─── */
export function CustomizePanel({ user, token, onSettingsSaved }: Props) {
  const [local, setLocal] = useState<UserSettings>(user.settings ?? {});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const isFirstRender = useRef(true);

  // Sync from parent when user changes (e.g. after sync)
  useEffect(() => {
    setLocal(user.settings ?? {});
  }, [user.settings]);

  // Debounce autosave — skip on mount
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(async () => {
      setStatus("saving");
      const ok = await updateSettings(token, user.username, local);
      setStatus(ok ? "saved" : "error");
      if (ok) {
        onSettingsSaved?.(local);
        setTimeout(() => setStatus("idle"), 2000);
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  // Section order management
  const rawOrder: string[] = local.sectionOrder ?? [...ALL_SECTIONS];
  // Ensure all sections are present (append missing ones)
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

  return (
    <div className="border border-border mt-0">
      {/* Header */}
      <div className="border-b border-border px-4 py-2.5 bg-muted flex items-center justify-between">
        <span className="label text-foreground">[ CUSTOMIZE PORTFOLIO ]</span>
        <div className="flex items-center gap-1.5">
          {status === "saving" && (
            <>
              <Spinner
                weight="bold"
                className="w-3.5 h-3.5 animate-spin text-muted-foreground"
              />
              <span className="label">SAVING…</span>
            </>
          )}
          {status === "saved" && (
            <>
              <CheckCircle
                weight="fill"
                className="w-3.5 h-3.5 text-foreground"
              />
              <span className="label text-foreground">SAVED</span>
            </>
          )}
          {status === "error" && (
            <>
              <WarningCircle
                weight="fill"
                className="w-3.5 h-3.5 text-primary"
              />
              <span className="label text-primary">ERROR</span>
            </>
          )}
        </div>
      </div>

      {/* ── APPEARANCE ── */}
      <div>
        <div className="border-b border-border px-4 py-2 bg-muted/50">
          <span className="label text-[9px] tracking-widest">APPEARANCE</span>
        </div>

        <div className="divide-y divide-border">
          {/* Accent color */}
          <div className="px-4 py-3 space-y-2">
            <div className="label">ACCENT COLOR</div>
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set("accentColor", color)}
                  title={color.toUpperCase()}
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
          </div>

          {/* Layout variant */}
          <div className="px-4 py-3 space-y-2">
            <div className="label">LAYOUT VARIANT</div>
            <OptionGroup
              value={local.layoutVariant}
              options={["brutalist", "glass", "clean", "editorial"] as const}
              labels={{
                brutalist: "BRUTALIST",
                glass: "GLASS",
                clean: "CLEAN",
                editorial: "EDITORIAL",
              }}
              onChange={(v) => set("layoutVariant", v)}
            />
          </div>

          {/* Hero name style */}
          <div className="px-4 py-3 space-y-2">
            <div className="label">HERO NAME STYLE</div>
            <OptionGroup
              value={local.heroStyle}
              options={["name-full", "name-initials", "name-split"] as const}
              labels={{
                "name-full": "FULL",
                "name-initials": "INITIALS",
                "name-split": "SPLIT",
              }}
              onChange={(v) => set("heroStyle", v)}
            />
          </div>

          {/* Font style */}
          <div className="px-4 py-3 space-y-2">
            <div className="label">FONT STYLE</div>
            <OptionGroup
              value={local.fontStyle}
              options={["display", "mono", "mixed"] as const}
              labels={{ display: "DISPLAY", mono: "MONO", mixed: "MIXED" }}
              onChange={(v) => set("fontStyle", v)}
            />
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="border-t border-border">
        <div className="border-b border-border px-4 py-2 bg-muted/50">
          <span className="label text-[9px] tracking-widest">CONTENT</span>
        </div>

        <div className="px-4 py-3 space-y-2">
          <div className="label mb-2">AVAILABILITY BADGE</div>
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
        </div>

        <div className="px-4 border-t border-border">
          <Toggle
            value={local.showEmail}
            onChange={(v) => set("showEmail", v)}
            label="SHOW EMAIL"
          />
          <Toggle
            value={local.showAvatar}
            onChange={(v) => set("showAvatar", v)}
            label="SHOW AVATAR"
          />
          <Toggle
            value={local.showTopics}
            onChange={(v) => set("showTopics", v)}
            label="SHOW REPO TOPICS"
          />
        </div>

        <div className="px-4 py-3 border-t border-border space-y-3">
          <div className="space-y-2">
            <div className="label">REPOS TO SHOW</div>
            <OptionGroup
              value={local.maxRepos}
              options={[4, 6, 8, 12] as const}
              onChange={(v) => set("maxRepos", v)}
            />
          </div>
          <div className="space-y-2">
            <div className="label">SORT BY</div>
            <OptionGroup
              value={local.repoSortBy}
              options={["stars", "forks", "updated", "pinned-first"] as const}
              labels={{
                stars: "STARS",
                forks: "FORKS",
                updated: "UPDATED",
                "pinned-first": "PINNED",
              }}
              onChange={(v) => set("repoSortBy", v)}
            />
          </div>
          <div className="space-y-2">
            <div className="label">DISPLAY AS</div>
            <OptionGroup
              value={local.repoDisplayStyle}
              options={["table", "cards", "compact"] as const}
              labels={{ table: "TABLE", cards: "CARDS", compact: "COMPACT" }}
              onChange={(v) => set("repoDisplayStyle", v)}
            />
          </div>
        </div>
      </div>

      {/* ── ABOUT TEXT ── */}
      <div className="border-t border-border">
        <div className="border-b border-border px-4 py-2 bg-muted/50">
          <span className="label text-[9px] tracking-widest">ABOUT TEXT</span>
        </div>
        <div className="p-4 space-y-1.5">
          <textarea
            value={local.aboutText ?? ""}
            onChange={(e) => set("aboutText", e.target.value.slice(0, 1000))}
            placeholder="WRITE A SHORT BIO DISPLAYED ON YOUR PORTFOLIO..."
            rows={4}
            className="w-full px-3 py-2 border border-border bg-background font-mono text-xs resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors max-h-40"
          />
          <div className="text-right label">
            {(local.aboutText ?? "").length}/1000
          </div>
        </div>
      </div>

      {/* ── TECH STACK ── */}
      <div className="border-t border-border">
        <div className="border-b border-border px-4 py-2 bg-muted/50">
          <span className="label text-[9px] tracking-widest">TECH STACK</span>
        </div>
        <div className="p-4">
          <TechStackInput
            value={local.techStack ?? []}
            onChange={(v) => set("techStack", v)}
          />
        </div>
      </div>

      {/* ── FEATURED REPO ── */}
      <div className="border-t border-border">
        <div className="border-b border-border px-4 py-2 bg-muted/50">
          <span className="label text-[9px] tracking-widest">
            FEATURED REPO
          </span>
        </div>
        <div className="p-4 space-y-2">
          <div className="label text-muted-foreground">
            PINNED FIRST — SELECT A REPO TO FEATURE AT THE TOP
          </div>
          <div className="flex flex-wrap gap-1">
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
            {[...(user.githubData?.repos ?? [])]
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
      </div>

      {/* ── SECTIONS & ORDER ── */}
      <div className="border-t border-border">
        <div className="border-b border-border px-4 py-2 bg-muted/50">
          <span className="label text-[9px] tracking-widest">
            VISIBLE SECTIONS &amp; ORDER
          </span>
        </div>
        <div>
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
      </div>
    </div>
  );
}
