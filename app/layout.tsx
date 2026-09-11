import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
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

export const metadata: Metadata = {
  title: "Cooking with Friends",
  description: "A cookbook that belongs to your group — invite friends, cook, rate, and share.",
  appleWebApp: {
    capable: true,
    title: "Cooking with Friends",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f0eee9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased min-h-screen min-h-dvh">
        <header className="safe-pt sticky top-0 z-40 border-b border-ink/10 bg-surface/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <a
              href="/"
              className="font-display text-lg sm:text-2xl text-ink tracking-tight inline-flex items-center gap-2 min-w-0"
            >
              <img
                src="/cooking-friends-mascot.png"
                alt=""
                width={40}
                height={40}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover shrink-0"
              />
              <span className="truncate">Cooking with Friends</span>
            </a>
            <SiteNav />
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8 safe-pb">{children}</main>
      </body>
    </html>
  );
}
