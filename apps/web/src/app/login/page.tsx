"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GithubLogo, ArrowRight, WarningCircle, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

const ERRORS: Record<string, string> = {
  oauth_failed: "GITHUB OAUTH FAILED. PLEASE RETRY.",
  token_exchange_failed: "TOKEN EXCHANGE FAILED. PLEASE RETRY.",
  server_error: "SERVER ERROR. PLEASE RETRY.",
};

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 label hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          INITMYFOLIO
        </Link>
        <ThemeToggle />
      </div>

      {/* Terminal card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px] border border-border">
          {/* Terminal header */}
          <div className="border-b border-border px-4 py-2 bg-muted flex items-center justify-between">
            <span className="label">[ AUTHENTICATION TERMINAL ]</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-primary rounded-full" />
              <span className="label text-primary">ONLINE</span>
            </div>
          </div>

          <div className="p-8">
            {/* Brand */}
            <div className="mb-8">
              <div className="font-display uppercase tracking-tighter text-foreground text-3xl mb-1">INITMYFOLIO</div>
              <div className="label">PORTFOLIO GENERATION SYSTEM · REV 1.0</div>
            </div>

            {/* Data lines */}
            <div className="space-y-1.5 mb-6 border border-border p-4 bg-muted">
              {[
                ["PROTOCOL", "GITHUB OAUTH 2.0"],
                ["SCOPE", "READ:USER // USER:EMAIL"],
                ["ACCESS", "PUBLIC DATA ONLY"],
                ["SESSION", "JWT / 30D TTL"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="label w-20 shrink-0">{k}</span>
                  <span className="label text-foreground">{v}</span>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 border border-primary p-3 mb-4 bg-primary/5">
                <WarningCircle weight="fill" className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="label text-primary">{ERRORS[error] ?? "AUTH ERROR. RETRY."}</span>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => { setLoading(true); window.location.href = `${API_URL}/auth/github`; }}
              disabled={loading}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-foreground text-background border border-foreground text-sm font-mono uppercase tracking-wider hover:bg-primary hover:border-primary transition-colors duration-200 active:scale-[0.98] disabled:opacity-50 group"
            >
              <div className="flex items-center gap-2.5">
                <GithubLogo weight="bold" className="w-4 h-4" />
                {loading ? "CONNECTING…" : "AUTHENTICATE VIA GITHUB"}
              </div>
              {!loading && <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>

            <p className="label text-center mt-5">
              BY CONTINUING YOU ACCEPT OUR{" "}
              <Link href="/terms" className="text-foreground underline underline-offset-2">TERMS</Link>
              {" "}AND{" "}
              <Link href="/privacy" className="text-foreground underline underline-offset-2">PRIVACY POLICY</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>;
}
