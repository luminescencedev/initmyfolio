import Link from "next/link";
import { Code, ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Code weight="thin" className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-center text-6xl font-bold text-border mb-4 tracking-tighter">404</p>
        <h1 className="text-center text-lg font-semibold text-foreground mb-2 tracking-tight">Portfolio not found</h1>
        <p className="text-center text-sm text-muted-foreground mb-8 leading-relaxed">
          This portfolio does not exist yet. Create yours in seconds.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]">
            Create your portfolio
          </Link>
          <Link href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200">
            <ArrowLeft weight="regular" className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
