"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { parseInstructions, serializeInstructions } from "@/lib/instructions";

function getTokenFromPaste(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes("token=")) {
    const match = trimmed.match(/token=([^&\s]+)/);
    if (!match) return null;
    try {
      return decodeURIComponent(match[1].trim());
    } catch {
      return match[1].trim();
    }
  }
  return trimmed;
}

type Recipe = {
  id: string;
  name: string;
  submitterName: string;
  ingredients: string;
  instructions: string;
};

export default function EditRecipePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const token = searchParams.get("token") ?? "";
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(!!token);
  const [pasteLink, setPasteLink] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/recipes/${recipeId}?token=${encodeURIComponent(token)}`)
      .then((r) => {
        if (!r.ok) {
          setForbidden(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setRecipe(data);
          setName(data.name ?? "");
          setIngredients(data.ingredients ?? "");
          const parsed = parseInstructions(data.instructions);
          setSteps(parsed.length > 0 ? parsed : [""]);
        }
      })
      .finally(() => setLoading(false));
  }, [recipeId, token]);

  const save = useCallback(async () => {
    if (!token) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(
        `/api/recipes/${recipeId}?token=${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            ingredients,
            instructions: serializeInstructions(steps),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setRecipe((prev) => (prev ? { ...prev, ...data } : null));
      if (data.instructions !== undefined) {
        const parsed = parseInstructions(data.instructions);
        setSteps(parsed.length > 0 ? parsed : [""]);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }, [recipeId, token, name, ingredients, steps]);

  if (!token) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Edit recipe</h1>
        <p className="text-stone-600 dark:text-stone-400">
          Paste the edit link the cookbook admin sent you (or the token from that link).
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPasteError("");
            const extracted = getTokenFromPaste(pasteLink);
            if (!extracted) {
              setPasteError("Please paste your edit link or token.");
              return;
            }
            router.replace(`/recipe/${recipeId}/edit?token=${encodeURIComponent(extracted)}`);
          }}
          className="space-y-3"
        >
          <input
            type="text"
            value={pasteLink}
            onChange={(e) => setPasteLink(e.target.value)}
            placeholder="https://.../recipe/.../edit?token=... or paste token"
            className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {pasteError && (
            <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
              {pasteError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 text-sm"
            >
              Open for editing
            </button>
            <Link
              href="/"
              className="rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium py-2 px-4 text-sm inline-flex items-center hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Cancel
            </Link>
          </div>
        </form>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Lost your link? Ask the cookbook admin to send you a new edit link.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-stone-500 dark:text-stone-400">Loading…</p>
      </div>
    );
  }

  if (forbidden || !recipe) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-stone-600 dark:text-stone-400">
          This edit link is invalid. Ask the cookbook admin to send you a new one.
        </p>
        <Link href="/" className="text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Edit recipe</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400">by {recipe.submitterName}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Recipe name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            maxLength={200}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Ingredients (with measurements)
          </label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
            maxLength={8000}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Instructions
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
            Add each step in order. You can add or remove steps.
          </p>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="flex-shrink-0 w-6 h-10 flex items-center justify-center text-stone-500 dark:text-stone-400 text-sm font-medium">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => {
                    const next = [...steps];
                    next[index] = e.target.value;
                    setSteps(next);
                  }}
                  placeholder={`Step ${index + 1}`}
                  className="flex-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  maxLength={2000}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (steps.length <= 1) return;
                    setSteps((prev) => prev.filter((_, i) => i !== index));
                  }}
                  disabled={steps.length <= 1}
                  className="flex-shrink-0 rounded p-2 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none"
                  title="Remove step"
                  aria-label="Remove step"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSteps((prev) => [...prev, ""])}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 px-3 py-2 text-sm"
            >
              Add step
            </button>
          </div>
        </div>
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium py-2 px-4"
          >
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium py-2 px-4 hover:bg-stone-100 dark:hover:bg-stone-800 inline-block"
          >
            Back
          </Link>
        </div>
      </form>
    </div>
  );
}
