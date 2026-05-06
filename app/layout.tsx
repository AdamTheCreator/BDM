import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Signal-PE",
  description: "PE/BD prep that mirrors WSP and fills the origination gap.",
};

const NAV = [
  { href: "/learn", label: "Learn" },
  { href: "/practice/paper-lbo", label: "Practice" },
  { href: "/interviews/behavioral", label: "Interviews" },
  { href: "/deals/feed", label: "Deals" },
  { href: "/firms", label: "Firms" },
  { href: "/progress", label: "Progress" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/" className="font-semibold tracking-tight">
                Signal-PE
              </Link>
              <nav className="flex gap-5 text-sm">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-200 dark:border-zinc-800">
            <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-zinc-500">
              Self-hosted. Built for one learner. Spec in README.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
