"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PaperSheet } from "@/components/PaperSheet";

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
      <PaperSheet lined={false} className="text-center">
        <p className="muted">Loading…</p>
      </PaperSheet>
    );
  }

  if (cookbooks.length === 0) {
    return (
      <PaperSheet lined={false} className="max-w-md mx-auto text-center space-y-4">
        <h1 className="paper-title text-2xl text-ink">My cookbooks</h1>
        <p className="muted">
          {creatorUsername === null
            ? "Log in to see cookbooks you’ve created."
            : "You don’t have any cookbooks yet, or none match the username and password you used to log in."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {creatorUsername === null ? (
            <Link href="/login" className="btn-primary">
              Log in
            </Link>
          ) : (
            <button type="button" onClick={handleLogout} className="btn-secondary">
              Log out
            </button>
          )}
          <Link href="/create" className="btn-secondary">
            Create a cookbook
          </Link>
        </div>
        <p className="text-sm">
          <Link href="/" className="text-sage hover:underline">
            Back to home
          </Link>
        </p>
      </PaperSheet>
    );
  }

  return (
    <div className="space-y-4">
      <PaperSheet lined={false} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="paper-title text-2xl sm:text-3xl text-ink">My cookbooks</h1>
          {creatorUsername && <p className="muted text-sm">Logged in as {creatorUsername}</p>}
        </div>
        <button type="button" onClick={handleLogout} className="btn-secondary text-sm">
          Log out
        </button>
      </PaperSheet>

      <ul className="space-y-3">
        {cookbooks.map((c) => (
          <li key={c.id}>
            <PaperSheet lined={false} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-ink">{c.name}</h2>
                <p className="text-sm muted">
                  {c.recipeCount} recipe{c.recipeCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Link href={`/cookbook/${c.id}`} className="btn-primary text-center">
                  Open
                </Link>
                <Link href={`/cookbook/${c.id}/admin`} className="btn-secondary text-center">
                  Admin
                </Link>
              </div>
            </PaperSheet>
          </li>
        ))}
      </ul>

      <p className="text-center sm:text-left">
        <Link href="/create" className="text-sage hover:underline text-sm font-medium">
          Create another cookbook
        </Link>
      </p>
    </div>
  );
}
