import Link from "next/link";
import {
  GithubLogo, Lightning, Globe, ShieldCheck,
  Star, GitFork, Code, ArrowRight,
  ArrowClockwise
} from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "@/components/theme-toggle";

function PortfolioMockup() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] overflow-hidden text-left">
      {/* Mockup header */}
      <div className="border-b border-border p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shrink-0" />
        <div>
          <div className="text-sm font-semibold text-foreground">alexmorgan</div>
          <div className="text-xs text-muted-foreground">Full-stack engineer</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[["2.4k", "Stars"], ["47", "Repos"], ["312", "Followers"]].map(([v, l]) => (
          <div key={l} className="px-3 py-3 text-center">
            <div className="text-sm font-bold text-foreground font-mono">{v}</div>
            <div className="text-[10px] text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
      {/* Repo list */}
      <div className="p-3 space-y-2">
        {[
          { name: "neural-search", lang: "TypeScript", stars: "847", color: "#3178c6" },
          { name: "pg-streamer", lang: "Go", stars: "312", color: "#00ADD8" },
          { name: "css-houdini-lab", lang: "JavaScript", stars: "203", color: "#f1e05a" },
        ].map((repo) => (
          <div key={repo.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/60 hover:bg-muted transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: repo.color }} />
              <span className="text-xs font-medium text-foreground truncate">{repo.name}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              <Star weight="fill" className="w-3 h-3" />
              <span className="text-[10px] font-mono">{repo.stars}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Language bar */}
      <div className="px-3 pb-4">
        <div className="flex rounded-full overflow-hidden h-1.5 mt-1">
          {[["#3178c6", "58%"], ["#00ADD8", "24%"], ["#f1e05a", "18%"]].map(([c, w]) => (
            <div key={c} style={{ backgroundColor: c, width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Code weight="bold" className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">InitMyFolio</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="https://github.com/yourusername/initmyfolio" target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              <GithubLogo weight="regular" className="w-4 h-4" />
              Source
            </Link>
            <ThemeToggle />
            <Link href="/login"
              className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors duration-200 active:scale-[0.98]">
              Get started
              <ArrowRight weight="bold" className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — ASYMMETRIC SPLIT (left-aligned, right visual) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-[1fr_auto] gap-12 items-center">
          {/* Left: content */}
          <div className="max-w-xl stagger">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted text-muted-foreground text-xs font-medium mb-6 animate-fade-up">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Open source — MIT License
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tighter leading-[1.05] mb-5 animate-fade-up">
              Your GitHub,
              <br />
              <span className="text-primary">as a portfolio.</span>
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-[52ch] mb-8 animate-fade-up">
              Connect GitHub and get a portfolio at{" "}
              <code className="text-foreground font-mono text-sm bg-muted border border-border px-1.5 py-0.5 rounded-md">
                username.initmyfolio.com
              </code>
              {" "}instantly. Repos, languages, stats — all automatic.
            </p>
            <div className="flex flex-wrap items-center gap-3 animate-fade-up">
              <Link href="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl font-semibold text-sm hover:bg-foreground/90 transition-all duration-300 ease-spring active:scale-[0.98]">
                <GithubLogo weight="bold" className="w-4 h-4" />
                Continue with GitHub
              </Link>
              <Link href="#features"
                className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm text-foreground hover:bg-muted transition-all duration-300 ease-spring">
                See how it works
                <ArrowRight weight="regular" className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-8 animate-fade-up">
              {[["< 30s", "to go live"], ["Hourly", "auto-refresh"], ["0", "API calls at runtime"]].map(([v, l]) => (
                <div key={l}>
                  <div className="text-sm font-bold text-foreground font-mono">{v}</div>
                  <div className="text-xs text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mockup */}
          <div className="hidden md:flex justify-end">
            <PortfolioMockup />
          </div>
        </div>
      </section>

      {/* Features — ASYMMETRIC GRID (not 3 equal cards) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-border">
        <div className="mb-10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Built for developers who ship,<br className="hidden md:block" /> not for writing bios.
          </h2>
        </div>

        {/* Asymmetric 2+1+1+2 bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Row 1: 2 + 1 */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-border bg-card hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)] transition-shadow duration-300">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Lightning weight="bold" className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Live in under 30 seconds</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[48ch]">
              Sign in once. Your portfolio is published before you finish reading this sentence. No forms, no config, no waiting.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)] transition-shadow duration-300">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <ShieldCheck weight="bold" className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Zero GitHub calls at runtime</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All data cached in PostgreSQL. Pages load fast regardless of GitHub API status.
            </p>
          </div>

          {/* Row 2: 1 + 2 */}
          <div className="p-6 rounded-2xl border border-border bg-card hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)] transition-shadow duration-300">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <ArrowClockwise weight="bold" className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Auto-sync every 8h</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Background cron keeps portfolios fresh. Manual sync available from dashboard.
            </p>
          </div>
          <div className="md:col-span-2 p-6 rounded-2xl border border-border bg-card hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)] transition-shadow duration-300">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Globe weight="bold" className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">username.initmyfolio.com</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[52ch]">
              Your own subdomain. No path slugs, no shared namespaces. Just your name, clean and shareable. SEO-optimized with Open Graph, Twitter cards, and JSON-LD.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-border bg-card p-10 md:p-14 grid md:grid-cols-[1fr_auto] items-center gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
              Start in 30 seconds
            </h2>
            <p className="text-muted-foreground text-sm">
              No credit card. No configuration. Just GitHub.
            </p>
          </div>
          <Link href="/login"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all duration-300 ease-spring active:scale-[0.98] whitespace-nowrap">
            <GithubLogo weight="bold" className="w-4 h-4" />
            Create your portfolio
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <Code weight="bold" className="w-3 h-3 text-primary-foreground" />
            </div>
            InitMyFolio · MIT
          </div>
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="https://github.com/yourusername/initmyfolio" target="_blank"
              className="flex items-center gap-1 hover:text-foreground transition-colors">
              <GithubLogo className="w-3.5 h-3.5" /> Source
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
