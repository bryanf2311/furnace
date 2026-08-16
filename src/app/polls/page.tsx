"use client";

import { useMemo, useState } from "react";
import { BarChart3, Check, Plus, Save, Trash2, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import {
  addPoll,
  clearVote,
  closePoll,
  deletePoll,
  usePolls,
  votePoll,
} from "@/lib/firestore";
import { timeAgo, classNames } from "@/lib/utils";

export default function PollsPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const { items, loading } = usePolls();
  const effectiveAdmin = isAdmin && viewMode === "leader";

  const [adding, setAdding] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [saving, setSaving] = useState(false);

  function updateOption(i: number, v: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  }
  function addOption() {
    if (options.length >= 8) return;
    setOptions((prev) => [...prev, ""]);
  }
  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !question.trim() || saving) return;
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length < 2) return;
    setSaving(true);
    try {
      await addPoll({
        question: question.trim(),
        options: cleaned.map((label) => ({ id: label.toLowerCase().replace(/\s+/g, "-").slice(0, 32) + "-" + Math.random().toString(36).slice(2, 6), label })),
        createdBy: profile.uid,
        createdByName: profile.displayName,
      });
      setQuestion("");
      setOptions(["", ""]);
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function removePoll(id: string) {
    if (!confirm("Delete this poll?")) return;
    await deletePoll(id);
  }

  async function toggleClosed(id: string, closed: boolean) {
    await closePoll(id, !closed);
  }

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <p className="mono-cap text-iron">Polls</p>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            {effectiveAdmin ? "Get a read on the room" : "Cast your vote"}
          </h1>
        </div>
        {effectiveAdmin && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded bg-iron px-3 py-2 text-sm font-medium text-ink hover:bg-iron-glow"
          >
            <Plus size={14} /> New poll
          </button>
        )}
      </div>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        {effectiveAdmin
          ? "Post a question with two or more options. Brothers can vote once per poll."
          : "Pick your answer on each open poll. Your vote counts once."}
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* CREATE FORM (leader only) */}
      {effectiveAdmin && adding && (
        <form
          onSubmit={save}
          className="mb-8 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5"
        >
          <h2 className="display text-xl mb-3">New poll</h2>
          <label className="block">
            <span className="mono-cap text-parchment-500 dark:text-parchment-400">Question</span>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What day should we start next week?"
              className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              autoFocus
            />
          </label>
          <div className="mt-4 space-y-2">
            <span className="mono-cap text-parchment-500 dark:text-parchment-400">Options</span>
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={o}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-parchment-500 dark:text-parchment-400 hover:text-ember"
                    aria-label="Remove option"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {options.length < 8 && (
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1 text-xs text-iron hover:underline"
              >
                <Plus size={12} /> Add option
              </button>
            )}
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded border border-parchment-200 dark:border-parchment-700 px-3 py-1.5 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !question.trim() ||
                options.filter((o) => o.trim()).length < 2 ||
                saving
              }
              className="inline-flex items-center gap-1 rounded bg-iron px-3 py-1.5 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
            >
              <Save size={14} /> {saving ? "Posting..." : "Post poll"}
            </button>
          </div>
        </form>
      )}

      {/* POLL LIST */}
      {loading && (
        <p className="text-center text-parchment-500 dark:text-parchment-400 py-12 serif-italic">Loading...</p>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-10 text-center">
          <BarChart3 size={28} className="mx-auto text-parchment-400 dark:text-parchment-500" />
          <p className="serif-italic mt-3 text-parchment-500 dark:text-parchment-400">
            No polls yet.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="space-y-6">
          {items.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              profile={profile}
              effectiveAdmin={effectiveAdmin}
              onClose={() => toggleClosed(poll.id, poll.closed)}
              onDelete={() => removePoll(poll.id)}
            />
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

function PollCard({
  poll,
  profile,
  effectiveAdmin,
  onClose,
  onDelete,
}: {
  poll: ReturnType<typeof usePolls>["items"][number];
  profile: ReturnType<typeof useAuth>["profile"];
  effectiveAdmin: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const total = Object.keys(poll.votes).length;
  const tally = useMemo(() => {
    const t: Record<string, number> = {};
    Object.values(poll.votes).forEach((optId) => (t[optId] = (t[optId] ?? 0) + 1));
    return t;
  }, [poll.votes]);
  const myVote = profile ? poll.votes[profile.uid] : undefined;
  const locked = poll.closed;

  return (
    <li
      className={classNames(
        "rounded border p-5",
        locked
          ? "border-parchment-200 dark:border-parchment-700 bg-parchment-100 dark:bg-parchment-900/40"
          : "border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70"
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="display text-xl">{poll.question}</h3>
          <p className="mono-cap mt-1 text-parchment-500 dark:text-parchment-400">
            {poll.createdByName} · {timeAgo(poll.createdAt)} · {total} {total === 1 ? "vote" : "votes"}
            {locked && " · closed"}
          </p>
        </div>
        {effectiveAdmin && (
          <div className="flex gap-1">
            <button
              onClick={onClose}
              className="rounded-sm border border-parchment-200 dark:border-parchment-700 px-2 py-1 text-xs text-parchment-700 dark:text-parchment-300 hover:border-iron"
            >
              {poll.closed ? "Reopen" : "Close"}
            </button>
            <button
              onClick={onDelete}
              className="rounded-sm border border-ember/40 px-2 py-1 text-xs text-ember hover:bg-ember/10"
              aria-label="Delete poll"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {poll.options.map((opt) => {
          const count = tally[opt.id] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const picked = myVote === opt.id;
          return (
            <li key={opt.id}>
              {locked || effectiveAdmin || myVote ? (
                <button
                  onClick={() => {
                    if (locked || !profile) return;
                    if (picked) {
                      clearVote(poll.id, profile.uid);
                    } else {
                      votePoll(poll.id, profile.uid, opt.id);
                    }
                  }}
                  disabled={locked || !profile}
                  className={classNames(
                    "relative w-full overflow-hidden rounded border px-3 py-2 text-left transition-colors disabled:cursor-default",
                    picked
                      ? "border-iron bg-iron/10"
                      : "border-parchment-200 dark:border-parchment-700 hover:border-iron"
                  )}
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-iron/15"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="relative flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm text-parchment-900 dark:text-parchment-100">
                      {picked && <Check size={14} className="text-iron" />}
                      {opt.label}
                    </span>
                    <span className="mono-cap text-xs text-parchment-500 dark:text-parchment-400">
                      {count} · {pct}%
                    </span>
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => profile && votePoll(poll.id, profile.uid, opt.id)}
                  className="w-full rounded border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-left text-sm text-parchment-900 dark:text-parchment-100 hover:border-iron"
                >
                  {opt.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </li>
  );
}
