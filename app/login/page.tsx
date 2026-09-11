"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PaperSheet } from "@/components/PaperSheet";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/my-cookbooks";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError("Enter your username.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PaperSheet lined={false} className="max-w-md mx-auto space-y-4">
      <h1 className="paper-title text-2xl sm:text-3xl text-ink">Log in</h1>
      <p className="muted text-sm">Sign in to open your cookbooks and accept invites.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="label">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="field"
            maxLength={80}
            autoFocus
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p className="text-red-700 text-sm" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="text-center text-sm muted">
        No account yet?{" "}
        <Link
          href={`/signup${next !== "/my-cookbooks" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-sage hover:underline"
        >
          Sign up
        </Link>
      </p>
    </PaperSheet>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <PaperSheet lined={false} className="text-center">
          <p className="muted">Loading…</p>
        </PaperSheet>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
