import type { NextConfig } from "next";

const apiUrl = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

// Domains that are allowed to embed portfolio pages in iframes
// (the dashboard at initmyfolio.com embeds username.initmyfolio.com)
const frameAncestors =
  process.env["NODE_ENV"] === "production"
    ? "frame-ancestors 'self' initmyfolio.com *.initmyfolio.com"
    : "frame-ancestors 'self' localhost:* 127.0.0.1:*";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is required for the theme-detection inline script
  // and for Tailwind/CSS-in-JS. Remove once nonces are implemented.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // GitHub avatars + our own assets
  "img-src 'self' https://avatars.githubusercontent.com https://github.com data: blob:",
  // API calls from the browser
  `connect-src 'self' ${apiUrl}`,
  "font-src 'self'",
  frameAncestors,
]
  .join("; ")
  .trim();

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@initmyfolio/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS — only in production (HTTP in dev would break things)
          ...(process.env["NODE_ENV"] === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
