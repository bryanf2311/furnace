"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import {
  fmtDate,
  nextWeekday,
  startOfWeek,
  toDateKey,
  verseForWeek,
} from "@/lib/utils";
import { MEETING_LABELS, MEETING_SHORT } from "@/lib/types";
import { useIdeas, useMeetings, useMessages } from "@/lib/firestore";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mono-cap text-iron">{children}</div>;
}

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth();
  const { items: meetings } = useMeetings();
  const { items: ideas } = useIdeas();
  const { items: messages } = useMessages();

  const weekStart = useMemo(() => startOfWeek(), []);
  const monday = useMemo(() => toDateKey(nextWeekday(weekStart, 1)), [weekStart]);
  const wednesday = useMemo(() => toDateKey(nextWeekday(weekStart, 3)), [weekStart]);

  const topIdeas = useMemo(() => {
    return [...ideas]
      .sort((a, b) => Object.keys(b.votes).length - Object.keys(a.votes).length)
      .slice(0, 3);
  }, [ideas]);

  const lastMessages = useMemo(() => {
    return [...messages].slice(-3).reverse();
  }, [messages]);

  const verse = verseForWeek();

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <SectionLabel>Welcome back</SectionLabel>
          <h1 className="display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Good to see you, <span className="serif-italic text-iron">{profile?.displayName?.split(" ")[0]}</span>.
          </h1>
        </div>
        {isAdmin && (
          <span className="mono-cap hidden sm:inline-block rounded border border-iron/40 bg-ember/10 px-2 py-1 text-iron">
            Leader
          </span>
        )}
      </div>

      <p className="mt-3 max-w-2xl text-forge-300">
        The forge is hot. Here's what the brothers are sharpening this week.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* THIS WEEK */}
      <section className="mb-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <SectionLabel>This week</SectionLabel>
            <h2 className="display mt-2 text-2xl">Three gatherings ahead</h2>
          </div>
          <Link
            href="/plan"
            className="group inline-flex items-center gap-1 text-sm text-forge-300 hover:text-iron"
          >
            Open the week
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { kind: "monday" as const, date: monday },
            { kind: "wednesday" as const, date: wednesday },
            { kind: "friday" as const, date: toDateKey(new Date(weekStart.getTime() + 4 * 86400000)) },
          ].map((m) => {
            const filled = meetings.find((x) => x.date === m.date);
            return (
              <div
                key={m.kind}
                className="group relative overflow-hidden rounded border border-forge-800 bg-forge-900/70 p-5 transition-colors hover:border-iron"
              >
                <div className="mono-cap text-forge-400">{MEETING_SHORT[m.kind]}</div>
                <div className="display mt-1 text-xl">{MEETING_LABELS[m.kind]}</div>
                <div className="mt-1 text-sm text-forge-300">{fmtDate(m.date)}</div>
                <div className="my-4 coal-bed-thin" />
                <p className="text-sm text-parchment">
                  {filled ? (
                    <>
                      <span className="block font-medium">{filled.title}</span>
                      {filled.reading && (
                        <span className="mt-1 block text-xs text-forge-400">
                          Reading · {filled.reading}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="serif-italic text-forge-400">No plan yet.</span>
                  )}
                </p>
                <Link
                  href="/plan"
                  className="mt-4 inline-flex items-center gap-1 text-xs text-iron opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {isAdmin ? "Plan it" : "View plan"}
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* IDEAS + CHAT summary */}
      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <SectionLabel>What's stirring</SectionLabel>
              <h2 className="display mt-2 text-2xl">Top ideas</h2>
            </div>
            <Link
              href="/ideas"
              className="group inline-flex items-center gap-1 text-sm text-forge-300 hover:text-iron"
            >
              All ideas
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {topIdeas.length === 0 ? (
            <div className="rounded border border-dashed border-forge-700 p-6 text-center">
              <p className="serif-italic text-forge-400">
                No ideas yet. The first spark starts with you.
              </p>
              <Link href="/ideas" className="mt-3 inline-block text-sm text-iron hover:underline">
                Pitch the first one →
              </Link>
            </div>
          ) : (
            <ol className="space-y-3">
              {topIdeas.map((idea, i) => (
                <li
                  key={idea.id}
                  className="group flex items-start gap-4 rounded border border-forge-800 bg-forge-900/40 p-4 hover:border-iron"
                >
                  <span className="display text-3xl font-semibold text-forge-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="display text-lg">{idea.title}</h3>
                      <span className="mono-cap text-iron">
                        {Object.keys(idea.votes).length} vote{Object.keys(idea.votes).length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-forge-300 line-clamp-2">{idea.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="lg:col-span-2">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <SectionLabel>Latest from the room</SectionLabel>
              <h2 className="display mt-2 text-2xl">Chat</h2>
            </div>
            <Link
              href="/chat"
              className="group inline-flex items-center gap-1 text-sm text-forge-300 hover:text-iron"
            >
              Open chat
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="rounded border border-forge-800 bg-forge-900/40 p-4">
            {lastMessages.length === 0 ? (
              <p className="serif-italic text-forge-400 text-center py-6">
                Quiet in here. Be the first to speak up.
              </p>
            ) : (
              <ul className="space-y-4">
                {lastMessages.map((m) => (
                  <li key={m.id} className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forge-700 text-xs">
                      {m.authorName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-parchment">{m.authorName}</span>
                      </div>
                      <p className="text-sm text-forge-300 line-clamp-2">{m.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="my-12">
        <CoalBedThin />
      </div>

      {/* VERSE */}
      <section className="text-center">
        <p className="mono-cap text-iron">{verse.ref}</p>
        <blockquote className="display mx-auto mt-3 max-w-2xl text-2xl serif-italic text-parchment sm:text-3xl">
          "{verse.text}"
        </blockquote>
      </section>
    </Shell>
  );
}
