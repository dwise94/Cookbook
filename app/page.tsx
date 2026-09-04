import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 dark:text-stone-100">
        Share recipes with anyone
      </h1>
      <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
        Create a cookbook and share a contribute link (or QR) so friends can add recipes—or a
        read-only link for browsing only. You stay in control as the admin: no accounts required
        for guests.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/create"
          className="inline-flex items-center justify-center rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-3 transition-colors"
        >
          Create a cookbook
        </Link>
      </div>
    </div>
  );
}
