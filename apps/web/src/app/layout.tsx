import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { default: "InitMyFolio — GitHub Portfolio Generator", template: "%s | InitMyFolio" },
  description: "Generate a beautiful portfolio from your GitHub profile in seconds. No code required.",
  openGraph: { type: "website", locale: "en_US", siteName: "InitMyFolio" },
  twitter: { card: "summary_large_image", site: "@initmyfolio" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(GeistSans.variable, GeistMono.variable, "min-h-screen bg-background font-sans antialiased")}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
