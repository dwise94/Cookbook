"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PaperSheet } from "@/components/PaperSheet";

export default function CreateCookbookPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace(`/login?next=${encodeURIComponent("/create")}`);
          return;
        }
        setAuthChecked(true);
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter a cookbook name.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cookbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/create")}`);
        return;
      }
      if (!res.ok) {
        const msg = data.details ? `${data.error} ${data.details}` : (data.error ?? "Something went wrong.");
        setError(msg);
        return;
      }
      router.push(
        `/cookbook/${data.id}/created?name=${encodeURIComponent(name.trim())}&token=${encodeURIComponent(data.inviteToken ?? "")}`
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <PaperSheet lined={false} className="text-center">
        <p className="muted">Loading…</p>
      </PaperSheet>
    );
  }

  return (
    <PaperSheet lined={false} className="max-w-md mx-auto space-y-4">
      <h1 className="paper-title text-2xl sm:text-3xl text-ink">Create a cookbook</h1>
      <p className="muted text-sm">
        You&apos;ll be the owner. Invite friends with a link so they can join your group cookbook.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Cookbook name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Friday Night Dinners"
            className="field"
            maxLength={100}
            autoFocus
          />
        </div>
        {error && (
          <p className="text-red-700 text-sm" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating…" : "Create cookbook"}
        </button>
      </form>
      <p className="text-center text-sm">
        <Link href="/" className="text-sage hover:underline">
          Back to home
        </Link>
      </p>
    </PaperSheet>
  );
}
