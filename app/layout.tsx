import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cookbook – Share & collect recipes",
  description: "Create a cookbook, share the link, and let others add and browse recipes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <header className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <a href="/" className="font-semibold text-lg text-stone-800 dark:text-stone-100">
              Cookbook
            </a>
            <nav className="flex items-center gap-4">
              <a
                href="/my-cookbooks"
                className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:underline"
              >
                My cookbooks
              </a>
              <a
                href="/create"
                className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline"
              >
                Create a cookbook
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
