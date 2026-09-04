import Link from "next/link";
import { PaperSheet } from "@/components/PaperSheet";

export default function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PaperSheet className="text-center sm:text-left !px-6 sm:!pl-14">
        <p className="font-display text-binding text-sm tracking-wide uppercase mb-2">
          Your shared kitchen journal
        </p>
        <h1 className="paper-title text-3xl sm:text-5xl text-ink text-balance">
          Cookbook
        </h1>
        <p className="muted text-cooking mt-3 max-w-xl mx-auto sm:mx-0">
          Create a book, share a contribute link or QR so friends can add recipes, and keep a
          read-only copy for browsing while you cook.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-start justify-center">
          <Link href="/create" className="btn-primary">
            Create a cookbook
          </Link>
          <Link href="/my-cookbooks" className="btn-secondary">
            My cookbooks
          </Link>
        </div>
      </PaperSheet>
    </div>
  );
}
