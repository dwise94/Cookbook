"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavUser = { id: string; username: string } | null;

export function SiteNav() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .finally(() => setLoaded(true));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
    router.push("/");
  }

  return (
    <nav className="flex items-center gap-1 sm:gap-3">
      <a href="/my-cookbooks" className="btn-ghost text-sm sm:text-base whitespace-nowrap">
        My cookbooks
      </a>
      {loaded && user ? (
        <>
          <span className="hidden sm:inline text-sm muted truncate max-w-[8rem]">
            {user.username}
          </span>
          <button type="button" onClick={logout} className="btn-ghost text-sm sm:text-base">
            Log out
          </button>
          <Link
            href="/create"
            className="rounded-xl bg-coral hover:bg-coral-hover text-white text-sm sm:text-base font-medium px-3 py-2 min-h-10 inline-flex items-center"
          >
            Create
          </Link>
        </>
      ) : (
        <>
          <Link href="/login" className="btn-ghost text-sm sm:text-base whitespace-nowrap">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-coral hover:bg-coral-hover text-white text-sm sm:text-base font-medium px-3 py-2 min-h-10 inline-flex items-center"
          >
            Sign up
          </Link>
        </>
      )}
    </nav>
  );
}
