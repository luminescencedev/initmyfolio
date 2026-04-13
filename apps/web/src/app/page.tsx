import Link from "next/link";
import { Github, Zap, Globe, Shield, Star, GitFork, Code2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50 bg-[#0d1117]/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">InitMyFolio</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/yourusername/initmyfolio"
              target="_blank"
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
              Open Source
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-8">
          <Zap className="w-3.5 h-3.5" />
          Open source · Self-hostable · No vendor lock-in
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
          Your GitHub profile,
          <br />
          beautifully showcased
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Connect your GitHub account and get a stunning portfolio instantly.
          Hosted at{" "}
          <span className="text-white font-mono">
            username.initmyfolio.com
          </span>{" "}
          — no code required.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </Link>
          <Link
            href="#demo"
            className="px-6 py-3 border border-white/20 rounded-lg font-semibold hover:bg-white/5 transition-colors"
          >
            See a demo
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { value: "< 30s", label: "Setup time" },
            { value: "100%", label: "Static & fast" },
            { value: "Free", label: "Open source" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything you need, nothing you don't
        </h2>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
          InitMyFolio pulls your GitHub data automatically and keeps your portfolio
          up to date — no manual updates ever.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="w-6 h-6" />,
              title: "Instant setup",
              description:
                "Connect GitHub → portfolio goes live. That's it. Your repos, stats, and languages are synced automatically.",
            },
            {
              icon: <Globe className="w-6 h-6" />,
              title: "Custom subdomain",
              description:
                "Your portfolio lives at username.initmyfolio.com. Fast, SEO-optimized, and statically generated.",
            },
            {
              icon: <Shield className="w-6 h-6" />,
              title: "No rate limits",
              description:
                "Data is synced in background and cached. Your portfolio loads instantly without hitting GitHub's API.",
            },
            {
              icon: <Star className="w-6 h-6" />,
              title: "Repos & stats",
              description:
                "Showcases your top repositories sorted by stars, with languages, descriptions, and live links.",
            },
            {
              icon: <Code2 className="w-6 h-6" />,
              title: "Language breakdown",
              description:
                "Beautiful language distribution charts showing exactly what you code in — aggregated across all your repos.",
            },
            {
              icon: <GitFork className="w-6 h-6" />,
              title: "Open source",
              description:
                "Fully open source and self-hostable on any VPS with Docker Compose. No vendor lock-in.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/20 to-transparent p-16">
          <h2 className="text-4xl font-bold mb-4">
            Ready to build your portfolio?
          </h2>
          <p className="text-gray-400 mb-8">
            Join developers who showcase their work with InitMyFolio.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors"
          >
            <Github className="w-6 h-6" />
            Get your portfolio now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-sm text-gray-500">
          <span>© 2025 InitMyFolio. Open source.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link
              href="https://github.com/yourusername/initmyfolio"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
