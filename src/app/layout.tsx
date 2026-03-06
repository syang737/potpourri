import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { PotMascot } from "@/components/PotMascot";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Potpourri - Daily Trivia",
  description:
    "Guess the top items for daily trivia puzzles across multiple categories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-cream/80 border-b border-border">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <PotMascot size={36} />
              <span className="text-xl font-extrabold text-warm-brown tracking-tight group-hover:text-accent transition-colors duration-150">
                Potpourri
              </span>
            </Link>
            <nav className="flex items-center gap-2 md:gap-3">
              <Link
                href="/"
                className="px-3 py-1.5 md:px-4 md:py-2 text-sm font-bold bg-accent hover:bg-accent-hover text-white rounded-full transition-colors duration-150 shadow-sm"
              >
                Play
              </Link>
              <Link
                href="/about"
                className="px-3 py-1.5 md:px-4 md:py-2 text-sm font-semibold text-warm-brown hover:text-accent hover:bg-peach/50 rounded-full transition-all duration-150"
              >
                About
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">{children}</main>
        <footer className="border-t border-border mt-16">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 flex items-center justify-between text-sm text-warm-brown/60 font-semibold">
            <span>Potpourri &mdash; Daily Trivia</span>
            <a
              href="https://buymeacoffee.com/simonmyang7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFDD00] text-[#000000] text-xs font-bold hover:opacity-90 transition-opacity duration-150 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
              Buy me a coffee
            </a>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
