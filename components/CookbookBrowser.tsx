"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { parseInstructions, serializeInstructions } from "@/lib/instructions";
import { prepareCookPhotos } from "@/lib/prepare-cook-photo";
import { PaperSheet } from "@/components/PaperSheet";
import { RecipePanel } from "@/components/RecipePanel";

type Cookbook = {
  id: string;
  name: string;
  creatorName?: string;
  recipeCount: number;
  username?: string;
  role?: string;
};
type RecipeNote = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};
type RecipeCookPhoto = {
  id: string;
  url: string;
  createdAt: string;
};
type RecipeCook = {
  id: string;
  userId?: string | null;
  cookName: string;
  rating: number;
  cookedAt: string;
  photos?: RecipeCookPhoto[];
};
type RecipeListItem = { id: string; name: string; submitterName: string; createdAt: string };
type RecipeDetail = RecipeListItem & {
  ingredients: string;
  instructions: string;
  updatedAt: string;
  lastEditedBy?: string | null;
  notes?: RecipeNote[];
  cooks?: RecipeCook[];
  timesCooked?: number;
  lastCookedAt?: string | null;
  cookedBy?: string[];
  averageRating?: number | null;
  canEdit?: boolean;
  username?: string;
  userId?: string;
  role?: string;
};

function formatRecipeDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: {
  value: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const cls = size === "sm" ? "star-btn star-btn-sm" : "star-btn";

  return (
    <div
      className="star-rating"
      role={readOnly ? "img" : "radiogroup"}
      aria-label={readOnly ? `${value} out of 5 stars` : "Rate this cook"}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`${cls} ${display >= n ? "is-on" : ""}`}
          disabled={readOnly}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onMouseEnter={() => !readOnly && setHover(n)}
          onClick={() => onChange?.(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function CookbookBrowser({ cookbookId }: { cookbookId: string }) {
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [access, setAccess] = useState<"ok" | "denied" | "unauth" | "missing">("ok");
  const [username, setUsername] = useState("");

  const loadCookbook = useCallback(async () => {
    const res = await fetch(`/api/cookbooks/${cookbookId}`);
    if (res.status === 401) {
      setAccess("unauth");
      return;
    }
    if (res.status === 403) {
      setAccess("denied");
      return;
    }
    if (!res.ok) {
      setAccess("missing");
      return;
    }
    const data = await res.json();
    setCookbook(data);
    setUsername(data.username ?? "");
    setAccess("ok");
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
    if (access === "ok") loadRecipes();
  }, [loadRecipes, access]);

  useEffect(() => {
    if (!selectedId || access !== "ok") {
      setDetail(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/cookbooks/${cookbookId}/recipes/${selectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setDetail(data);
          if (data.username) setUsername(data.username);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cookbookId, selectedId, access]);

  useEffect(() => {
    setLoading(false);
  }, [cookbook, recipes, access]);

  useEffect(() => {
    if (selectedId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedId]);

  const goRelative = useCallback(
    (delta: number) => {
      if (!selectedId || recipes.length === 0) return;
      const idx = recipes.findIndex((r) => r.id === selectedId);
      if (idx < 0) return;
      const next = idx + delta;
      if (next < 0 || next >= recipes.length) return;
      setSelectedId(recipes[next].id);
    },
    [recipes, selectedId]
  );

  if (access === "unauth") {
    const next = `/cookbook/${cookbookId}`;
    return (
      <PaperSheet className="text-center space-y-3">
        <p className="muted">Log in to view this cookbook.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary">
            Log in
          </Link>
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="btn-secondary">
            Sign up
          </Link>
        </div>
      </PaperSheet>
    );
  }

  if (access === "denied") {
    return (
      <PaperSheet className="text-center space-y-3">
        <p className="muted">
          This cookbook is invite-only. Ask the owner for an invite link to join.
        </p>
        <Link href="/my-cookbooks" className="text-sage hover:underline inline-block">
          My cookbooks
        </Link>
      </PaperSheet>
    );
  }

  if (access === "missing" || !cookbook) {
    return (
      <PaperSheet className="text-center">
        <p className="muted">{access === "missing" ? "Cookbook not found." : "Loading…"}</p>
        {access === "missing" && (
          <Link href="/" className="text-sage hover:underline mt-3 inline-block">
            Go home
          </Link>
        )}
      </PaperSheet>
    );
  }

  const showRecipePane = Boolean(selectedId);
  const selectedIndex = selectedId ? recipes.findIndex((r) => r.id === selectedId) : -1;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={showRecipePane ? "hidden md:block" : "block"}>
        <PaperSheet className="space-y-4">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="display-title text-2xl sm:text-3xl text-ink">{cookbook.name}</h1>
              <p className="muted text-sm sm:text-base">
                {cookbook.creatorName && `Created by ${cookbook.creatorName} · `}
                {cookbook.recipeCount} recipe{cookbook.recipeCount !== 1 ? "s" : ""}
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
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="btn-primary whitespace-nowrap"
              >
                Add recipe
              </button>
            </div>
          </div>
        </PaperSheet>
      </div>

      {showAddForm && (
        <AddRecipeForm
          cookbookId={cookbookId}
          username={username}
          onClose={() => setShowAddForm(false)}
          onSuccess={(recipeId) => {
            setShowAddForm(false);
            loadCookbook();
            loadRecipes().then(() => {
              if (recipeId) setSelectedId(recipeId);
            });
          }}
        />
      )}

      {recipes.length === 0 && !loading ? (
        <PaperSheet>
          <p className="muted">No recipes yet. Add the first one for your group.</p>
        </PaperSheet>
      ) : (
        <div className="grid md:grid-cols-[minmax(0,14rem)_1fr] gap-4 items-start">
          <ul className={showRecipePane ? "hidden md:block space-y-1" : "space-y-1"}>
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
                cookbookId={cookbookId}
                detail={detail}
                username={username || detail.username || ""}
                onBack={() => setSelectedId(null)}
                showBack
                onSwipeNext={() => goRelative(1)}
                onSwipePrev={() => goRelative(-1)}
                hasNext={selectedIndex >= 0 && selectedIndex < recipes.length - 1}
                hasPrev={selectedIndex > 0}
                onNotesChanged={(notes) =>
                  setDetail((prev) => (prev ? { ...prev, notes } : prev))
                }
                onRecipeUpdated={(updated) => {
                  setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
                  setRecipes((prev) =>
                    prev.map((r) =>
                      r.id === updated.id
                        ? { ...r, name: updated.name, submitterName: updated.submitterName }
                        : r
                    )
                  );
                }}
                onCooksChanged={(cooks) =>
                  setDetail((prev) => {
                    if (!prev) return prev;
                    const ratingSum = cooks.reduce((s, c) => s + c.rating, 0);
                    return {
                      ...prev,
                      cooks,
                      timesCooked: cooks.length,
                      lastCookedAt: cooks[0]?.cookedAt ?? null,
                      cookedBy: Array.from(new Set(cooks.map((c) => c.cookName))),
                      averageRating:
                        cooks.length > 0
                          ? Math.round((ratingSum / cooks.length) * 10) / 10
                          : null,
                    };
                  })
                }
              />
            ) : selectedId ? (
              <RecipePanel>
                <p className="muted">Loading recipe…</p>
              </RecipePanel>
            ) : (
              <RecipePanel className="hidden md:block min-h-[12rem]">
                <p className="muted">Select a recipe to open it.</p>
              </RecipePanel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RecipePage({
  cookbookId,
  detail,
  username,
  onBack,
  showBack,
  onSwipeNext,
  onSwipePrev,
  hasNext,
  hasPrev,
  onNotesChanged,
  onCooksChanged,
  onRecipeUpdated,
}: {
  cookbookId: string;
  detail: RecipeDetail;
  username: string;
  onBack: () => void;
  showBack: boolean;
  onSwipeNext: () => void;
  onSwipePrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  onNotesChanged: (notes: RecipeNote[]) => void;
  onCooksChanged: (cooks: RecipeCook[]) => void;
  onRecipeUpdated: (updated: {
    id: string;
    name: string;
    submitterName: string;
    ingredients: string;
    instructions: string;
    lastEditedBy?: string | null;
  }) => void;
}) {
  const steps = parseInstructions(detail.instructions);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const notes = detail.notes ?? [];
  const cooks = detail.cooks ?? [];
  const timesCooked = detail.timesCooked ?? cooks.length;
  const cookedBy = detail.cookedBy ?? Array.from(new Set(cooks.map((c) => c.cookName)));
  const lastCookedAt = detail.lastCookedAt ?? cooks[0]?.cookedAt ?? null;
  const averageRating =
    detail.averageRating ??
    (cooks.length
      ? Math.round((cooks.reduce((s, c) => s + c.rating, 0) / cooks.length) * 10) / 10
      : null);
  const canEdit = Boolean(detail.canEdit);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(detail.name);
  const [editIngredients, setEditIngredients] = useState(detail.ingredients);
  const [editSteps, setEditSteps] = useState<string[]>(
    steps.length > 0 ? steps : [""]
  );
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [noteBody, setNoteBody] = useState("");
  const [noteError, setNoteError] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [cookPhotos, setCookPhotos] = useState<File[]>([]);
  const [cookPhotoPreviews, setCookPhotoPreviews] = useState<string[]>([]);
  const [cookError, setCookError] = useState("");
  const [cookSaving, setCookSaving] = useState(false);
  const [cookJustSaved, setCookJustSaved] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [addingPhotosCookId, setAddingPhotosCookId] = useState<string | null>(null);
  const addPhotosInputRef = useRef<HTMLInputElement | null>(null);
  const pendingAddCookId = useRef<string | null>(null);

  const currentUserId = detail.userId ?? "";
  const isCookbookOwner = detail.role === "owner";

  useEffect(() => {
    const urls = cookPhotos.map((f) => URL.createObjectURL(f));
    setCookPhotoPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [cookPhotos]);

  useEffect(() => {
    if (!editing) {
      setEditName(detail.name);
      setEditIngredients(detail.ingredients);
      const parsed = parseInstructions(detail.instructions);
      setEditSteps(parsed.length > 0 ? parsed : [""]);
    }
  }, [detail, editing]);

  function pickCookPhotos(files: FileList | null) {
    if (!files) return;
    const next = [...cookPhotos, ...Array.from(files)].slice(0, 6);
    setCookPhotos(next);
  }

  function removeCookPhoto(index: number) {
    setCookPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function startEdit() {
    const parsed = parseInstructions(detail.instructions);
    setEditName(detail.name);
    setEditIngredients(detail.ingredients);
    setEditSteps(parsed.length > 0 ? parsed : [""]);
    setEditError("");
    setEditing(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    if (!editName.trim()) {
      setEditError("Recipe name is required.");
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`/api/cookbooks/${cookbookId}/recipes/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          ingredients: editIngredients.trim(),
          instructions: serializeInstructions(editSteps),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Could not save.");
        return;
      }
      onRecipeUpdated({
        id: data.id,
        name: data.name,
        submitterName: data.submitterName,
        ingredients: data.ingredients,
        instructions: data.instructions,
        lastEditedBy: data.lastEditedBy,
      });
      setEditing(false);
    } catch {
      setEditError("Network error.");
    } finally {
      setEditSaving(false);
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0 && hasNext) onSwipeNext();
    if (dx > 0 && hasPrev) onSwipePrev();
  }

  async function submitCook(e: React.FormEvent) {
    e.preventDefault();
    setCookError("");
    setCookJustSaved(false);
    if (rating < 1 || rating > 5) {
      setCookError("Pick a rating from 1 to 5 stars.");
      return;
    }
    setCookSaving(true);
    try {
      const formData = new FormData();
      formData.append("rating", String(rating));
      const prepared = await prepareCookPhotos(cookPhotos);
      for (const file of prepared) {
        formData.append("photos", file);
      }
      const res = await fetch(`/api/cookbooks/${cookbookId}/recipes/${detail.id}/cooks`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        const detailMsg = data.details ? ` ${data.details}` : "";
        setCookError((data.error ?? "Could not log this cook.") + detailMsg);
        return;
      }
      onCooksChanged([data, ...cooks]);
      setRating(0);
      setCookPhotos([]);
      setCookJustSaved(true);
      setTimeout(() => setCookJustSaved(false), 2500);
    } catch {
      setCookError("Network error.");
    } finally {
      setCookSaving(false);
    }
  }

  function openAddPhotos(cookId: string) {
    pendingAddCookId.current = cookId;
    addPhotosInputRef.current?.click();
  }

  async function onAddPhotosSelected(files: FileList | null) {
    const cookId = pendingAddCookId.current;
    pendingAddCookId.current = null;
    if (!cookId || !files || files.length === 0) return;
    setAddingPhotosCookId(cookId);
    setCookError("");
    try {
      const formData = new FormData();
      const prepared = await prepareCookPhotos(Array.from(files).slice(0, 6));
      for (const file of prepared) {
        formData.append("photos", file);
      }
      const res = await fetch(
        `/api/cookbooks/${cookbookId}/recipes/${detail.id}/cooks/${cookId}/photos`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!res.ok) {
        const detailMsg = data.details ? ` ${data.details}` : "";
        setCookError((data.error ?? "Could not add photos.") + detailMsg);
        return;
      }
      onCooksChanged(
        cooks.map((c) => (c.id === cookId ? { ...c, photos: data.photos } : c))
      );
    } catch {
      setCookError("Network error.");
    } finally {
      setAddingPhotosCookId(null);
    }
  }

  async function deletePhoto(cookId: string, photoId: string) {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(
      `/api/cookbooks/${cookbookId}/recipes/${detail.id}/cooks/${cookId}/photos/${photoId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setCookError(data.error ?? "Could not delete photo.");
      return;
    }
    onCooksChanged(
      cooks.map((c) =>
        c.id === cookId
          ? { ...c, photos: (c.photos ?? []).filter((p) => p.id !== photoId) }
          : c
      )
    );
  }

  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    setNoteError("");
    if (!noteBody.trim()) {
      setNoteError("Write a short note.");
      return;
    }
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/cookbooks/${cookbookId}/recipes/${detail.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNoteError(data.error ?? "Could not save note.");
        return;
      }
      onNotesChanged([...notes, data]);
      setNoteBody("");
    } catch {
      setNoteError("Network error.");
    } finally {
      setNoteSaving(false);
    }
  }

  const addedDate = formatRecipeDate(detail.createdAt);

  return (
    <div className="space-y-3" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="md:hidden btn-secondary w-full sticky top-[3.25rem] z-30 shadow-sm"
        >
          ← All recipes
        </button>
      )}
      <RecipePanel className="min-h-[70vh] sm:min-h-[28rem]">
        <h2 className="recipe-panel-title">{detail.name}</h2>
        <div className="recipe-panel-meta">
          <div>
            Added by <strong>{detail.submitterName}</strong>
          </div>
          {addedDate && <div>Added {addedDate}</div>}
          {detail.lastEditedBy && (
            <div>
              Last edited by <strong>{detail.lastEditedBy}</strong>
            </div>
          )}
          <div>
            Cooked <strong>{timesCooked}</strong> time{timesCooked === 1 ? "" : "s"}
            {averageRating != null ? ` · Avg ${averageRating}★` : ""}
            {lastCookedAt ? ` · Last cooked ${formatRecipeDate(lastCookedAt)}` : ""}
          </div>
          {cookedBy.length > 0 && (
            <div>
              Who&apos;s cooked it: <strong>{cookedBy.join(", ")}</strong>
            </div>
          )}
        </div>
        {canEdit && !editing && (
          <div className="mb-3">
            <button type="button" onClick={startEdit} className="btn-secondary text-sm">
              Edit recipe
            </button>
          </div>
        )}
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-4 mb-6">
            <div>
              <label className="label">Recipe name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="field"
                maxLength={200}
                required
              />
            </div>
            <div>
              <label className="label">Ingredients</label>
              <textarea
                value={editIngredients}
                onChange={(e) => setEditIngredients(e.target.value)}
                rows={4}
                className="field min-h-[6rem] resize-y"
                maxLength={8000}
              />
            </div>
            <div>
              <label className="label">Instructions</label>
              <div className="space-y-2 mt-2">
                {editSteps.map((step, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="flex-shrink-0 w-7 h-11 flex items-center justify-center muted text-sm">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const next = [...editSteps];
                        next[index] = e.target.value;
                        setEditSteps(next);
                      }}
                      className="field flex-1"
                      maxLength={2000}
                    />
                    <button
                      type="button"
                      disabled={editSteps.length <= 1}
                      onClick={() => setEditSteps((prev) => prev.filter((_, i) => i !== index))}
                      className="text-sm text-red-700 disabled:opacity-40 min-h-11 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditSteps((prev) => [...prev, ""])}
                  className="btn-secondary text-sm"
                >
                  Add step
                </button>
              </div>
            </div>
            {editError && (
              <p className="text-red-700 text-sm" role="alert">
                {editError}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" disabled={editSaving} className="btn-primary">
                {editSaving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="recipe-swipe-hint">Swipe left or right for more recipes</p>

            <section className="recipe-cook-log">
              <h3 className="recipe-panel-section" style={{ marginTop: 0 }}>
                I made this
              </h3>
              <p className="muted text-sm mb-2">
                Logging as <strong className="text-ink">{username || "you"}</strong> — rate how it
                turned out. Photos are optional.
              </p>
              <form onSubmit={submitCook} className="recipe-cook-form-stack">
                <StarRating value={rating} onChange={setRating} />
                <div className="cook-photo-picker">
                  <label className="btn-secondary text-sm self-start cursor-pointer">
                    Add photos
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        pickCookPhotos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <span className="text-xs muted">Up to 6 · compressed automatically</span>
                </div>
                {cookPhotoPreviews.length > 0 && (
                  <ul className="cook-photo-thumbs">
                    {cookPhotoPreviews.map((src, i) => (
                      <li key={src} className="cook-photo-thumb">
                        <img src={src} alt="" />
                        <button
                          type="button"
                          className="cook-photo-remove"
                          onClick={() => removeCookPhoto(i)}
                          aria-label="Remove photo"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="submit" disabled={cookSaving} className="btn-primary self-start">
                  {cookSaving ? "Saving…" : cookJustSaved ? "Logged!" : "I made this"}
                </button>
              </form>
              {cookError && (
                <p className="text-red-700 text-sm mt-2" role="alert">
                  {cookError}
                </p>
              )}
              <input
                ref={addPhotosInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic"
                multiple
                className="sr-only"
                onChange={(e) => {
                  onAddPhotosSelected(e.target.files);
                  e.target.value = "";
                }}
              />
              {cooks.length > 0 && (
                <ul className="recipe-cook-history">
                  {cooks.slice(0, 8).map((c) => {
                    const photos = c.photos ?? [];
                    const canManage =
                      (currentUserId && c.userId === currentUserId) || isCookbookOwner;
                    return (
                      <li key={c.id} className="recipe-cook-history-block">
                        <div className="recipe-cook-history-item">
                          <span>
                            <strong>{c.cookName}</strong> cooked this ·{" "}
                            {formatRecipeDate(c.cookedAt)}
                          </span>
                          <StarRating value={c.rating} readOnly size="sm" />
                        </div>
                        {photos.length > 0 && (
                          <ul className="cook-photo-thumbs">
                            {photos.map((p) => (
                              <li key={p.id} className="cook-photo-thumb">
                                <button
                                  type="button"
                                  className="cook-photo-open"
                                  onClick={() => setLightboxUrl(p.url)}
                                >
                                  <img src={p.url} alt={`Result by ${c.cookName}`} />
                                </button>
                                {canManage && (
                                  <button
                                    type="button"
                                    className="cook-photo-remove"
                                    onClick={() => deletePhoto(c.id, p.id)}
                                    aria-label="Delete photo"
                                  >
                                    ×
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {canManage && photos.length < 6 && (
                          <button
                            type="button"
                            className="btn-ghost text-sm self-start px-0"
                            disabled={addingPhotosCookId === c.id}
                            onClick={() => openAddPhotos(c.id)}
                          >
                            {addingPhotosCookId === c.id ? "Uploading…" : "Add photos"}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {lightboxUrl && (
              <div
                className="cook-lightbox"
                role="dialog"
                aria-modal="true"
                onClick={() => setLightboxUrl(null)}
              >
                <img src={lightboxUrl} alt="Cook result" onClick={(e) => e.stopPropagation()} />
                <button
                  type="button"
                  className="btn-secondary cook-lightbox-close"
                  onClick={() => setLightboxUrl(null)}
                >
                  Close
                </button>
              </div>
            )}

            <h3 className="recipe-panel-section">Ingredients</h3>
            <pre className="recipe-panel-body">{detail.ingredients || "—"}</pre>

            <h3 className="recipe-panel-section">Instructions</h3>
            {steps.length === 0 ? (
              <p className="muted">—</p>
            ) : (
              <ol className="recipe-panel-steps">
                {steps.map((step, i) => (
                  <li key={i} className="recipe-panel-step">
                    <span className="recipe-panel-step-num">{i + 1}</span>
                    <span className="recipe-panel-step-text">{step}</span>
                  </li>
                ))}
              </ol>
            )}

            <section className="recipe-notes">
              <h3 className="recipe-panel-section" style={{ marginTop: 0 }}>
                Cooking notes
              </h3>
              <p className="muted text-sm mb-2">
                Tips from your group — what you changed, what worked, what to try next.
              </p>
              {notes.length === 0 ? (
                <p className="muted text-sm">No notes yet. Be the first to leave one.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="recipe-note">
                    <p className="recipe-note-author">{n.authorName}&apos;s notes:</p>
                    <p className="recipe-note-body">&ldquo;{n.body}&rdquo;</p>
                    <p className="recipe-note-date">{formatRecipeDate(n.createdAt)}</p>
                  </div>
                ))
              )}
              <form onSubmit={submitNote} className="recipe-notes-form">
                <p className="text-sm muted">
                  Posting as <strong className="text-ink">{username || "you"}</strong>
                </p>
                <textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  className="field min-h-[5rem] resize-y"
                  placeholder="e.g. I used 1.5x the garlic and it was way better."
                  maxLength={2000}
                />
                {noteError && (
                  <p className="text-red-700 text-sm" role="alert">
                    {noteError}
                  </p>
                )}
                <button type="submit" disabled={noteSaving} className="btn-primary self-start">
                  {noteSaving ? "Saving…" : "Add note"}
                </button>
              </form>
            </section>
          </>
        )}
      </RecipePanel>
    </div>
  );
}

function AddRecipeForm({
  cookbookId,
  username,
  onClose,
  onSuccess,
}: {
  cookbookId: string;
  username: string;
  onClose: () => void;
  onSuccess: (recipeId?: string) => void;
}) {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
      onSuccess(data.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PaperSheet>
      <h2 className="display-title text-xl text-ink mb-4">Add a recipe</h2>
      <p className="muted text-sm mb-4">
        Adding as <strong className="text-ink">{username || "you"}</strong>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            Recipe name <span className="text-coral">*</span>
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
