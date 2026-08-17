"use client";

import { useMemo, useState } from "react";
import { BookOpen, Pencil, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import {
  addRecommendation,
  clearCurrentRead,
  deleteRecommendation,
  recordReadingShared,
  recordRecommendationAdded,
  setCurrentRead,
  useCurrentReads,
  useRecommendations,
} from "@/lib/firestore";
import { timeAgo, classNames } from "@/lib/utils";
import { READING_KIND_LABEL, type ReadingKind } from "@/lib/types";

const KIND_OPTIONS: ReadingKind[] = ["book", "passage", "article", "devotional"];

export default function ReadingsPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const { items: reads, loading: readsLoading } = useCurrentReads();
  const { items: recs, loading: recsLoading } = useRecommendations();
  const effectiveAdmin = isAdmin && viewMode === "leader";

  const mine = useMemo(() => {
    if (!profile) return null;
    return reads.find((r) => r.uid === profile.uid) ?? null;
  }, [reads, profile]);

  // === Edit current read ===
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    if (mine) {
      setTitle(mine.title);
      setAuthor(mine.author ?? "");
      setNote(mine.note ?? "");
    } else {
      setTitle("");
      setAuthor("");
      setNote("");
    }
    setEditing(true);
  }

  async function saveCurrent(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title.trim() || saving) return;
    setSaving(true);
    try {
      await setCurrentRead({
        uid: profile.uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        title: title.trim(),
        author: author.trim(),
        note: note.trim(),
      });
      await recordReadingShared(profile, profile.uid, title.trim(), author.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function clearMine() {
    if (!profile) return;
    if (!confirm("Remove your current read?")) return;
    await clearCurrentRead(profile.uid);
    setEditing(false);
  }

  // === Add recommendation (leaders only) ===
  const [addingRec, setAddingRec] = useState(false);
  const [rTitle, setRTitle] = useState("");
  const [rAuthor, setRAuthor] = useState("");
  const [rKind, setRKind] = useState<ReadingKind>("book");
  const [rNote, setRNote] = useState("");
  const [rSaving, setRSaving] = useState(false);

  async function saveRec(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !rTitle.trim() || rSaving) return;
    setRSaving(true);
    try {
      const ref = await addRecommendation({
        title: rTitle.trim(),
        author: rAuthor.trim(),
        kind: rKind,
        note: rNote.trim(),
        addedBy: profile.uid,
        addedByName: profile.displayName,
      });
      await recordRecommendationAdded(profile, ref.id, rTitle.trim());
      setRTitle("");
      setRAuthor("");
      setRKind("book");
      setRNote("");
      setAddingRec(false);
    } finally {
      setRSaving(false);
    }
  }

  async function removeRec(id: string) {
    if (!confirm("Remove this recommendation?")) return;
    await deleteRecommendation(id);
  }

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <p className="mono-cap text-iron">Reading</p>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            What we're reading
          </h1>
        </div>
        {profile && !editing && (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 rounded bg-iron px-3 py-2 text-sm font-medium text-ink hover:bg-iron-glow"
          >
            {mine ? (
              <>
                <Pencil size={14} /> Update mine
              </>
            ) : (
              <>
                <BookOpen size={14} /> Share what I'm reading
              </>
            )}
          </button>
        )}
      </div>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        A roll call of books the brothers are in. Share what you're reading now, see what the rest of the room is digging into, and pick up the recommendations below.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* EDIT CURRENT READ */}
      {editing && profile && (
        <form
          onSubmit={saveCurrent}
          className="mb-8 grid gap-3 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5 sm:grid-cols-3"
        >
          <h2 className="display text-xl sm:col-span-3">
            {mine ? "Update what you're reading" : "What are you reading?"}
          </h2>
          <label className="block sm:col-span-2">
            <span className="mono-cap text-parchment-500 dark:text-parchment-400">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Knowing God"
              className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="mono-cap text-parchment-500 dark:text-parchment-400">Author</span>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="J.I. Packer"
              className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
            />
          </label>
          <label className="block sm:col-span-3">
            <span className="mono-cap text-parchment-500 dark:text-parchment-400">Note (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Where you are, what you're getting out of it, or who you'd recommend it to."
              rows={2}
              className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
            />
          </label>
          <div className="sm:col-span-3 flex items-center justify-between">
            {mine ? (
              <button
                type="button"
                onClick={clearMine}
                className="text-xs text-parchment-500 dark:text-parchment-400 hover:text-ember"
              >
                Remove from feed
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 rounded border border-parchment-200 dark:border-parchment-700 px-3 py-1.5 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron"
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || saving}
                className="rounded bg-iron px-3 py-1.5 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
              >
                {saving ? "Saving..." : "Share"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* CURRENT READS FEED */}
      {readsLoading && (
        <p className="text-center text-parchment-500 dark:text-parchment-400 py-12 serif-italic">Loading...</p>
      )}

      {!readsLoading && reads.length === 0 && (
        <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-10 text-center">
          <BookOpen size={28} className="mx-auto text-parchment-400 dark:text-parchment-500" />
          <p className="serif-italic mt-3 text-parchment-500 dark:text-parchment-400">
            Nobody's shared yet. Be the first to put something on the table.
          </p>
          {profile && !editing && (
            <button
              onClick={startEdit}
              className="mt-4 inline-block text-sm text-iron hover:underline"
            >
              Share what I'm reading →
            </button>
          )}
        </div>
      )}

      {!readsLoading && reads.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {reads.map((r) => (
            <li
              key={r.uid}
              className={classNames(
                "rounded border p-5",
                r.uid === profile?.uid
                  ? "border-iron/40 bg-iron/5"
                  : "border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70"
              )}
            >
              <div className="flex items-start gap-3">
                {r.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.photoURL}
                    alt=""
                    className="h-10 w-10 rounded-full border border-parchment-200 dark:border-parchment-700"
                  />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-parchment-200 dark:bg-parchment-700 text-sm">
                    {r.displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-sm text-parchment-900 dark:text-parchment-100">
                      {r.displayName}
                    </span>
                    {r.uid === profile?.uid && (
                      <span className="mono-cap text-[10px] text-iron">you</span>
                    )}
                  </div>
                  <span className="mono-cap text-[10px] text-parchment-500 dark:text-parchment-400">
                    updated {timeAgo(r.updatedAt)}
                  </span>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-parchment-200 dark:bg-parchment-800 text-iron">
                  <BookOpen size={18} />
                </div>
              </div>
              <h3 className="display mt-3 text-xl leading-snug">{r.title}</h3>
              {r.author && (
                <p className="mt-1 text-sm text-parchment-500 dark:text-parchment-400">{r.author}</p>
              )}
              {r.note && (
                <p className="mt-3 text-sm text-parchment-700 dark:text-parchment-300 whitespace-pre-line">
                  {r.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="my-10">
        <CoalBedThin />
      </div>

      {/* RECOMMENDATIONS */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <p className="mono-cap text-iron">For the group</p>
            <h2 className="display mt-2 text-2xl">Recommended</h2>
          </div>
          {effectiveAdmin && !addingRec && (
            <button
              onClick={() => setAddingRec(true)}
              className="inline-flex items-center gap-1.5 text-sm text-iron hover:underline"
            >
              <Plus size={14} /> Suggest one
            </button>
          )}
        </div>

        {effectiveAdmin && addingRec && (
          <form
            onSubmit={saveRec}
            className="mb-6 grid gap-3 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5 sm:grid-cols-3"
          >
            <h3 className="display text-lg sm:col-span-3">New recommendation</h3>
            <label className="block sm:col-span-2">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Title</span>
              <input
                type="text"
                value={rTitle}
                onChange={(e) => setRTitle(e.target.value)}
                placeholder="e.g. The Reason for God"
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Kind</span>
              <select
                value={rKind}
                onChange={(e) => setRKind(e.target.value as ReadingKind)}
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
                value={rAuthor}
                onChange={(e) => setRAuthor(e.target.value)}
                placeholder="Timothy Keller"
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              />
            </label>
            <label className="block sm:col-span-3">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Why this one (optional)</span>
              <textarea
                value={rNote}
                onChange={(e) => setRNote(e.target.value)}
                placeholder="A line on why the brothers should read it."
                rows={2}
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              />
            </label>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddingRec(false)}
                className="inline-flex items-center gap-1 rounded border border-parchment-200 dark:border-parchment-700 px-3 py-1.5 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron"
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="submit"
                disabled={!rTitle.trim() || rSaving}
                className="inline-flex items-center gap-1 rounded bg-iron px-3 py-1.5 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
              >
                <Save size={14} /> {rSaving ? "Saving..." : "Add"}
              </button>
            </div>
          </form>
        )}

        {recsLoading && (
          <p className="text-center text-parchment-500 dark:text-parchment-400 py-8 serif-italic">Loading...</p>
        )}

        {!recsLoading && recs.length === 0 && (
          <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-8 text-center">
            <Sparkles size={24} className="mx-auto text-parchment-400 dark:text-parchment-500" />
            <p className="serif-italic mt-2 text-parchment-500 dark:text-parchment-400">
              {effectiveAdmin
                ? "No recommendations yet. Suggest a book the brothers should read."
                : "The leaders haven't recommended anything yet."}
            </p>
          </div>
        )}

        {!recsLoading && recs.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map((r) => (
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
                      onClick={() => removeRec(r.id)}
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
      </section>
    </Shell>
  );
}
