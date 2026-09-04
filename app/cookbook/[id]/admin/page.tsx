"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShareLinkCard } from "@/components/ShareLinkCard";
import { parseInstructions, serializeInstructions } from "@/lib/instructions";

type Recipe = {
  id: string;
  name: string;
  submitterName: string;
  ingredients?: string;
  instructions?: string;
  editToken?: string;
};
type Blocked = { id: string; submitterName: string }[];

export default function AdminPage() {
  const params = useParams();
  const id = params.id as string;
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [cookbookName, setCookbookName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [contributeToken, setContributeToken] = useState("");
  const [editName, setEditName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [blocked, setBlocked] = useState<Blocked>([]);
  const [blockName, setBlockName] = useState("");
  const [blockError, setBlockError] = useState("");
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    ingredients: "",
    steps: [""] as string[],
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [copiedEditId, setCopiedEditId] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const checkAuth = useCallback(async () => {
    const res = await fetch(`/api/cookbooks/${id}`);
    if (!res.ok) return false;
    const cookbook = await res.json();
    setCookbookName(cookbook.name ?? "");
    setCreatorName(cookbook.creatorName ?? "");
    setEditName(cookbook.name ?? "");
    if (cookbook.contributeToken) setContributeToken(cookbook.contributeToken);

    const recipesRes = await fetch(`/api/cookbooks/${id}/recipes`);
    if (recipesRes.ok) {
      const data = await recipesRes.json();
      setRecipes(data.recipes ?? []);
    }
    const blockedRes = await fetch(`/api/cookbooks/${id}/blocked`);
    if (blockedRes.status === 403) return false;
    if (blockedRes.ok) {
      const data = await blockedRes.json();
      setBlocked(data.blocked ?? []);
    }
    return blockedRes.status === 200;
  }, [id]);

  useEffect(() => {
    checkAuth().then((isAdmin) => {
      setLoggedIn(isAdmin);
      setLoading(false);
    });
  }, [checkAuth]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch(`/api/cookbooks/${id}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? "Login failed.");
        return;
      }
      setPassword("");
      const isAdmin = await checkAuth();
      setLoggedIn(isAdmin);
    } catch {
      setLoginError("Network error.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function deleteRecipe(recipeId: string) {
    if (!confirm("Delete this recipe? This cannot be undone.")) return;
    const res = await fetch(`/api/cookbooks/${id}/recipes/${recipeId}`, { method: "DELETE" });
    if (!res.ok) return;
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    if (editingId === recipeId) setEditingId(null);
  }

  async function blockUser() {
    const name = blockName.trim();
    if (!name) {
      setBlockError("Enter a name to block.");
      return;
    }
    setBlockError("");
    const res = await fetch(`/api/cookbooks/${id}/blocked`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submitterName: name }),
    });
    if (!res.ok) {
      const data = await res.json();
      setBlockError(data.error ?? "Failed to block.");
      return;
    }
    const listRes = await fetch(`/api/cookbooks/${id}/blocked`);
    if (listRes.ok) {
      const data = await listRes.json();
      setBlocked(data.blocked ?? []);
    }
    setBlockName("");
  }

  async function unblock(submitterName: string) {
    const res = await fetch(
      `/api/cookbooks/${id}/blocked?submitterName=${encodeURIComponent(submitterName)}`,
      { method: "DELETE" }
    );
    if (!res.ok) return;
    setBlocked((prev) => prev.filter((b) => b.submitterName !== submitterName));
  }

  async function logout() {
    await fetch(`/api/cookbooks/${id}/admin`, { method: "DELETE" });
    setLoggedIn(false);
  }

  async function saveCookbookName() {
    const trimmed = editName.trim();
    if (!trimmed) {
      setNameError("Cookbook name is required.");
      return;
    }
    if (trimmed === cookbookName) {
      setNameError("");
      return;
    }
    setNameError("");
    setNameSaving(true);
    try {
      const res = await fetch(`/api/cookbooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error ?? "Failed to update name.");
        return;
      }
      setCookbookName(trimmed);
    } catch {
      setNameError("Network error.");
    } finally {
      setNameSaving(false);
    }
  }

  async function startEdit(recipeId: string) {
    setEditError("");
    const res = await fetch(`/api/cookbooks/${id}/recipes/${recipeId}`);
    if (!res.ok) {
      setEditError("Could not load recipe.");
      return;
    }
    const data = await res.json();
    const parsed = parseInstructions(data.instructions);
    setEditForm({
      name: data.name ?? "",
      ingredients: data.ingredients ?? "",
      steps: parsed.length > 0 ? parsed : [""],
    });
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, editToken: data.editToken } : r))
    );
    setEditingId(recipeId);
  }

  async function saveEdit() {
    if (!editingId) return;
    setEditError("");
    setEditSaving(true);
    try {
      const res = await fetch(`/api/cookbooks/${id}/recipes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          ingredients: editForm.ingredients.trim(),
          instructions: serializeInstructions(editForm.steps),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Failed to save.");
        return;
      }
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === editingId ? { ...r, name: data.name, submitterName: data.submitterName } : r
        )
      );
      setEditingId(null);
    } catch {
      setEditError("Network error.");
    } finally {
      setEditSaving(false);
    }
  }

  async function copyEditLink(recipeId: string) {
    let token = recipes.find((r) => r.id === recipeId)?.editToken;
    if (!token) {
      const res = await fetch(`/api/cookbooks/${id}/recipes/${recipeId}`);
      if (!res.ok) return;
      const data = await res.json();
      token = data.editToken;
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, editToken: data.editToken } : r))
      );
    }
    if (!token || !origin) return;
    const url = `${origin}/recipe/${recipeId}/edit?token=${encodeURIComponent(token)}`;
    await navigator.clipboard.writeText(url);
    setCopiedEditId(recipeId);
    setTimeout(() => setCopiedEditId(null), 2000);
  }

  const readOnlyUrl = origin ? `${origin}/cookbook/${id}` : "";
  const contributeUrl =
    origin && contributeToken ? `${origin}/cookbook/${id}/contribute/${contributeToken}` : "";

  if (loading) {
    return (
      <div className="text-center py-12 text-stone-500 dark:text-stone-400">Loading…</div>
    );
  }

  if (loggedIn === false) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Admin login</h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm">
          Enter the password you set when creating this cookbook.
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          {loginError && (
            <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium py-2"
          >
            {loginLoading ? "Checking…" : "Log in"}
          </button>
        </form>
        <p className="text-center text-sm">
          <Link
            href={`/cookbook/${id}`}
            className="text-amber-600 dark:text-amber-400 hover:underline"
          >
            Back to cookbook
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Admin – {cookbookName}
          </h1>
          {creatorName && (
            <p className="text-stone-500 dark:text-stone-400 text-sm">Created by {creatorName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/cookbook/${id}`}
            className="rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium px-4 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            View cookbook
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-sm"
          >
            Log out
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">Share</h2>
        <ShareLinkCard
          title="Contribute link"
          description="Share this so people can add recipes."
          url={contributeUrl}
        />
        <ShareLinkCard
          title="Read-only link"
          description="Share this for viewing only."
          url={readOnlyUrl}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-3">
          Cookbook name
        </h2>
        <div className="flex gap-2 flex-wrap items-start">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-amber-500"
            maxLength={100}
          />
          <button
            type="button"
            onClick={saveCookbookName}
            disabled={nameSaving || editName.trim() === cookbookName}
            className="rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium px-4 py-2 text-sm"
          >
            {nameSaving ? "Saving…" : "Save name"}
          </button>
        </div>
        {nameError && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-1" role="alert">
            {nameError}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-3">
          Block a user
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
          Enter the exact name they use when adding recipes.
        </p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={blockName}
            onChange={(e) => setBlockName(e.target.value)}
            placeholder="Submitter name"
            className="rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 text-sm min-w-[160px] focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={blockUser}
            className="rounded-lg bg-stone-700 hover:bg-stone-800 text-white font-medium px-4 py-2 text-sm"
          >
            Block
          </button>
        </div>
        {blockError && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-1" role="alert">
            {blockError}
          </p>
        )}
        {blocked.length > 0 && (
          <ul className="mt-3 space-y-1">
            {blocked.map((b) => (
              <li
                key={b.submitterName + (b.id || "")}
                className="flex items-center justify-between rounded border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm"
              >
                <span className="text-stone-700 dark:text-stone-300">{b.submitterName}</span>
                <button
                  type="button"
                  onClick={() => unblock(b.submitterName)}
                  className="text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-3">Recipes</h2>
        {recipes.length === 0 ? (
          <p className="text-stone-500 dark:text-stone-400 text-sm">No recipes yet.</p>
        ) : (
          <ul className="space-y-3">
            {recipes.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-3 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-stone-800 dark:text-stone-100">{r.name}</span>
                    <span className="block text-sm text-stone-500 dark:text-stone-400">
                      by {r.submitterName}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyEditLink(r.id)}
                      className="text-amber-600 dark:text-amber-400 hover:underline text-sm"
                    >
                      {copiedEditId === r.id ? "Copied!" : "Copy edit link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => (editingId === r.id ? setEditingId(null) : startEdit(r.id))}
                      className="text-stone-700 dark:text-stone-300 hover:underline text-sm"
                    >
                      {editingId === r.id ? "Cancel" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecipe(r.id)}
                      className="text-red-600 dark:text-red-400 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingId === r.id && (
                  <div className="space-y-3 border-t border-stone-200 dark:border-stone-700 pt-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
                      placeholder="Recipe name"
                    />
                    <textarea
                      value={editForm.ingredients}
                      onChange={(e) => setEditForm((f) => ({ ...f, ingredients: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm resize-y"
                      placeholder="Ingredients"
                    />
                    <div className="space-y-2">
                      {editForm.steps.map((step, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="w-6 text-sm text-stone-500 pt-2">{index + 1}.</span>
                          <input
                            type="text"
                            value={step}
                            onChange={(e) => {
                              const next = [...editForm.steps];
                              next[index] = e.target.value;
                              setEditForm((f) => ({ ...f, steps: next }));
                            }}
                            className="flex-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            disabled={editForm.steps.length <= 1}
                            onClick={() =>
                              setEditForm((f) => ({
                                ...f,
                                steps: f.steps.filter((_, i) => i !== index),
                              }))
                            }
                            className="text-sm text-red-600 disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm((f) => ({ ...f, steps: [...f.steps, ""] }))
                        }
                        className="text-sm text-amber-600 dark:text-amber-400"
                      >
                        Add step
                      </button>
                    </div>
                    {editError && (
                      <p className="text-red-600 dark:text-red-400 text-sm">{editError}</p>
                    )}
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={editSaving}
                      className="rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium px-4 py-2 text-sm"
                    >
                      {editSaving ? "Saving…" : "Save recipe"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
