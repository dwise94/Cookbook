import Link from "next/link";
import { PaperSheet } from "@/components/PaperSheet";

export default function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PaperSheet className="text-center sm:text-left space-y-4">
        <p className="font-display text-sage text-sm tracking-wide uppercase">
          A cookbook for your group
        </p>
        <h1 className="display-title text-3xl sm:text-5xl text-ink text-balance">
          Cooking with Friends!
        </h1>
        <p className="muted text-cooking max-w-xl mx-auto sm:mx-0">
          Create a cookbook, invite friends to join, cook each other&apos;s recipes, and leave
          ratings so the next cook knows what&apos;s good.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-start justify-center pt-1">
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
