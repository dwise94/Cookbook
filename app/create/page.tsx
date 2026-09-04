"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
        Create a cookbook
      </h1>
      <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
        Enter your username, a password for admin access, and a name for the cookbook. You’ll use
        the password to manage the cookbook (delete recipes, block users). Share the cookbook
        link with anyone so they can add and view recipes.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Your username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. john_smith"
            className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            maxLength={80}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Admin password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            minLength={6}
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Cookbook name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Smith Family Cookbook"
            className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            maxLength={100}
          />
        </div>
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium py-2.5 transition-colors"
        >
          {loading ? "Creating…" : "Create cookbook"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-stone-500 dark:text-stone-400">
        <Link href="/" className="hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
