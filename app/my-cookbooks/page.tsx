"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CookbookEntry = { id: string; name: string; recipeCount: number };

export default function MyCookbooksPage() {
  const router = useRouter();
  const [cookbooks, setCookbooks] = useState<CookbookEntry[]>([]);
  const [creatorUsername, setCreatorUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/creator-cookbooks")
      .then((r) => r.json())
      .then((data) => {
        setCookbooks(data.cookbooks ?? []);
        setCreatorUsername(data.creatorUsername ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/creator-logout", { method: "POST" });
    setCookbooks([]);
    setCreatorUsername(null);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-stone-500 dark:text-stone-400">
        Loading…
      </div>
    );
  }

  if (cookbooks.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          My cookbooks
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          {creatorUsername === null
            ? "Log in to see cookbooks you’ve created."
            : "You don’t have any cookbooks yet, or none match the username and password you used to log in."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {creatorUsername === null ? (
            <Link
              href="/login"
              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 inline-block"
            >
              Log in
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium px-4 py-2"
            >
              Log out
            </button>
          )}
          <Link
            href="/create"
            className="rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium px-4 py-2 inline-block hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            Create a cookbook
          </Link>
        </div>
        <p className="text-sm">
          <Link href="/" className="text-amber-600 dark:text-amber-400 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            My cookbooks
          </h1>
          {creatorUsername && (
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Logged in as {creatorUsername}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium px-4 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          Log out
        </button>
      </div>

      <ul className="space-y-2">
        {cookbooks.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h2 className="font-semibold text-stone-800 dark:text-stone-100">{c.name}</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {c.recipeCount} recipe{c.recipeCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/cookbook/${c.id}`}
                  className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 text-sm"
                >
                  Open
                </Link>
                <Link
                  href={`/cookbook/${c.id}/admin`}
                  className="rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium px-4 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Admin
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-sm">
        <Link href="/create" className="text-amber-600 dark:text-amber-400 hover:underline">
          Create another cookbook
        </Link>
      </p>
    </div>
  );
}
