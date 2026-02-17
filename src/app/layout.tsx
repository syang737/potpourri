import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { PotMascot } from "@/components/PotMascot";

export const metadata: Metadata = {
  title: "Potpourri - Daily Top Ten Trivia",
  description:
    "Guess the top ten items for daily trivia puzzles across multiple categories.",
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
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 text-center text-sm text-warm-brown/60 font-semibold">
            Potpourri &mdash; Daily Top Ten Trivia
          </div>
        </footer>
      </body>
    </html>
  );
}
