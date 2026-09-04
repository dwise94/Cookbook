"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PaperSheet } from "@/components/PaperSheet";

export default function CreateCookbookPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (!password) {
      setError("Please enter a password for admin access.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter a cookbook name.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cookbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: name.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.details ? `${data.error} ${data.details}` : (data.error ?? "Something went wrong.");
        setError(msg);
        return;
      }
      router.push(
        `/cookbook/${data.id}/created?name=${encodeURIComponent(name.trim())}&token=${encodeURIComponent(data.contributeToken ?? "")}`
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PaperSheet lined={false} className="max-w-md mx-auto space-y-4">
      <h1 className="paper-title text-2xl sm:text-3xl text-ink">Create a cookbook</h1>
      <p className="muted text-sm">
        Choose a username, admin password, and cookbook name. Guests don’t need accounts—you share
        links instead.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="label">
            Your username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. john_smith"
            className="field"
            maxLength={80}
            autoFocus
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Admin password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="field"
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="name" className="label">
            Cookbook name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Smith Family Cookbook"
            className="field"
            maxLength={100}
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
        <Link href="/" className="text-binding hover:underline">
          Back to home
        </Link>
      </p>
    </PaperSheet>
  );
}
