import Link from "next/link";
import { ArrowRight, ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <div className="border-b border-border px-6 py-3">
        <Link href="/" className="flex items-center gap-2 label hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          INITMYFOLIO
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[480px] border border-border">
          <div className="border-b border-border px-4 py-2 bg-muted flex items-center justify-between">
            <span className="label">[ ERROR TERMINAL ]</span>
            <span className="font-mono text-[10px] text-primary">STATUS 404</span>
          </div>

          <div className="p-8">
            <div className="font-display uppercase tracking-tighter text-foreground leading-none mb-4"
              style={{ fontSize: "clamp(4rem, 15vw, 8rem)" }}>
              404
            </div>

            <div className="border-l-2 border-primary pl-4 mb-8">
              <div className="label mb-1">[ ERROR MESSAGE ]</div>
              <div className="text-sm font-mono text-foreground">PORTFOLIO NOT FOUND.</div>
              <div className="text-xs text-muted-foreground mt-1">
                THIS PORTFOLIO DOES NOT EXIST IN THE DATABASE.
                <br />CREATE YOURS IN UNDER 30 SECONDS.
              </div>
            </div>

            <div className="space-y-2">
              <Link href="/"
                className="flex items-center justify-between w-full px-4 py-3 bg-foreground text-background border border-foreground text-[11px] font-mono uppercase tracking-wider hover:bg-primary hover:border-primary transition-colors group">
                CREATE YOUR PORTFOLIO
                <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/"
                className="flex items-center gap-2 w-full px-4 py-3 border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
                BACK TO HOME
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
