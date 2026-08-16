"use client";

import { useState } from "react";
import { BookOpen, Plus, Save, Trash2, X, CheckCircle2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import {
  addReading,
  deleteReading,
  updateReading,
  useReadings,
} from "@/lib/firestore";
import { timeAgo, classNames } from "@/lib/utils";
import {
  READING_KIND_LABEL,
  READING_STATUS_LABEL,
  type Reading,
  type ReadingKind,
  type ReadingStatus,
} from "@/lib/types";

const KIND_OPTIONS: ReadingKind[] = ["book", "passage", "article", "devotional"];

const STATUS_ORDER: ReadingStatus[] = ["current", "upcoming", "finished"];

export default function ReadingsPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const { items, loading } = useReadings();
  const effectiveAdmin = isAdmin && viewMode === "leader";

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<Reading, "id" | "createdAt"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function startNew() {
    if (!profile) return;
    setDraft({
      title: "",
      author: "",
      kind: "book",
      note: "",
      status: "upcoming",
      createdBy: profile.uid,
      createdByName: profile.displayName,
    });
    setAdding(true);
  }

  function startEdit(r: Reading) {
    setEditingId(r.id);
    setDraft({
      title: r.title,
      author: r.author ?? "",
      kind: r.kind,
      note: r.note ?? "",
      status: r.status,
      createdBy: r.createdBy,
      createdByName: r.createdByName,
    });
  }

  function close() {
    setAdding(false);
    setEditingId(null);
    setDraft(null);
  }

  async function save() {
    if (!draft) return;
    if (editingId) {
      await updateReading(editingId, {
        title: draft.title.trim(),
        author: draft.author?.trim() || "",
        kind: draft.kind,
        note: draft.note?.trim() || "",
        status: draft.status,
      });
    } else {
      await addReading({
        ...draft,
        title: draft.title.trim(),
        author: draft.author?.trim() || undefined,
        note: draft.note?.trim() || undefined,
      });
    }
    close();
  }

  async function setStatus(id: string, status: ReadingStatus) {
    await updateReading(id, { status });
  }

  async function remove(id: string) {
    if (!confirm("Remove this from the list?")) return;
    await deleteReading(id);
  }

  const grouped: Record<ReadingStatus, Reading[]> = {
    current: [],
    upcoming: [],
    finished: [],
  };
  items.forEach((r) => grouped[r.status].push(r));

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <p className="mono-cap text-iron">Readings</p>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            What we're reading
          </h1>
        </div>
        {effectiveAdmin && !adding && !editingId && (
          <button
            onClick={startNew}
            className="inline-flex items-center gap-1.5 rounded bg-iron px-3 py-2 text-sm font-medium text-ink hover:bg-iron-glow"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        {effectiveAdmin
          ? "Books, passages, and devotionals you're walking through as a group. Set the current one and the rest will queue."
          : "Books and passages the leaders have on the nightstand. Read along at your own pace."}
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* ADD / EDIT FORM */}
      {effectiveAdmin && draft && (adding || editingId) && (
        <div className="mb-8 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="display text-xl">{editingId ? "Edit reading" : "New reading"}</h2>
            {editingId && (
              <button
                onClick={() => remove(editingId)}
                className="inline-flex items-center gap-1 text-xs text-ember hover:underline"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-3">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Title</span>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Knowing God"
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Author</span>
              <input
                type="text"
                value={draft.author ?? ""}
                onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                placeholder="J.I. Packer"
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              />
            </label>
            <label className="block">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Kind</span>
              <select
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as ReadingKind })}
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100"
              >
                {KIND_OPTIONS.map((k) => (
                  <option key={k} value={k}>{READING_KIND_LABEL[k]}</option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-3">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Why this one</span>
              <textarea
                value={draft.note ?? ""}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="A sentence on what the brothers should get out of it."
                rows={3}
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={close}
              className="inline-flex items-center gap-1 rounded border border-parchment-200 dark:border-parchment-700 px-3 py-1.5 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron"
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={save}
              disabled={!draft.title.trim()}
              className="inline-flex items-center gap-1 rounded bg-iron px-3 py-1.5 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
            >
              <Save size={14} /> Save
            </button>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-center text-parchment-500 dark:text-parchment-400 py-12 serif-italic">Loading...</p>
      )}

      {!loading && items.length === 0 && !adding && (
        <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-10 text-center">
          <BookOpen size={28} className="mx-auto text-parchment-400 dark:text-parchment-500" />
          <p className="serif-italic mt-3 text-parchment-500 dark:text-parchment-400">
            {effectiveAdmin
              ? "Nothing on the nightstand yet. Add the first reading."
              : "No readings picked yet. Check back soon."}
          </p>
          {effectiveAdmin && (
            <button
              onClick={startNew}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-iron hover:underline"
            >
              <Plus size={14} /> Add a reading
            </button>
          )}
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          {STATUS_ORDER.map((status) => {
            const list = grouped[status];
            if (list.length === 0) return null;
            return (
              <section key={status} className="mb-10">
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="display text-2xl">{READING_STATUS_LABEL[status]}</h2>
                  <span className="mono-cap text-parchment-500 dark:text-parchment-400">
                    {list.length} {list.length === 1 ? "reading" : "readings"}
                  </span>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {list.map((r) => (
                    <li
                      key={r.id}
                      className={classNames(
                        "rounded border p-5 transition-colors",
                        status === "current"
                          ? "border-iron/40 bg-iron/5"
                          : status === "finished"
                            ? "border-parchment-200 dark:border-parchment-700 bg-parchment-100 dark:bg-parchment-900/40 opacity-70"
                            : "border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-parchment-200 dark:bg-parchment-800 text-parchment-700 dark:text-parchment-200">
                          {status === "finished" ? <CheckCircle2 size={18} /> : <BookOpen size={18} />}
                        </div>
                        {effectiveAdmin && (
                          <div className="flex flex-wrap gap-1">
                            {STATUS_ORDER.filter((s) => s !== r.status).map((s) => (
                              <button
                                key={s}
                                onClick={() => setStatus(r.id, s)}
                                className="mono-cap rounded-sm border border-parchment-200 dark:border-parchment-700 px-2 py-0.5 text-[10px] text-parchment-500 dark:text-parchment-400 hover:border-iron hover:text-iron"
                              >
                                {READING_STATUS_LABEL[s]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <h3 className="display mt-3 text-xl leading-snug">{r.title}</h3>
                      <div className="mt-1 flex items-baseline gap-2 text-sm text-parchment-500 dark:text-parchment-400">
                        <span>{READING_KIND_LABEL[r.kind]}</span>
                        {r.author && <span>· {r.author}</span>}
                      </div>
                      {r.note && (
                        <p className="mt-3 text-sm text-parchment-700 dark:text-parchment-300">{r.note}</p>
                      )}
                      <p className="mono-cap mt-3 text-[10px] text-parchment-500 dark:text-parchment-400">
                        Added {timeAgo(r.createdAt)} by {r.createdByName}
                      </p>
                      {effectiveAdmin && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => startEdit(r)}
                            className="text-xs text-parchment-500 dark:text-parchment-400 hover:text-iron"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {status !== "finished" && <div className="mt-8"><CoalBedThin /></div>}
              </section>
            );
          })}
        </>
      )}
    </Shell>
  );
}
