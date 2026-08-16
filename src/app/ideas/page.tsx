"use client";

import { useState } from "react";
import { Send, ThumbsUp, Check } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { addIdea, toggleVote, useIdeas } from "@/lib/firestore";
import { timeAgo, classNames } from "@/lib/utils";

export default function IdeasPage() {
  const { profile } = useAuth();
  const { items, loading } = useIdeas();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine">("all");

  const sorted = [...items].sort((a, b) => {
    const va = Object.keys(a.votes).length;
    const vb = Object.keys(b.votes).length;
    if (vb !== va) return vb - va;
    return b.createdAt - a.createdAt;
  });

  const visible = sorted.filter((i) =>
    filter === "all" ? true : i.createdBy === profile?.uid
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addIdea({
        title: title.trim(),
        body: body.trim(),
        createdBy: profile.uid,
        createdByName: profile.displayName,
      });
      setTitle("");
      setBody("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <p className="mono-cap text-iron">Ideas</p>
      <h1 className="display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
        What's the Lord teaching you?
      </h1>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        Drop a topic, a question, a verse the brothers should wrestle with. The most-voted ideas rise to the top of next week's plan.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* ADD */}
      <form
        onSubmit={submit}
        className="grid gap-3 rounded border border-parchment-200 dark:border-parchment-700 bg-white/80 dark:bg-parchment-900/60 p-5 sm:grid-cols-3"
      >
        <div className="sm:col-span-3 flex items-baseline justify-between">
          <h2 className="display text-xl">Pitch an idea</h2>
          <span className="mono-cap text-parchment-400 dark:text-parchment-500">{visible.length} on the board</span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Topic (e.g. Idolatry of comfort)"
          className="sm:col-span-3 rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:text-parchment-500"
          required
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Why does this matter? What's the passage? What questions should we bring?"
          rows={3}
          className="sm:col-span-3 rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:text-parchment-500"
        />
        <div className="sm:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="inline-flex items-center gap-2 rounded bg-iron px-4 py-2 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
          >
            <Send size={14} /> {submitting ? "Sending..." : "Send to the board"}
          </button>
        </div>
      </form>

      <div className="my-6 flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={classNames(
            "rounded-sm px-3 py-1.5 text-sm transition-colors",
            filter === "all"
              ? "bg-parchment-100 dark:bg-parchment-800 text-parchment-900 dark:text-parchment-100"
              : "text-parchment-500 dark:text-parchment-400 hover:text-parchment-900 dark:text-parchment-100"
          )}
        >
          All ideas
        </button>
        <button
          onClick={() => setFilter("mine")}
          className={classNames(
            "rounded-sm px-3 py-1.5 text-sm transition-colors",
            filter === "mine"
              ? "bg-parchment-100 dark:bg-parchment-800 text-parchment-900 dark:text-parchment-100"
              : "text-parchment-500 dark:text-parchment-400 hover:text-parchment-900 dark:text-parchment-100"
          )}
        >
          My ideas
        </button>
      </div>

      {/* LIST */}
      {loading && (
        <p className="text-center text-parchment-500 dark:text-parchment-400 py-12 serif-italic">Stoking the coals...</p>
      )}
      {!loading && visible.length === 0 && (
        <div className="rounded border border-dashed border-parchment-200 dark:border-parchment-700 p-10 text-center">
          <p className="serif-italic text-parchment-700 dark:text-parchment-300 text-lg">
            No ideas here yet. Be the first to throw something on the fire.
          </p>
        </div>
      )}
      <ul className="space-y-3">
        {visible.map((idea) => {
          const voted = profile ? Boolean(idea.votes[profile.uid]) : false;
          const count = Object.keys(idea.votes).length;
          return (
            <li
              key={idea.id}
              className="group flex items-start gap-4 rounded border border-parchment-200 dark:border-parchment-700 bg-white/70 dark:bg-parchment-900/40 p-4 hover:border-iron"
            >
              <button
                onClick={() =>
                  profile && toggleVote(idea.id, profile.uid, !voted)
                }
                disabled={!profile}
                aria-label={voted ? "Remove vote" : "Vote for this idea"}
                className={classNames(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-sm border transition-all",
                  voted
                    ? "border-ember bg-ember/15 text-ember"
                    : "border-parchment-200 dark:border-parchment-700 text-parchment-500 dark:text-parchment-400 hover:border-iron hover:text-iron"
                )}
              >
                <div className="text-center leading-none">
                  {voted ? <Check size={16} /> : <ThumbsUp size={16} />}
                  <div className="mt-1 mono-cap text-[10px]">{count}</div>
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="display text-lg">{idea.title}</h3>
                  <span className="mono-cap text-parchment-400 dark:text-parchment-500 shrink-0">
                    {timeAgo(idea.createdAt)}
                  </span>
                </div>
                {idea.body && (
                  <p className="mt-1 whitespace-pre-line text-sm text-parchment-700 dark:text-parchment-300">{idea.body}</p>
                )}
                <p className="mt-2 text-xs text-parchment-400 dark:text-parchment-500">
                  pitched by <span className="text-iron">{idea.createdByName}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {visible.length > 0 && (
        <div className="my-10">
          <CoalBedThin />
        </div>
      )}
    </Shell>
  );
}
