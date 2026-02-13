import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

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
      <body className="antialiased bg-gray-50 min-h-screen font-sans">
        <header className="border-b bg-white">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Potpourri
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/about"
                className="text-gray-600 hover:text-gray-900"
              >
                About
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t bg-white mt-auto">
          <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
            Potpourri &mdash; Daily Top Ten Trivia
          </div>
        </footer>
      </body>
    </html>
  );
}
