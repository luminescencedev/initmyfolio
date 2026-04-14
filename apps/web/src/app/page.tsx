import Link from "next/link";
import {
  GithubLogo,
  ArrowRight,
  Star,
  Lightning,
  Globe,
  CheckCircle,
  Lock,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "@/components/theme-toggle";

/* ─── Portfolio preview mockup ───────────────────────── */
function PortfolioPreview() {
  return (
    <div className="relative">
      {/* Decorative blur blobs */}
      <div className="absolute -top-8 -right-8 w-48 h-48 bg-primary/8 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-sky-400/8 dark:bg-sky-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Browser chrome */}
      <div className="relative bg-[hsl(220_20%_95%)] dark:bg-zinc-900 rounded-2xl border border-[hsl(220_20%_88%)] dark:border-zinc-800/60 shadow-elevated overflow-hidden">
        {/* URL bar */}
        <div className="px-4 py-3 border-b border-[hsl(220_20%_88%)] dark:border-zinc-800 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 bg-white dark:bg-zinc-800/60 rounded-md px-3 py-1 border border-[hsl(220_20%_88%)] dark:border-zinc-700/60">
            <span className="text-[10px] font-mono text-muted-foreground">
              alexmorgan.initmyfolio.com
            </span>
          </div>
          <ArrowSquareOut
            weight="regular"
            className="w-3.5 h-3.5 text-muted-foreground/50"
          />
        </div>

        {/* Portfolio content */}
        <div className="bg-white dark:bg-zinc-950 p-5">
          {/* Profile header */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 shrink-0 shadow-sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">
                Alex Morgan
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Full-stack · San Francisco
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Open to work
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              ["47", "Repos"],
              ["2.4k", "Stars"],
              ["312", "Forks"],
            ].map(([v, l]) => (
              <div
                key={l}
                className="bg-zinc-50 dark:bg-zinc-900/60 rounded-xl p-2.5 text-center border border-zinc-100 dark:border-zinc-800/60"
              >
                <div className="text-sm font-bold text-foreground font-mono leading-tight">
                  {v}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {l}
                </div>
              </div>
            ))}
          </div>

          {/* Repos */}
          <div className="space-y-1.5 mb-4">
            {[
              {
                name: "neural-search",
                lang: "TypeScript",
                color: "#3178c6",
                stars: "2.4k",
              },
              {
                name: "pg-streamer",
                lang: "Go",
                color: "#00ADD8",
                stars: "847",
              },
              {
                name: "css-houdini-lab",
                lang: "JavaScript",
                color: "#f1e05a",
                stars: "203",
              },
            ].map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100/80 dark:border-zinc-800/60 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="text-xs font-medium text-foreground truncate">
                    {r.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    {r.lang}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <Star weight="regular" className="w-3 h-3" />
                  <span className="text-[10px] font-mono">{r.stars}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Language bar */}
          <div className="space-y-1.5">
            <div className="h-1.5 rounded-full overflow-hidden flex gap-px">
              {[
                ["#3178c6", "58%"],
                ["#00ADD8", "24%"],
                ["#f1e05a", "12%"],
                ["#dea584", "6%"],
              ].map(([c, w]) => (
                <div
                  key={c}
                  style={{ backgroundColor: c, width: w }}
                  className="first:rounded-l-full last:rounded-r-full"
                />
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              {[
                ["TypeScript", "#3178c6", "58%"],
                ["Go", "#00ADD8", "24%"],
              ].map(([l, c, p]) => (
                <div key={String(l)} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: String(c) }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {l} {p}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Marquee strip ───────────────────────────────────── */
function MarqueeStrip() {
  const items = [
    "Portfolio Generator",
    "·",
    "Under 30s Setup",
    "·",
    "Hourly Auto-Sync",
    "·",
    "MIT License",
    "·",
    "SEO Ready",
    "·",
    "Open Source",
    "·",
    "Self-Hostable",
    "·",
  ];
  const doubled = [...items, ...items];

  return (
    <div
      aria-hidden="true"
      className="border-y border-[hsl(220_14%_88%)] bg-[hsl(220_14%_95%)] dark:border-border/60 dark:bg-secondary/50 overflow-hidden py-3"
    >
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span
            key={i}
            className={`text-[11px] font-medium mx-5 whitespace-nowrap select-none ${
              item === "·"
                ? "text-muted-foreground/40"
                : "text-muted-foreground/70"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Pricing card ────────────────────────────────────── */
function PricingCard({
  tier,
  eyebrow,
  price,
  period,
  features,
  cta,
  href,
  highlighted,
}: {
  tier: string;
  eyebrow: string;
  price: string;
  period: string;
  features: { text: string; included: boolean }[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
        highlighted
          ? "border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_8px_32px_-4px_rgba(0,0,0,0.08)]"
          : "border-border bg-card shadow-card"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold tracking-wide shadow-sm">
            <Lightning weight="fill" className="w-2.5 h-2.5" />
            Recommended
          </span>
        </div>
      )}

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-3">
          {eyebrow}
        </div>
        <div className="text-sm font-semibold text-foreground mb-1">{tier}</div>
        <div className="flex items-baseline gap-1.5 mt-3">
          <span className="text-4xl font-bold tracking-tight text-foreground">
            {price}
          </span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>
      </div>

      <ul className="space-y-3 flex-1">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5">
            {f.included ? (
              <CheckCircle
                weight="fill"
                className="w-4 h-4 text-primary shrink-0 mt-0.5"
              />
            ) : (
              <Lock
                weight="regular"
                className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5"
              />
            )}
            <span
              className={`text-sm ${f.included ? "text-foreground" : "text-muted-foreground/50"}`}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] group ${
          highlighted
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_12px_hsl(var(--primary)/0.3)]"
            : "bg-foreground text-background hover:bg-foreground/90"
        }`}
      >
        {cta}
        <ArrowRight
          weight="bold"
          className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
        />
      </Link>
    </div>
  );
}

/* ─── Main landing page ───────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── NAV ─────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <nav
          aria-label="Main navigation"
          className="max-w-5xl mx-auto bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/50 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
        >
          <div className="h-14 px-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="font-semibold text-sm text-foreground tracking-tight">
                InitMyFolio
              </span>
              <div className="hidden md:flex items-center gap-5">
                <a
                  href="#how-it-works"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  How it works
                </a>
                <a
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Pricing
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all duration-200 active:scale-[0.97] group"
              >
                <GithubLogo weight="bold" className="w-4 h-4" />
                <span className="hidden sm:inline">Connect GitHub</span>
                <span className="sm:hidden">Connect</span>
                <ArrowRight
                  weight="bold"
                  className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        id="main-content"
        aria-label="Hero"
        className="max-w-6xl mx-auto px-4 sm:px-6 pt-36 pb-16 md:pt-40 md:pb-24"
      >
        <div className="grid md:grid-cols-[1fr_400px] gap-16 lg:gap-24 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 dark:bg-primary/15 border border-primary/15 dark:border-primary/20 mb-6 animate-fade-up">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">
                GitHub Portfolio Generator
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-tight leading-[1.05] text-foreground animate-fade-up delay-100">
              Turn your GitHub
              <br />
              <span className="text-primary">into a portfolio.</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-[46ch] animate-fade-up delay-200">
              Connect once. Get your own portfolio page at{" "}
              <code className="text-foreground bg-secondary px-1.5 py-0.5 rounded-md text-sm font-mono">
                username.initmyfolio.com
              </code>{" "}
              in seconds. Repos, languages, stats — fully automatic.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8 animate-fade-up delay-300">
              <Link
                href="/login"
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all duration-200 active:scale-[0.97] shadow-[0_2px_8px_rgba(0,0,0,0.12)] group"
              >
                <GithubLogo weight="bold" className="w-4 h-4" />
                Connect with GitHub
                <ArrowRight
                  weight="bold"
                  className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-all duration-200"
              >
                See how it works
              </a>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-border/60 animate-fade-up delay-400">
              {[
                ["< 30s", "Setup time"],
                ["Hourly", "Auto-refresh"],
                ["MIT", "License"],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="text-base font-bold text-foreground">{v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: preview */}
          <div className="hidden md:block animate-fade-up delay-200">
            <PortfolioPreview />
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────── */}
      <MarqueeStrip />

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-24"
      >
        <div className="mb-14">
          <div className="text-xs font-mono uppercase tracking-widest text-primary/70 mb-3">
            How it works
          </div>
          <h2
            id="how-it-works-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight text-foreground"
          >
            Three steps. Zero config.
          </h2>
        </div>

        <div className="space-y-0 divide-y divide-border/60">
          {[
            {
              n: "01",
              icon: <GithubLogo weight="regular" className="w-5 h-5" />,
              title: "Connect",
              desc: "Sign in with your GitHub account. We request read-only access to your public profile and repositories. Your data stays yours.",
            },
            {
              n: "02",
              icon: <Lightning weight="regular" className="w-5 h-5" />,
              title: "Build",
              desc: "InitMyFolio fetches your repos, languages, and stats. Aggregated, ranked, and structured automatically — no manual curation required.",
            },
            {
              n: "03",
              icon: <Globe weight="regular" className="w-5 h-5" />,
              title: "Share",
              desc: "Your portfolio is live at username.initmyfolio.com within 30 seconds. SEO-optimized, fast, with hourly data refresh.",
            },
          ].map((step) => (
            <div
              key={step.n}
              className="grid md:grid-cols-[120px_1fr_1fr] gap-4 md:gap-12 py-10 items-start"
            >
              <div className="font-mono text-6xl font-bold text-[hsl(220_14%_88%)] dark:text-[hsl(220_14%_25%)] leading-none select-none">
                {step.n}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center text-primary shrink-0">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed md:max-w-[44ch]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES BENTO ───────────────────────────────── */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="max-w-6xl mx-auto px-4 sm:px-6 pb-24"
      >
        <div className="mb-14">
          <div className="text-xs font-mono uppercase tracking-widest text-primary/70 mb-3">
            Architecture
          </div>
          <h2
            id="features-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight text-foreground"
          >
            Built for speed.
          </h2>
        </div>

        {/* Bento grid — 2/3 + 1/3, then 1/3 + 2/3 */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Large card: sync architecture */}
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-8 shadow-card">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-5">
              Sync engine
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Sync once. Serve forever.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-[50ch]">
              GitHub data is synced once and stored in PostgreSQL. Portfolio
              pages are served directly from the database — zero GitHub API
              calls at runtime. No rate limits, no latency.
            </p>
            <div className="flex items-center gap-0">
              {[
                ["GitHub API", "sync"],
                ["PostgreSQL", "cache"],
                ["Portfolio", "serve"],
              ].map(([l, r], i) => (
                <div
                  key={l}
                  className={`flex-1 px-4 py-3 bg-secondary/60 border border-border/60 text-center ${i === 0 ? "rounded-l-xl" : i === 2 ? "rounded-r-xl" : ""}`}
                >
                  <div className="text-xs font-medium text-foreground">{l}</div>
                  <div className="text-[10px] font-mono text-primary mt-0.5 uppercase tracking-wide">
                    {r}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Small card: setup time */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card flex flex-col justify-between">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Setup time
            </div>
            <div>
              <div className="text-7xl font-bold tracking-tighter text-foreground leading-none mb-2">
                30
                <span className="text-3xl text-muted-foreground font-medium">
                  s
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                From GitHub OAuth to live portfolio page.
              </p>
            </div>
          </div>

          {/* Small card: auto sync */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card flex flex-col justify-between">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Auto-sync
            </div>
            <div>
              <div className="text-7xl font-bold tracking-tighter text-foreground leading-none mb-2">
                8
                <span className="text-3xl text-muted-foreground font-medium">
                  h
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatic refresh keeps your portfolio up to date.
              </p>
            </div>
          </div>

          {/* Large card: customization */}
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-8 shadow-card">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-5">
              Customization
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Full control over your portfolio.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-[50ch]">
              Choose your accent color, layout variant, hero style, section
              order, and more. Set your availability status, add a tech stack,
              pin repos, and write a custom bio.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Accent colors",
                "Layout variants",
                "Section order",
                "Custom links",
                "Tech stack",
                "Featured repo",
              ].map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border/60 text-xs font-medium text-foreground"
                >
                  <CheckCircle weight="fill" className="w-3 h-3 text-primary" />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section
        id="pricing"
        aria-labelledby="pricing-heading"
        className="max-w-6xl mx-auto px-4 sm:px-6 pb-24"
      >
        <div className="mb-14">
          <div className="text-xs font-mono uppercase tracking-widest text-primary/70 mb-3">
            Pricing
          </div>
          <h2
            id="pricing-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight text-foreground"
          >
            Simple, honest pricing.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-3xl">
          <PricingCard
            tier="Free"
            eyebrow="Forever free"
            price="$0"
            period="/ forever"
            features={[
              { text: "Public portfolio page", included: true },
              { text: "Auto-sync every 8 hours", included: true },
              { text: "username.initmyfolio.com", included: true },
              { text: "All repos, languages, stats", included: true },
              { text: "SEO + Open Graph", included: true },
              { text: "Custom domain", included: false },
              { text: "Custom themes & layouts", included: false },
            ]}
            cta="Start free"
            href="/login"
          />
          <PricingCard
            tier="Pro"
            eyebrow="For serious portfolios"
            price="$7"
            period="/ month"
            features={[
              { text: "Everything in Free", included: true },
              { text: "Custom domain support", included: true },
              { text: "Priority sync (1h)", included: true },
              { text: "Custom themes + layouts", included: true },
              { text: "Analytics dashboard", included: true },
              { text: "Pin and reorder sections", included: true },
              { text: "Remove InitMyFolio branding", included: true },
            ]}
            cta="Upgrade — $7/mo"
            href="/login"
            highlighted
          />
        </div>

        <div className="mt-5 max-w-3xl">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/15">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-sm text-primary/80 font-medium">
              Pro launching soon — all accounts will receive a free trial on
              launch.
            </span>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="rounded-2xl border border-border bg-card p-10 md:p-16 shadow-card">
          <div className="grid md:grid-cols-[1fr_auto] items-center gap-8">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-primary/70 mb-3">
                Ready?
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
                Live in 30 seconds.
              </h2>
              <p className="text-muted-foreground text-sm">
                No credit card. No configuration. Just GitHub.
              </p>
            </div>
            <Link
              href="/login"
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all duration-200 active:scale-[0.97] shadow-[0_2px_12px_hsl(var(--primary)/0.35)] group whitespace-nowrap"
            >
              <GithubLogo weight="bold" className="w-4 h-4" />
              Create portfolio
              <ArrowRight
                weight="bold"
                className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-sm text-foreground">
              InitMyFolio
            </span>
            <span className="text-muted-foreground/40 text-sm">·</span>
            <span className="text-xs text-muted-foreground">© 2025</span>
            <span className="text-muted-foreground/40 text-sm">·</span>
            <span className="text-xs text-muted-foreground">MIT License</span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="https://github.com/yourusername/initmyfolio"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <GithubLogo className="w-3.5 h-3.5" /> Source
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
