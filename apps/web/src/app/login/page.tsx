"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  GithubLogo,
  WarningCircle,
  ArrowLeft,
  Spinner,
  ShieldCheck,
  Lock,
  Timer,
} from "@phosphor-icons/react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/api";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

const ERRORS: Record<string, string> = {
  oauth_failed: "GitHub OAuth failed. Please try again.",
  token_exchange_failed: "Token exchange failed. Please try again.",
  server_error: "Server error. Please try again.",
};

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setChecking(false);
      return;
    }
    getCurrentUser(token).then((user) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        localStorage.removeItem("auth_token");
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Spinner weight="bold" className="w-4 h-4 animate-spin text-primary" />
          Checking session…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Floating nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3 rounded-2xl border border-border/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            initmyfolio
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12">
        <div className="w-full max-w-[400px]">
          {/* Glass card */}
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            <div className="px-8 pt-8 pb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <GithubLogo weight="bold" className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground mb-1.5">
                Sign in to initmyfolio
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect your GitHub account to generate and manage your
                developer portfolio.
              </p>
            </div>

            <div className="px-8 pb-8 space-y-4">
              {/* Permission info */}
              <div className="rounded-xl border border-border bg-secondary/50 divide-y divide-border/60">
                {[
                  {
                    icon: ShieldCheck,
                    label: "Public data only",
                    detail: "Read-only access to profile & repos",
                  },
                  {
                    icon: Lock,
                    label: "Secure OAuth 2.0",
                    detail: "We never store your password",
                  },
                  {
                    icon: Timer,
                    label: "30-day session",
                    detail: "Re-authenticate anytime",
                  },
                ].map(({ icon: Icon, label, detail }) => (
                  <div key={label} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/50">
                      <Icon
                        weight="regular"
                        className="w-3.5 h-3.5 text-muted-foreground"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground">
                        {label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <WarningCircle
                    weight="fill"
                    className="w-4 h-4 text-destructive mt-0.5 shrink-0"
                  />
                  <span className="text-xs text-destructive">
                    {ERRORS[error] ?? "Authentication error. Please try again."}
                  </span>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => {
                  setLoading(true);
                  window.location.href = `${API_URL}/auth/github`;
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner weight="bold" className="w-4 h-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <GithubLogo weight="bold" className="w-4 h-4" />
                    Continue with GitHub
                  </>
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                By continuing you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Already have a portfolio?{" "}
            <Link
              href="/"
              className="text-foreground font-medium hover:underline underline-offset-2"
            >
              View examples
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
