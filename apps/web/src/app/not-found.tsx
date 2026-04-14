import Link from "next/link";
import { ArrowRight, House } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      {/* ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/4 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Glass card */}
        <div className="rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] p-10 flex flex-col items-start gap-6">
          {/* Big 404 */}
          <div
            className="font-bold tracking-tighter text-foreground leading-none select-none"
            style={{ fontSize: "clamp(4rem, 18vw, 7rem)" }}
          >
            404
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Page not found
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[38ch]">
              This portfolio doesn't exist yet — or the URL is wrong. Create
              yours in under 30 seconds.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all duration-200 active:scale-[0.98] group flex-1"
            >
              Create your portfolio
              <ArrowRight
                weight="bold"
                className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <House weight="regular" className="w-3.5 h-3.5" />
              Home
            </Link>
          </div>
        </div>

        {/* Attribution */}
        <p className="text-center text-xs text-muted-foreground/60 mt-5">
          initmyfolio.com
        </p>
      </div>
    </div>
  );
}
