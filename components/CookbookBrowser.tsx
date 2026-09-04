"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { parseInstructions, serializeInstructions } from "@/lib/instructions";

type Cookbook = { id: string; name: string; creatorName?: string; recipeCount: number };
type RecipeListItem = { id: string; name: string; submitterName: string; createdAt: string };
type RecipeDetail = RecipeListItem & { ingredients: string; instructions: string; updatedAt: string };

export function CookbookBrowser({
  cookbookId,
  contributeToken,
  canSubmit,
}: {
  cookbookId: string;
  contributeToken?: string;
  canSubmit: boolean;
}) {
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadCookbook = useCallback(async () => {
    const res = await fetch(`/api/cookbooks/${cookbookId}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    const data = await res.json();
    setCookbook(data);
  }, [cookbookId]);

  const loadRecipes = useCallback(async () => {
    const q = search ? `?q=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/cookbooks/${cookbookId}/recipes${q}`);
    if (!res.ok) return;
    const data = await res.json();
    setRecipes(data.recipes ?? []);
  }, [cookbookId, search]);

  useEffect(() => {
    loadCookbook();
  }, [loadCookbook]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/cookbooks/${cookbookId}/recipes/${selectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setDetail(data);
      });
    return () => {
      cancelled = true;
    };
  }, [cookbookId, selectedId]);

  useEffect(() => {
    setLoading(false);
  }, [cookbook, recipes]);

  if (notFound || !cookbook) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500 dark:text-stone-400">
          {notFound ? "Cookbook not found." : "Loading…"}
        </p>
        {notFound && (
          <Link href="/" className="text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-block">
            Go home
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {cookbook.name}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {cookbook.creatorName && `Created by ${cookbook.creatorName} · `}
            {cookbook.recipeCount} recipe{cookbook.recipeCount !== 1 ? "s" : ""}
            {!canSubmit && " · View only"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Search recipes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 text-sm flex-1 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {canSubmit && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 text-sm whitespace-nowrap"
            >
              Add recipe
            </button>
          )}
        </div>
      </div>

      {canSubmit && showAddForm && contributeToken && (
        <AddRecipeForm
          cookbookId={cookbookId}
          contributeToken={contributeToken}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            loadCookbook();
            loadRecipes();
          }}
        />
      )}

      {recipes.length === 0 && !loading ? (
        <p className="text-stone-500 dark:text-stone-400 py-8 text-center">
          {canSubmit ? "No recipes yet. Add the first one!" : "No recipes yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="space-y-2">
            {recipes.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                    selectedId === r.id
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                      : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                >
                  <span className="font-medium text-stone-900 dark:text-stone-100">{r.name}</span>
                  <span className="block text-sm text-stone-500 dark:text-stone-400">
                    by {r.submitterName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="min-h-[200px]">
            {detail ? (
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 sticky top-4">
                <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">
                  {detail.name}
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                  by {detail.submitterName}
                </p>
                <div className="space-y-3 text-stone-700 dark:text-stone-300">
                  <div>
                    <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                      Ingredients
                    </h3>
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {detail.ingredients || "—"}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                      Instructions
                    </h3>
                    {(() => {
                      const steps = parseInstructions(detail.instructions);
                      if (steps.length === 0) return <p className="text-sm text-stone-500">—</p>;
                      return (
                        <ol className="list-decimal list-inside space-y-2 font-sans text-sm text-stone-700 dark:text-stone-300">
                          {steps.map((step, i) => (
                            <li key={i} className="pl-1">
                              {step}
                            </li>
                          ))}
                        </ol>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : selectedId ? (
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4 text-stone-500 dark:text-stone-400 text-sm">
                Loading…
              </div>
            ) : (
              <p className="text-stone-400 dark:text-stone-500 text-sm py-4">
                Select a recipe to view it.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddRecipeForm({
  cookbookId,
  contributeToken,
  onClose,
  onSuccess,
}: {
  cookbookId: string;
  contributeToken: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitterName, setSubmitterName] = useState("");
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const [error, setError] = useState("");
  const [editLink, setEditLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!submitterName.trim()) {
      setError("Your name is required.");
      return;
    }
    if (!name.trim()) {
      setError("Recipe name is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/cookbooks/${cookbookId}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributeToken,
          submitterName: submitterName.trim(),
          name: name.trim(),
          ingredients: ingredients.trim(),
          instructions: serializeInstructions(steps),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const base = typeof window !== "undefined" ? window.location.origin : "";
      setEditLink(`${base}/recipe/${data.id}/edit?token=${data.editToken}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (editLink) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
        <p className="font-medium text-stone-800 dark:text-stone-100">Recipe added.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Save this link if you want to edit later. The cookbook admin can also send you an edit
          link anytime.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={editLink}
            className="flex-1 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(editLink)}
            className="rounded bg-stone-600 hover:bg-stone-700 text-white text-sm px-3"
          >
            Copy
          </button>
        </div>
        <button
          type="button"
          onClick={onSuccess}
          className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 text-sm"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4">
      <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">
        Add a recipe
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Your name <span className="text-amber-600">*</span>
          </label>
          <input
            type="text"
            value={submitterName}
            onChange={(e) => setSubmitterName(e.target.value)}
            className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            maxLength={80}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Recipe name <span className="text-amber-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
            maxLength={8000}
            placeholder="e.g. 2 cups flour, 1 tsp salt"
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
                  className="flex-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
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
            disabled={loading}
            className="rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium py-2 px-4"
          >
            {loading ? "Adding…" : "Add recipe"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium py-2 px-4 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
