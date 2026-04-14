import type { Metadata } from "next";
import { Archivo_Black } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ReduxProvider } from "@/components/redux-provider";
import { cn } from "@/lib/utils";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InitMyFolio — GitHub Portfolio Generator",
    template: "%s | InitMyFolio",
  },
  description:
    "Generate a portfolio from your GitHub profile. Live in 30 seconds.",
  openGraph: { type: "website", locale: "en_US", siteName: "InitMyFolio" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script in <head> — Server Component renders this into raw HTML.
            Runs synchronously during browser parse, before React hydrates.
            Prevents flash of wrong theme without any client-side warnings. */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-component */}
        <script
          // biome-ignore lint: intentional inline script for FOUC prevention
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(_){}`,
          }}
        />
      </head>
      <body
        className={cn(
          GeistSans.variable,
          GeistMono.variable,
          archivoBlack.variable,
          "min-h-dvh bg-background font-sans antialiased",
        )}
      >
        {/* Skip navigation link — WCAG 2.4.1 Bypass Blocks */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ReduxProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
