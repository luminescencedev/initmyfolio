"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Github, Code2, AlertCircle } from "lucide-react";
import { Suspense } from "react";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    oauth_failed: "GitHub OAuth failed. Please try again.",
    token_exchange_failed: "Failed to authenticate with GitHub. Please try again.",
    server_error: "Server error. Please try again later.",
  };

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = `${API_URL}/auth/github`;
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">InitMyFolio</span>
        </div>

        {/* Card */}
        <div className="bg-[#161b22] border border-white/10 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Create your portfolio
          </h1>
          <p className="text-gray-400 mb-8">
            Connect your GitHub account to generate a beautiful portfolio in seconds.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessages[error] ?? "An error occurred. Please try again."}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Github className="w-5 h-5" />
            {isLoading ? "Redirecting to GitHub..." : "Continue with GitHub"}
          </button>

          <p className="text-xs text-gray-500 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            We only request read access to your public GitHub data.
          </p>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to home
          </a>
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
