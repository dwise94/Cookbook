"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PaperSheet } from "@/components/PaperSheet";

type CookbookEntry = { id: string; name: string; recipeCount: number; role?: string };

export default function MyCookbooksPage() {
  const router = useRouter();
  const [cookbooks, setCookbooks] = useState<CookbookEntry[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my-cookbooks")
      .then((r) => r.json())
      .then((data) => {
        setCookbooks(data.cookbooks ?? []);
        setUsername(data.username ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setCookbooks([]);
    setUsername(null);
    router.refresh();
    router.push("/login");
  }

  if (loading) {
    return (
      <PaperSheet lined={false} className="text-center">
        <p className="muted">Loading…</p>
      </PaperSheet>
    );
  }

  if (username === null) {
    return (
      <PaperSheet lined={false} className="max-w-md mx-auto text-center space-y-4">
        <h1 className="paper-title text-2xl text-ink">My cookbooks</h1>
        <p className="muted">Log in to see cookbooks you own or have joined.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login" className="btn-primary">
            Log in
          </Link>
          <Link href="/signup" className="btn-secondary">
            Sign up
          </Link>
        </div>
      </PaperSheet>
    );
  }

  if (cookbooks.length === 0) {
    return (
      <PaperSheet lined={false} className="max-w-md mx-auto text-center space-y-4">
        <h1 className="paper-title text-2xl text-ink">My cookbooks</h1>
        <p className="muted">
          Logged in as {username}. You haven&apos;t joined any cookbooks yet.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/create" className="btn-primary">
            Create a cookbook
          </Link>
          <button type="button" onClick={handleLogout} className="btn-secondary">
            Log out
          </button>
        </div>
      </PaperSheet>
    );
  }

  return (
    <div className="space-y-4">
      <PaperSheet lined={false} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="paper-title text-2xl sm:text-3xl text-ink">My cookbooks</h1>
          <p className="muted text-sm">Logged in as {username}</p>
        </div>
        <button type="button" onClick={handleLogout} className="btn-secondary text-sm">
          Log out
        </button>
      </PaperSheet>

      <ul className="space-y-3">
        {cookbooks.map((c) => (
          <li key={c.id}>
            <PaperSheet
              lined={false}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <h2 className="font-display text-xl text-ink">{c.name}</h2>
                <p className="text-sm muted">
                  {c.recipeCount} recipe{c.recipeCount !== 1 ? "s" : ""}
                  {c.role === "owner" ? " · Owner" : " · Member"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Link href={`/cookbook/${c.id}`} className="btn-primary text-center">
                  Open
                </Link>
                {c.role === "owner" && (
                  <Link href={`/cookbook/${c.id}/admin`} className="btn-secondary text-center">
                    Manage
                  </Link>
                )}
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
