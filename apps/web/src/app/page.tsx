import Link from "next/link";
import {
  GithubLogo, ArrowRight, Star, Lightning,
  ArrowClockwise, Globe, CheckCircle, Lock
} from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "@/components/theme-toggle";

/* ─── Portfolio preview mockup ─── */
function PortfolioPreview() {
  return (
    <div className="border border-border bg-card w-full max-w-[340px]">
      {/* Header strip */}
      <div className="border-b border-border p-3 flex items-center justify-between">
        <div className="label">[ LIVE PREVIEW ]</div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-primary rounded-full" />
          <span className="label text-primary">ACTIVE</span>
        </div>
      </div>

      {/* Profile */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
            <GithubLogo weight="thin" className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground font-display uppercase">alexmorgan</div>
            <div className="label">Full-stack engineer</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0 border border-border divide-x divide-border">
          {[["47", "REPOS"], ["2.4K", "STARS"], ["312", "FORKS"]].map(([v, l]) => (
            <div key={l} className="p-2 text-center">
              <div className="text-sm font-bold text-foreground font-mono">{v}</div>
              <div className="label">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Repos */}
      <div className="border-b border-border">
        {[
          { name: "neural-search", lang: "TS", stars: "2.4K", color: "#3178c6" },
          { name: "pg-streamer", lang: "Go", stars: "847", color: "#00ADD8" },
          { name: "css-houdini-lab", lang: "JS", stars: "203", color: "#f1e05a" },
        ].map((r, i) => (
          <div key={r.name} className={`flex items-center justify-between px-4 py-2.5 ${i < 2 ? "border-b border-border" : ""}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
              <span className="text-xs font-mono text-foreground">{r.name}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star weight="regular" className="w-3 h-3" />
              <span className="text-[10px] font-mono">{r.stars}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Language bar */}
      <div className="p-4">
        <div className="label mb-2">LANGUAGE DISTRIBUTION</div>
        <div className="flex h-1.5 w-full mb-2">
          {[["#3178c6", "58%"], ["#00ADD8", "24%"], ["#f1e05a", "12%"], ["#dea584", "6%"]].map(([c, w]) => (
            <div key={c} style={{ backgroundColor: c, width: w }} />
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          {[["TypeScript", "#3178c6", "58%"], ["Go", "#00ADD8", "24%"], ["JS", "#f1e05a", "12%"]].map(([l, c, p]) => (
            <div key={String(l)} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: String(c) }} />
              <span className="text-[10px] font-mono text-muted-foreground">{l} {p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* URL footer */}
      <div className="border-t border-border px-4 py-2">
        <span className="text-[10px] font-mono text-primary">alexmorgan.initmyfolio.com</span>
      </div>
    </div>
  );
}

/* ─── Marquee strip ─── */
function MarqueeStrip() {
  const items = [
    "[ < 30S SETUP ]",
    "///",
    "[ HOURLY SYNC ]",
    "///",
    "[ MIT LICENSE ]",
    "///",
    "[ SELF-HOSTABLE ]",
    "///",
    "[ SEO READY ]",
    "///",
    "[ OPEN SOURCE ]",
    "///",
  ];
  const doubled = [...items, ...items];

  return (
    <div className="border-y border-border bg-foreground text-background overflow-hidden py-2.5">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="label text-background mx-4 whitespace-nowrap" style={{ opacity: item === "///" ? 0.35 : 1 }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Pricing card ─── */
function PricingCard({
  tier, price, period, features, cta, href, highlighted,
}: {
  tier: string; price: string; period: string;
  features: { text: string; pro?: boolean }[];
  cta: string; href: string; highlighted?: boolean;
}) {
  return (
    <div className={`border ${highlighted ? "border-primary" : "border-border"} relative`}>
      {highlighted && (
        <div className="absolute -top-px left-4 px-2 py-0.5 bg-primary">
          <span className="label text-primary-foreground">RECOMMENDED</span>
        </div>
      )}
      <div className={`p-6 border-b ${highlighted ? "border-primary/40" : "border-border"}`}>
        <div className="label mb-3">{tier}</div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl text-foreground uppercase tracking-tighter">{price}</span>
          <span className="label">{period}</span>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {features.map((f) => (
          <div key={f.text} className="flex items-start gap-2.5">
            {f.pro ? (
              <Lock weight="bold" className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            ) : (
              <CheckCircle weight="bold" className="w-3.5 h-3.5 text-foreground mt-0.5 shrink-0" />
            )}
            <span className={`text-xs font-mono ${f.pro ? "text-muted-foreground" : "text-foreground"}`}>{f.text}</span>
          </div>
        ))}
      </div>
      <div className="px-6 pb-6">
        <Link
          href={href}
          className={`flex items-center justify-between w-full px-4 py-3 border text-sm font-mono uppercase tracking-wider transition-colors duration-200 active:scale-[0.98] group ${
            highlighted
              ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
              : "border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground"
          }`}
        >
          {cta}
          <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-display text-sm uppercase tracking-tighter text-foreground">INITMYFOLIO</span>
            <div className="hidden md:flex items-center gap-5">
              <a href="#features" className="label hover:text-foreground transition-colors">HOW IT WORKS</a>
              <a href="#pricing" className="label hover:text-foreground transition-colors">PRICING</a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login"
              className="flex items-center gap-2 px-4 py-1.5 border border-foreground bg-foreground text-background text-[11px] font-mono uppercase tracking-wider hover:bg-transparent hover:text-foreground transition-colors duration-200 active:scale-[0.98]">
              CONNECT GITHUB
              <ArrowRight weight="bold" className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="grid md:grid-cols-[1fr_340px] gap-12 lg:gap-20 items-start">
          {/* Left content */}
          <div>
            <div className="label mb-6 animate-fade-up">[ PORTFOLIO GENERATOR · REV 1.0 ]</div>

            <h1 className="font-display uppercase leading-[0.9] tracking-tighter text-foreground animate-fade-up delay-100" style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}>
              YOUR<br />
              GITHUB
            </h1>
            <div className="flex items-center gap-3 my-1 animate-fade-up delay-200">
              <div className="h-px flex-1 bg-border" />
              <span className="label">AS A</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <h1 className="font-display uppercase leading-[0.9] tracking-tighter animate-fade-up delay-300" style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}>
              <span className="text-primary">PORTFOLIO<span className="text-foreground">.</span></span>
            </h1>

            <div className="mt-8 mb-8 animate-fade-up delay-400">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[52ch]">
                Connect GitHub once. Get a portfolio at{" "}
                <code className="text-foreground font-mono text-xs border border-border px-1.5 py-0.5">username.initmyfolio.com</code>
                {" "}instantly. Repos, languages, stats — fully automatic.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 animate-fade-up delay-400">
              <Link href="/login"
                className="flex items-center gap-3 px-5 py-3 bg-foreground text-background border border-foreground text-sm font-mono uppercase tracking-wider hover:bg-primary hover:border-primary transition-colors duration-200 active:scale-[0.98] group">
                <GithubLogo weight="bold" className="w-4 h-4" />
                CONNECT GITHUB
                <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a href="#pricing"
                className="flex items-center gap-2 px-5 py-3 border border-border text-sm font-mono uppercase tracking-wider hover:border-foreground transition-colors duration-200">
                VIEW PLANS
              </a>
            </div>

            {/* Quick stats */}
            <div className="mt-10 pt-6 border-t border-border grid grid-cols-3 gap-0 animate-fade-up delay-400">
              {[
                ["< 30S", "SETUP TIME"],
                ["HOURLY", "AUTO-REFRESH"],
                ["MIT", "LICENSE"],
              ].map(([v, l]) => (
                <div key={l} className="pr-6">
                  <div className="font-mono text-lg font-bold text-foreground">{v}</div>
                  <div className="label mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: live preview */}
          <div className="hidden md:block pt-4">
            <div className="label mb-3">[ LIVE DEMO → alexmorgan.initmyfolio.com ]</div>
            <PortfolioPreview />
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────── */}
      <MarqueeStrip />

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="border-b border-border pb-6 mb-12">
          <div className="label mb-2">[ 01 / HOW IT WORKS ]</div>
          <h2 className="font-display uppercase tracking-tighter text-foreground" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
            THREE STEPS.<br />ZERO CONFIG.
          </h2>
        </div>

        {/* Zig-zag steps (NOT 3 equal cards) */}
        <div className="space-y-0">
          {[
            {
              n: "01",
              icon: <GithubLogo weight="bold" className="w-5 h-5" />,
              title: "CONNECT",
              desc: "Sign in with your GitHub account. We request read-only access to your public profile and repositories. Your data stays yours.",
              align: "left",
            },
            {
              n: "02",
              icon: <Lightning weight="bold" className="w-5 h-5" />,
              title: "BUILD",
              desc: "InitFolio fetches your repos, languages, and stats from GitHub. Aggregated, ranked, and structured — automatically. No manual curation.",
              align: "right",
            },
            {
              n: "03",
              icon: <Globe weight="bold" className="w-5 h-5" />,
              title: "SHARE",
              desc: "Your portfolio is live at username.initmyfolio.com within 30 seconds. SEO-optimized, fast, statically generated with hourly refresh.",
              align: "left",
            },
          ].map((step, i) => (
            <div
              key={step.n}
              className={`grid md:grid-cols-2 border-b border-border ${i === 0 ? "border-t" : ""}`}
            >
              {step.align === "right" && <div className="hidden md:block border-r border-border" />}
              <div className={`p-8 md:p-12 ${step.align === "right" ? "md:border-l-0" : "border-r md:border-r border-border"}`}>
                <div className="flex items-start gap-5">
                  <span className="font-mono text-5xl font-bold text-border leading-none shrink-0">{step.n}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-primary">{step.icon}</div>
                      <h3 className="font-display text-xl uppercase tracking-tighter text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[42ch]">{step.desc}</p>
                  </div>
                </div>
              </div>
              {step.align === "left" && <div className="hidden md:block border-l border-border" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH FEATURES (asymmetric bento, not 3-col) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-0 border border-border">
          <div className="md:col-span-2 p-8 border-b md:border-b-0 md:border-r border-border">
            <div className="label mb-4">[ ARCHITECTURE ]</div>
            <h3 className="font-display uppercase tracking-tighter text-foreground text-2xl mb-3">
              SYNC ONCE.<br />SERVE FOREVER.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[52ch]">
              GitHub data is synced once and stored in PostgreSQL. Portfolio pages are statically generated and served directly from the database — zero GitHub API calls at runtime. No rate limits, no latency.
            </p>
            <div className="mt-6 flex gap-0 border border-border w-fit">
              {[["GITHUB API", "sync"], ["POSTGRES", "cache"], ["PORTFOLIO", "serve"]].map(([l, r], i) => (
                <div key={l} className={`px-4 py-2.5 ${i < 2 ? "border-r border-border" : ""}`}>
                  <div className="label">{l}</div>
                  <div className="label text-primary">{r.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-8 border-b md:border-b-0 border-border">
            <div className="label mb-4">[ SYNC ENGINE ]</div>
            <div className="space-y-4">
              {[
                { icon: <ArrowClockwise weight="bold" className="w-4 h-4" />, label: "AUTO-SYNC", value: "EVERY 8H" },
                { icon: <Lightning weight="bold" className="w-4 h-4" />, label: "MANUAL SYNC", value: "5 MIN COOLDOWN" },
                { icon: <Star weight="bold" className="w-4 h-4" />, label: "TOP REPOS", value: "UP TO 100" },
                { icon: <Globe weight="bold" className="w-4 h-4" />, label: "ISR CACHE", value: "3600S TTL" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {item.icon}
                    <span className="label">{item.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="border-b border-border pb-6 mb-10">
          <div className="label mb-2">[ 02 / PLANS ]</div>
          <h2 className="font-display uppercase tracking-tighter text-foreground" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
            SIMPLE PRICING.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-0 border border-border">
          <div className="border-b md:border-b-0 md:border-r border-border">
            <PricingCard
              tier="[ FREE ]"
              price="$0"
              period="/ FOREVER"
              features={[
                { text: "Basic portfolio page" },
                { text: "Auto-sync every 8 hours" },
                { text: "username.initmyfolio.com" },
                { text: "All repos, languages, stats" },
                { text: "SEO + Open Graph" },
                { text: "Custom domain", pro: true },
                { text: "Custom themes", pro: true },
              ]}
              cta="START FREE"
              href="/login"
            />
          </div>
          <div>
            <PricingCard
              tier="[ PRO ]"
              price="$7"
              period="/ MONTH"
              features={[
                { text: "Everything in Free" },
                { text: "Custom domain support" },
                { text: "Priority sync (1h)" },
                { text: "Custom themes + layouts" },
                { text: "Analytics dashboard" },
                { text: "Pin and reorder sections" },
                { text: "Remove InitFolio branding" },
              ]}
              cta="UPGRADE — $7/MO"
              href="/login"
              highlighted
            />
          </div>
        </div>

        <div className="mt-4 border border-border border-t-0 px-6 py-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full" />
          <span className="label">PRO LAUNCHING SOON — ALL ACCOUNTS GET FREE TRIAL ON LAUNCH</span>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="border border-border grid md:grid-cols-[1fr_auto] items-center gap-8 p-10 md:p-14">
          <div>
            <div className="label mb-3">[ READY? ]</div>
            <h2 className="font-display uppercase tracking-tighter text-foreground" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
              LIVE IN 30 SECONDS.
            </h2>
            <p className="text-sm text-muted-foreground mt-2">No credit card. No configuration. Just GitHub.</p>
          </div>
          <Link href="/login"
            className="flex items-center gap-3 px-6 py-3.5 bg-primary border border-primary text-primary-foreground text-sm font-mono uppercase tracking-wider hover:bg-primary/90 transition-colors duration-200 active:scale-[0.98] group whitespace-nowrap">
            <GithubLogo weight="bold" className="w-4 h-4" />
            CREATE PORTFOLIO
            <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-display text-sm uppercase tracking-tighter text-foreground">INITMYFOLIO</span>
            <span className="label">© 2025</span>
            <span className="label">///</span>
            <span className="label">MIT LICENSE</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="label hover:text-foreground transition-colors">PRIVACY</Link>
            <Link href="/terms" className="label hover:text-foreground transition-colors">TERMS</Link>
            <Link href="https://github.com/yourusername/initmyfolio" target="_blank"
              className="flex items-center gap-1.5 label hover:text-foreground transition-colors">
              <GithubLogo className="w-3 h-3" /> SOURCE
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
