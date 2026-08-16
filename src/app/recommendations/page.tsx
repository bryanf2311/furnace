"use client";

import { useState } from "react";
import { Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import {
  addRecommendation,
  deleteRecommendation,
  useRecommendations,
} from "@/lib/firestore";
import { timeAgo } from "@/lib/utils";
import { READING_KIND_LABEL, type ReadingKind } from "@/lib/types";

const KIND_OPTIONS: ReadingKind[] = ["book", "passage", "article", "devotional"];

export default function RecommendationsPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const { items, loading } = useRecommendations();
  const effectiveAdmin = isAdmin && viewMode === "leader";

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [kind, setKind] = useState<ReadingKind>("book");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title.trim() || saving) return;
    setSaving(true);
    try {
      await addRecommendation({
        title: title.trim(),
        author: author.trim(),
        kind,
        note: note.trim(),
        addedBy: profile.uid,
        addedByName: profile.displayName,
      });
      setTitle("");
      setAuthor("");
      setKind("book");
      setNote("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this recommendation?")) return;
    await deleteRecommendation(id);
  }

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <p className="mono-cap text-iron">Recommended</p>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            Books we'd put in your hands
          </h1>
        </div>
        {effectiveAdmin && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded bg-iron px-3 py-2 text-sm font-medium text-ink hover:bg-iron-glow"
          >
            <Plus size={14} /> Suggest one
          </button>
        )}
      </div>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        Leaders suggest books, passages, articles, or devotionals the group should walk through. Not assigned — just a short list we'd put in your hands.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {effectiveAdmin && adding && (
        <form
          onSubmit={save}
          className="mb-8 grid gap-3 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5 sm:grid-cols-3"
        >
          <h2 className="display text-xl sm:col-span-3">New recommendation</h2>
          <label className="block sm:col-span-2">
            <span className="mono-cap text-parchment-500 dark:text-parchment-400">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Reason for God"
              className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="mono-cap text-parchment-500 dark:text-parchment-400">Kind</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ReadingKind)}
              className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100"
            >
              {KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>{READING_KIND_LABEL[k]}</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-3">
            <span className="mono-cap text-parchment-500 dark:text-parchment-400">Author (optional)</span>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Timothy Keller"
              className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
            />
          </label>
          <label className="block sm:col-span-3">
            <span className="mono-cap text-parchment-500 dark:text-parchment-400">Why this one (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A line on why the brothers should read it."
              rows={2}
              className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
            />
          </label>
          <div className="sm:col-span-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="inline-flex items-center gap-1 rounded border border-parchment-200 dark:border-parchment-700 px-3 py-1.5 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron"
            >
              <X size={14} /> Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="inline-flex items-center gap-1 rounded bg-iron px-3 py-1.5 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
            >
              <Save size={14} /> {saving ? "Saving..." : "Add to list"}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <p className="text-center text-parchment-500 dark:text-parchment-400 py-12 serif-italic">Loading...</p>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-10 text-center">
          <Sparkles size={28} className="mx-auto text-parchment-400 dark:text-parchment-500" />
          <p className="serif-italic mt-3 text-parchment-500 dark:text-parchment-400">
            No recommendations yet.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-sm bg-iron/15 text-iron">
                  <Sparkles size={18} />
                </div>
                {effectiveAdmin && (
                  <button
                    onClick={() => remove(r.id)}
                    className="text-parchment-500 dark:text-parchment-400 hover:text-ember"
                    aria-label="Remove recommendation"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <h3 className="display mt-3 text-xl leading-snug">{r.title}</h3>
              <div className="mt-1 flex items-baseline gap-2 text-sm text-parchment-500 dark:text-parchment-400">
                <span>{READING_KIND_LABEL[r.kind]}</span>
                {r.author && <span>· {r.author}</span>}
              </div>
              {r.note && (
                <p className="mt-3 text-sm text-parchment-700 dark:text-parchment-300 whitespace-pre-line">{r.note}</p>
              )}
              <p className="mono-cap mt-3 text-[10px] text-parchment-500 dark:text-parchment-400">
                Added {timeAgo(r.createdAt)} by {r.addedByName}
              </p>
            </li>
          ))}
        </ul>
      )}

      {!loading && items.length > 0 && (
        <div className="my-10">
          <CoalBedThin />
        </div>
      )}
    </Shell>
  );
}
