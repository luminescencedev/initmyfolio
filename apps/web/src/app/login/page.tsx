"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GithubLogo, WarningCircle, ArrowLeft } from "@phosphor-icons/react";
import { Code } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "GitHub OAuth failed. Please try again.",
  token_exchange_failed: "Could not authenticate with GitHub.",
  server_error: "Something went wrong on our end.",
};

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[360px]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-11 h-11 bg-foreground rounded-2xl flex items-center justify-center mb-5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)]">
              <Code weight="bold" className="w-5 h-5 text-background" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Sign in to InitMyFolio</h1>
            <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-[28ch]">
              We only request read access to your public GitHub data.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-destructive/25 bg-destructive/8 text-destructive text-sm mb-4">
              <WarningCircle weight="fill" className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{ERROR_MESSAGES[error] ?? "An error occurred."}</span>
            </div>
          )}

          <button
            onClick={() => { setLoading(true); window.location.href = `${API_URL}/auth/github`; }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-foreground text-background rounded-xl font-semibold text-sm hover:bg-foreground/90 transition-all duration-200 ease-spring active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_0_rgba(255,255,255,0.1)_inset]"
          >
            <GithubLogo weight="bold" className="w-4 h-4" />
            {loading ? "Redirecting…" : "Continue with GitHub"}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>;
}
