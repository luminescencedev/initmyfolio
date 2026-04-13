import type { Metadata } from "next";
import { Archivo_Black } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
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
  description: "Generate a portfolio from your GitHub profile. Live in 30 seconds.",
  openGraph: { type: "website", locale: "en_US", siteName: "InitMyFolio" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          GeistSans.variable,
          GeistMono.variable,
          archivoBlack.variable,
          "min-h-[100dvh] bg-background font-sans antialiased"
        )}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
