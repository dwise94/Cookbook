import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const hand = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cookbook – Share & collect recipes",
  description: "Create a cookbook, share the link, and let others add and browse recipes.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cookbook",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2f453c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${hand.variable}`}>
      <body className="font-sans antialiased min-h-screen min-h-dvh">
        <header className="safe-pt sticky top-0 z-40 border-b border-black/15 bg-desk-deep/95 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <a
              href="/"
              className="font-display text-xl sm:text-2xl text-paper tracking-tight"
            >
              Cookbook
            </a>
            <nav className="flex items-center gap-1 sm:gap-3">
              <a
                href="/my-cookbooks"
                className="btn-ghost text-sm sm:text-base whitespace-nowrap"
              >
                My cookbooks
              </a>
              <a
                href="/create"
                className="rounded-md bg-binding hover:bg-binding-hover text-white text-sm sm:text-base font-medium px-3 py-2 min-h-10 inline-flex items-center"
              >
                Create
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8 safe-pb">{children}</main>
      </body>
    </html>
  );
}
