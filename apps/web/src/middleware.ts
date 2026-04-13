import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_DOMAIN = process.env["NEXT_PUBLIC_APP_DOMAIN"] ?? "localhost:3000";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const url = request.nextUrl.clone();

  // Extract subdomain
  // In production: username.initmyfolio.com → username
  // In development with custom domain: username.localhost:3000 → username
  const domainParts = host.split(".");

  // Production: x.initmyfolio.com → ["x", "initmyfolio", "com"]
  // Dev: x.localhost:3000 → ["x", "localhost:3000"] (after removing port)

  // Check if it's a subdomain request
  const isSubdomain =
    host !== APP_DOMAIN &&
    !host.startsWith("www.") &&
    domainParts.length >= 2 &&
    (APP_DOMAIN.includes("initmyfolio.com")
      ? host.endsWith(".initmyfolio.com")
      : host.includes(".localhost"));

  if (isSubdomain) {
    const username = domainParts[0];

    // Skip internal Next.js paths
    if (
      url.pathname.startsWith("/_next") ||
      url.pathname.startsWith("/api") ||
      url.pathname.startsWith("/static")
    ) {
      return NextResponse.next();
    }

    // Rewrite to the portfolio page
    url.pathname = `/${username}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
