import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InitMyFolio — GitHub Portfolio Generator",
    template: "%s | InitMyFolio",
  },
  description:
    "Generate a beautiful portfolio from your GitHub profile in seconds. No code required.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "InitMyFolio",
  },
  twitter: {
    card: "summary_large_image",
    site: "@initmyfolio",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          jetbrainsMono.variable,
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        {children}
      </body>
    </html>
  );
}
