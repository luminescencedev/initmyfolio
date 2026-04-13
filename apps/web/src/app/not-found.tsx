import Link from "next/link";
import { Code2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
            <Code2 className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-700 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Portfolio not found</h2>
        <p className="text-gray-400 mb-8">
          This portfolio doesn't exist yet.{" "}
          <br className="hidden sm:block" />
          Create yours in seconds.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          Create your portfolio
        </Link>
      </div>
    </div>
  );
}
