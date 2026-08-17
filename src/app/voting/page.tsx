"use client";

import { useState } from "react";
import { Check, Plus, Save, Send, ThumbsUp, Trash2, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import {
  addIdea,
  addPoll,
  clearVote,
  closePoll,
  deleteIdea,
  deletePoll,
  recordIdeaPosted,
  recordPollPosted,
  toggleVote,
  useIdeas,
  usePolls,
  votePoll,
} from "@/lib/firestore";
import { timeAgo, classNames } from "@/lib/utils";
import type { PollOption } from "@/lib/types";

export default function VotingPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const effectiveAdmin = isAdmin && viewMode === "leader";
  const { items: ideas, loading: ideasLoading } = useIdeas();
  const { items: polls, loading: pollsLoading } = usePolls();

  if (!effectiveAdmin) {
    return (
      <Shell>
        <p className="mono-cap text-iron">Voting</p>
        <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
          Leaders only
        </h1>
        <p className="mt-3 text-parchment-700 dark:text-parchment-300">
          This page is for the leaders to pitch ideas and post polls. You're seeing the app as a member.
        </p>
      </Shell>
    );
  }

  const leaderIdeas = ideas.filter((i) => i.source === "leader" || !i.source);
  const memberIdeas = ideas.filter((i) => i.source === "member");

  return (
    <Shell>
      <p className="mono-cap text-iron">Voting</p>
      <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
        Pitch, vote, decide
      </h1>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        Ideas below — pitch topics, see what brothers are suggesting. Polls at the bottom — quick decisions.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* IDEAS SECTION */}
      <IdeasSection
        leaderIdeas={leaderIdeas}
        memberIdeas={memberIdeas}
        loading={ideasLoading}
        profile={profile}
      />

      <div className="my-10">
        <CoalBedThin />
      </div>

      {/* POLLS SECTION */}
      <PollsSection items={polls} loading={pollsLoading} profile={profile} />
    </Shell>
  );
}

// === Ideas section ===
function IdeasSection({
  leaderIdeas,
  memberIdeas,
  loading,
  profile,
}: {
  leaderIdeas: ReturnType<typeof useIdeas>["items"];
  memberIdeas: ReturnType<typeof useIdeas>["items"];
  loading: boolean;
  profile: ReturnType<typeof useAuth>["profile"];
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const ref = await addIdea({
        title: title.trim(),
        body: body.trim(),
        createdBy: profile.uid,
        createdByName: profile.displayName,
        source: "leader",
      });
      await recordIdeaPosted(profile, ref.id, title.trim());
      setTitle("");
      setBody("");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeIdea(id: string) {
    if (!confirm("Delete this idea?")) return;
    await deleteIdea(id);
  }

  const sorted = (arr: typeof leaderIdeas) =>
    [...arr].sort((a, b) => {
      const va = Object.keys(a.votes).length;
      const vb = Object.keys(b.votes).length;
      if (vb !== va) return vb - va;
      return b.createdAt - a.createdAt;
    });

  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <SectionLabel>Ideas</SectionLabel>
          <h2 className="display mt-2 text-2xl">Topics to consider</h2>
        </div>
        <span className="mono-cap text-parchment-500 dark:text-parchment-400">
          {ideasTotal(leaderIdeas, memberIdeas)} on the board
        </span>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-3 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5 sm:grid-cols-3"
      >
        <h3 className="display text-lg sm:col-span-3">Pitch an idea</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Topic (e.g. Idolatry of comfort)"
          className="sm:col-span-3 rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
          required
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Why does this matter? What passage? What questions should we bring?"
          rows={3}
          className="sm:col-span-3 rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
        />
        <div className="sm:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="inline-flex items-center gap-2 rounded bg-iron px-4 py-2 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
          >
            <Send size={14} /> {submitting ? "Sending..." : "Post to the board"}
          </button>
        </div>
      </form>

      {loading && (
        <p className="text-center text-parchment-500 dark:text-parchment-400 py-8 serif-italic">Loading...</p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h4 className="display text-lg mb-3">Your pitches</h4>
          {!loading && leaderIdeas.length === 0 ? (
            <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-6 text-center text-parchment-500 dark:text-parchment-400 serif-italic">
              None yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {sorted(leaderIdeas).map((idea) => (
                <IdeaRow key={idea.id} idea={idea} profile={profile} onDelete={removeIdea} canDelete />
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="display text-lg mb-3">From the brothers</h4>
          {!loading && memberIdeas.length === 0 ? (
            <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-6 text-center text-parchment-500 dark:text-parchment-400 serif-italic">
              No suggestions yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {sorted(memberIdeas).map((idea) => (
                <IdeaRow key={idea.id} idea={idea} profile={profile} onDelete={removeIdea} canDelete />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function ideasTotal(a: unknown[], b: unknown[]) {
  return a.length + b.length;
}

// === Polls section ===
function PollsSection({
  items,
  loading,
  profile,
}: {
  items: ReturnType<typeof usePolls>["items"];
  loading: boolean;
  profile: ReturnType<typeof useAuth>["profile"];
}) {
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
      const ref = await addPoll({
        question: question.trim(),
        options: cleaned.map<PollOption>((label) => ({
          id: label.toLowerCase().replace(/\s+/g, "-").slice(0, 32) + "-" + Math.random().toString(36).slice(2, 6),
          label,
        })),
        createdBy: profile.uid,
        createdByName: profile.displayName,
      });
      await recordPollPosted(profile, ref.id, question.trim());
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
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <SectionLabel>Polls</SectionLabel>
          <h2 className="display mt-2 text-2xl">Quick decisions</h2>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded bg-iron px-3 py-2 text-sm font-medium text-ink hover:bg-iron-glow"
          >
            <Plus size={14} /> New poll
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={save}
          className="mb-6 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5"
        >
          <h3 className="display text-lg mb-3">New poll</h3>
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
              disabled={!question.trim() || options.filter((o) => o.trim()).length < 2 || saving}
              className="inline-flex items-center gap-1 rounded bg-iron px-3 py-1.5 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
            >
              <Save size={14} /> {saving ? "Posting..." : "Post poll"}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <p className="text-center text-parchment-500 dark:text-parchment-400 py-8 serif-italic">Loading...</p>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-8 text-center">
          <p className="serif-italic text-parchment-500 dark:text-parchment-400">No polls yet.</p>
        </div>
      )}

      <ul className="space-y-5">
        {items.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            profile={profile}
            onClose={() => toggleClosed(poll.id, poll.closed)}
            onDelete={() => removePoll(poll.id)}
          />
        ))}
      </ul>
    </section>
  );
}

// === Reusable bits ===

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mono-cap text-iron">{children}</div>;
}

function IdeaRow({
  idea,
  profile,
  onDelete,
  canDelete,
}: {
  idea: ReturnType<typeof useIdeas>["items"][number];
  profile: ReturnType<typeof useAuth>["profile"];
  onDelete: (id: string) => void;
  canDelete: boolean;
}) {
  const voted = profile ? Boolean(idea.votes[profile.uid]) : false;
  const count = Object.keys(idea.votes).length;
  return (
    <li className="group rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-4 hover:border-iron">
      <div className="flex items-start gap-3">
        <button
          onClick={() => profile && toggleVote(idea.id, profile.uid, !voted)}
          disabled={!profile}
          aria-label={voted ? "Remove vote" : "Vote for this idea"}
          className={classNames(
            "grid h-10 w-10 shrink-0 place-items-center rounded-sm border transition-all",
            voted
              ? "border-ember bg-ember/15 text-ember"
              : "border-parchment-200 dark:border-parchment-700 text-parchment-500 dark:text-parchment-400 hover:border-iron hover:text-iron"
          )}
        >
          <div className="text-center leading-none">
            {voted ? <Check size={14} /> : <ThumbsUp size={14} />}
            <div className="mt-1 mono-cap text-[10px]">{count}</div>
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="display text-lg leading-snug">{idea.title}</h3>
            <span className="mono-cap text-parchment-500 dark:text-parchment-400 shrink-0">
              {timeAgo(idea.createdAt)}
            </span>
          </div>
          {idea.body && (
            <p className="mt-1 whitespace-pre-line text-sm text-parchment-700 dark:text-parchment-300 line-clamp-3">
              {idea.body}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-parchment-500 dark:text-parchment-400">
              <span className="text-iron">{idea.createdByName}</span>
              {idea.source === "member" && (
                <span className="mono-cap ml-2 text-[10px] text-ember">from a brother</span>
              )}
            </p>
            {canDelete && (
              <button
                onClick={() => onDelete(idea.id)}
                aria-label="Delete idea"
                className="text-parchment-500 dark:text-parchment-400 hover:text-ember"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function PollCard({
  poll,
  profile,
  onClose,
  onDelete,
}: {
  poll: ReturnType<typeof usePolls>["items"][number];
  profile: ReturnType<typeof useAuth>["profile"];
  onClose: () => void;
  onDelete: () => void;
}) {
  const total = Object.keys(poll.votes).length;
  const tally: Record<string, number> = {};
  Object.values(poll.votes).forEach((optId) => (tally[optId] = (tally[optId] ?? 0) + 1));
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
      </div>

      <ul className="mt-4 space-y-2">
        {poll.options.map((opt) => {
          const count = tally[opt.id] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const picked = myVote === opt.id;
          return (
            <li key={opt.id}>
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
            </li>
          );
        })}
      </ul>
    </li>
  );
}
