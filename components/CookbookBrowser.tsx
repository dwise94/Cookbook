"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { parseInstructions, serializeInstructions } from "@/lib/instructions";
import { PaperSheet } from "@/components/PaperSheet";
import { LegalPad } from "@/components/LegalPad";

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
  const [submitToken, setSubmitToken] = useState(contributeToken ?? "");
  const [allowSubmit, setAllowSubmit] = useState(canSubmit);

  const loadCookbook = useCallback(async () => {
    const res = await fetch(`/api/cookbooks/${cookbookId}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    const data = await res.json();
    setCookbook(data);
    if (data.contributeToken) {
      setSubmitToken(data.contributeToken);
      setAllowSubmit(true);
    } else if (data.canSubmit) {
      setAllowSubmit(true);
    }
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

  useEffect(() => {
    if (selectedId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedId]);

  if (notFound || !cookbook) {
    return (
      <PaperSheet lined={false} className="text-center">
        <p className="muted">{notFound ? "Cookbook not found." : "Loading…"}</p>
        {notFound && (
          <Link href="/" className="text-binding hover:underline mt-3 inline-block">
            Go home
          </Link>
        )}
      </PaperSheet>
    );
  }

  const showRecipePane = Boolean(selectedId);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={showRecipePane ? "hidden md:block" : "block"}>
        <PaperSheet lined={false} className="space-y-4">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="paper-title text-2xl sm:text-3xl text-ink">{cookbook.name}</h1>
              <p className="muted text-sm sm:text-base">
                {cookbook.creatorName && `Created by ${cookbook.creatorName} · `}
                {cookbook.recipeCount} recipe{cookbook.recipeCount !== 1 ? "s" : ""}
                {allowSubmit ? " · You can add recipes" : " · View only"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="search"
                placeholder="Search recipes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field flex-1"
                enterKeyHint="search"
              />
              {allowSubmit && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary whitespace-nowrap"
                >
                  Add recipe
                </button>
              )}
            </div>
          </div>
        </PaperSheet>
      </div>

      {allowSubmit && showAddForm && submitToken && (
        <AddRecipeForm
          cookbookId={cookbookId}
          contributeToken={submitToken}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            loadCookbook();
            loadRecipes();
          }}
        />
      )}

      {recipes.length === 0 && !loading ? (
        <PaperSheet lined={false}>
          <p className="muted text-center py-4">
            {allowSubmit ? "No recipes yet. Add the first one!" : "No recipes yet."}
          </p>
        </PaperSheet>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className={`space-y-2 ${showRecipePane ? "hidden md:block" : "block"}`}>
            {recipes.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`recipe-list-item ${selectedId === r.id ? "is-active" : ""}`}
                >
                  <span className="font-display text-lg text-ink block leading-snug">{r.name}</span>
                  <span className="block text-sm muted">by {r.submitterName}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className={showRecipePane ? "block" : "hidden md:block"}>
            {detail ? (
              <RecipePage
                detail={detail}
                onBack={() => setSelectedId(null)}
                showBack
              />
            ) : selectedId ? (
              <LegalPad>
                <p className="legal-pad-byline">Loading recipe…</p>
              </LegalPad>
            ) : (
              <LegalPad className="hidden md:block">
                <p className="legal-pad-byline">Select a recipe to open the page.</p>
              </LegalPad>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RecipePage({
  detail,
  onBack,
  showBack,
}: {
  detail: RecipeDetail;
  onBack: () => void;
  showBack: boolean;
}) {
  const steps = parseInstructions(detail.instructions);

  return (
    <div className="space-y-3">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="md:hidden btn-secondary w-full sticky top-[3.25rem] z-30 shadow-md"
        >
          ← All recipes
        </button>
      )}
      <LegalPad className="min-h-[70vh] sm:min-h-[28rem]">
        <h2 className="legal-pad-title">{detail.name}</h2>
        <p className="legal-pad-byline">by {detail.submitterName}</p>

        <h3 className="legal-pad-section">Ingredients</h3>
        <pre>{detail.ingredients || "—"}</pre>

        <h3 className="legal-pad-section">Instructions</h3>
        {steps.length === 0 ? (
          <p className="legal-pad-byline">—</p>
        ) : (
          <ol className="list-none">
            {steps.map((step, i) => (
              <li key={i} className="legal-pad-step">
                <span className="legal-pad-step-num">{i + 1}.</span>
                <span className="legal-pad-step-text">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </LegalPad>
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
      <PaperSheet lined={false} className="space-y-3">
        <p className="paper-title text-xl text-ink">Recipe added.</p>
        <p className="text-sm muted">
          Save this link if you want to edit later. The cookbook admin can also send you an edit
          link anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input readOnly value={editLink} className="field flex-1 text-sm" />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(editLink)}
            className="btn-primary shrink-0"
          >
            Copy
          </button>
        </div>
        <button type="button" onClick={onSuccess} className="btn-primary">
          Done
        </button>
      </PaperSheet>
    );
  }

  return (
    <PaperSheet lined={false}>
      <h2 className="paper-title text-xl text-ink mb-4">Add a recipe</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            Your name <span className="text-binding">*</span>
          </label>
          <input
            type="text"
            value={submitterName}
            onChange={(e) => setSubmitterName(e.target.value)}
            className="field"
            maxLength={80}
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label">
            Recipe name <span className="text-binding">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
            maxLength={200}
            required
          />
        </div>
        <div>
          <label className="label">Ingredients (with measurements)</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={4}
            className="field min-h-[6rem] resize-y"
            maxLength={8000}
            placeholder="e.g. 2 cups flour, 1 tsp salt"
          />
        </div>
        <div>
          <label className="label">Instructions</label>
          <p className="text-xs muted mb-2">Add each step in order.</p>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="flex-shrink-0 w-7 h-11 flex items-center justify-center muted text-sm font-medium">
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
                  className="field flex-1"
                  maxLength={2000}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (steps.length <= 1) return;
                    setSteps((prev) => prev.filter((_, i) => i !== index));
                  }}
                  disabled={steps.length <= 1}
                  className="flex-shrink-0 rounded-md p-2.5 muted hover:text-red-700 disabled:opacity-40"
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
            <button type="button" onClick={() => setSteps((prev) => [...prev, ""])} className="btn-secondary text-sm">
              Add step
            </button>
          </div>
        </div>
        {error && (
          <p className="text-red-700 text-sm" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Adding…" : "Add recipe"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </PaperSheet>
  );
}
