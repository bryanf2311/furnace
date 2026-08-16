"use client";

import { useState } from "react";
import { Check, Send, ThumbsUp } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { addIdea, toggleVote, useIdeas } from "@/lib/firestore";
import { timeAgo, classNames } from "@/lib/utils";

export default function IdeasPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const { items, loading } = useIdeas();
  const effectiveAdmin = isAdmin && viewMode === "leader";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        source: effectiveAdmin ? "leader" : "member",
      });
      setTitle("");
      setBody("");
    } finally {
      setSubmitting(false);
    }
  }

  const leaderIdeas = items.filter((i) => i.source === "leader" || !i.source);
  const memberIdeas = items.filter((i) => i.source === "member");

  const sorted = (arr: typeof items) =>
    [...arr].sort((a, b) => {
      const va = Object.keys(a.votes).length;
      const vb = Object.keys(b.votes).length;
      if (vb !== va) return vb - va;
      return b.createdAt - a.createdAt;
    });

  return (
    <Shell>
      <p className="mono-cap text-iron">Ideas</p>
      <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
        {effectiveAdmin ? "What's the Lord teaching you?" : "Vote on what's next"}
      </h1>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        {effectiveAdmin
          ? "Drop a topic, a question, a verse the brothers should wrestle with. The most-voted ideas float up."
          : "Read what the leaders are pitching, then vote on what you'd like to study. You can also suggest your own idea below."}
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* PITCH FORM */}
      <form
        onSubmit={submit}
        className="grid gap-3 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5 sm:grid-cols-3"
      >
        <div className="sm:col-span-3 flex items-baseline justify-between">
          <h2 className="display text-xl">
            {effectiveAdmin ? "Pitch an idea" : "Suggest a topic"}
          </h2>
          <span className="mono-cap text-parchment-500 dark:text-parchment-400">
            {items.length} on the board
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            effectiveAdmin
              ? "Topic (e.g. Idolatry of comfort)"
              : "Topic you'd like the brothers to study"
          }
          className="sm:col-span-3 rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
          required
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Why does this matter? What's the passage? What questions should we bring?"
          rows={3}
          className="sm:col-span-3 rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
        />
        <div className="sm:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="inline-flex items-center gap-2 rounded bg-iron px-4 py-2 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
          >
            <Send size={14} /> {submitting ? "Sending..." : effectiveAdmin ? "Post to the board" : "Send to leaders"}
          </button>
        </div>
      </form>

      {/* LEADER PITCHES */}
      <section className="mt-10">
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <SectionLabel>From the leaders</SectionLabel>
            <h2 className="display mt-2 text-2xl">On the board</h2>
          </div>
          <span className="mono-cap text-parchment-500 dark:text-parchment-400">
            {leaderIdeas.length} topic{leaderIdeas.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading && (
          <p className="text-center text-parchment-500 dark:text-parchment-400 py-12 serif-italic">Loading...</p>
        )}
        {!loading && leaderIdeas.length === 0 && (
          <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-10 text-center">
            <p className="serif-italic text-parchment-500 dark:text-parchment-400 text-lg">
              No topics pitched yet.
            </p>
          </div>
        )}
        <ul className="space-y-3">
          {sorted(leaderIdeas).map((idea) => (
            <IdeaRow key={idea.id} idea={idea} profile={profile} />
          ))}
        </ul>
      </section>

      {/* BROTHER SUGGESTIONS */}
      {memberIdeas.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-baseline justify-between">
            <div>
              <SectionLabel>From the brothers</SectionLabel>
              <h2 className="display mt-2 text-2xl">Suggestions</h2>
            </div>
            <span className="mono-cap text-parchment-500 dark:text-parchment-400">
              {memberIdeas.length} idea{memberIdeas.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="space-y-3">
            {sorted(memberIdeas).map((idea) => (
              <IdeaRow key={idea.id} idea={idea} profile={profile} />
            ))}
          </ul>
        </section>
      )}

      {items.length > 0 && (
        <div className="my-10">
          <CoalBedThin />
        </div>
      )}
    </Shell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mono-cap text-iron">{children}</div>;
}

function IdeaRow({ idea, profile }: { idea: ReturnType<typeof useIdeas>["items"][number]; profile: ReturnType<typeof useAuth>["profile"] }) {
  const voted = profile ? Boolean(idea.votes[profile.uid]) : false;
  const count = Object.keys(idea.votes).length;
  return (
    <li className="group flex items-start gap-4 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-4 hover:border-iron">
      <button
        onClick={() => profile && toggleVote(idea.id, profile.uid, !voted)}
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
          <span className="mono-cap text-parchment-500 dark:text-parchment-400 shrink-0">
            {timeAgo(idea.createdAt)}
          </span>
        </div>
        {idea.body && (
          <p className="mt-1 whitespace-pre-line text-sm text-parchment-700 dark:text-parchment-300">{idea.body}</p>
        )}
        <p className="mt-2 text-xs text-parchment-500 dark:text-parchment-400">
          pitched by <span className="text-iron">{idea.createdByName}</span>
        </p>
      </div>
    </li>
  );
}
