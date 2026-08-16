"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarPlus } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { fmtDate, fmtDateShort, verseForWeek } from "@/lib/utils";
import { MEETING_LABELS, MEETING_SHORT } from "@/lib/types";
import { useIdeas, useMeetings, useMessages } from "@/lib/firestore";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mono-cap text-iron">{children}</div>;
}

export default function DashboardPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const { items: meetings } = useMeetings();
  const { items: ideas } = useIdeas();
  const { items: messages } = useMessages("members");

  // Only show days that have been planned. Sort chronologically.
  const planned = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...meetings]
      .filter((m) => m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [meetings]);

  const topIdeas = useMemo(() => {
    return [...ideas]
      .sort((a, b) => Object.keys(b.votes).length - Object.keys(a.votes).length)
      .slice(0, 3);
  }, [ideas]);

  const lastMessages = useMemo(() => {
    return [...messages].slice(-3).reverse();
  }, [messages]);

  const verse = verseForWeek();
  const effectiveAdmin = isAdmin && viewMode === "leader";

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <SectionLabel>Welcome back</SectionLabel>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            Good to see you,{" "}
            <span className="serif-italic text-iron">{profile?.displayName?.split(" ")[0]}</span>.
          </h1>
        </div>
        {isAdmin && (
          <span className="mono-cap hidden sm:inline-block rounded border border-iron/40 bg-ember/10 px-2 py-1 text-iron">
            {viewMode === "leader" ? "Leader" : "Member view"}
          </span>
        )}
      </div>

      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        {planned.length > 0
          ? "Here's what's planned and what's stirring."
          : "Nothing on the calendar yet. The leaders will set the first gathering soon."}
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* PLANNED DAYS */}
      <section className="mb-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <SectionLabel>Upcoming</SectionLabel>
            <h2 className="display mt-2 text-2xl">
              {planned.length === 0
                ? "No gatherings planned"
                : planned.length === 1
                  ? "Next gathering"
                  : `${planned.length} gatherings ahead`}
            </h2>
          </div>
          <Link
            href="/plan"
            className="group inline-flex items-center gap-1 text-sm text-parchment-700 dark:text-parchment-300 hover:text-iron"
          >
            Open the week
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {planned.length === 0 ? (
          <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-8 text-center">
            <CalendarPlus size={28} className="mx-auto text-parchment-400 dark:text-parchment-500" />
            <p className="serif-italic mt-3 text-parchment-500 dark:text-parchment-400">
              {effectiveAdmin
                ? "Pick a Monday, Wednesday, or Friday and add a topic."
                : "The leaders haven't set a gathering yet. Check back soon."}
            </p>
            {effectiveAdmin && (
              <Link href="/plan" className="mt-4 inline-block text-sm text-iron hover:underline">
                Plan a gathering →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {planned.map((m) => (
              <div
                key={m.id}
                className="group relative overflow-hidden rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5 transition-colors hover:border-iron"
              >
                <div className="flex items-baseline justify-between">
                  <div className="mono-cap text-iron">{MEETING_SHORT[m.kind]}</div>
                  <span className="text-xs text-parchment-500 dark:text-parchment-400">{fmtDateShort(m.date)}</span>
                </div>
                <div className="display mt-1 text-xl">{MEETING_LABELS[m.kind]}</div>
                <div className="mt-1 text-sm text-parchment-700 dark:text-parchment-300">{fmtDate(m.date)}</div>
                <div className="my-4 coal-bed-thin" />
                <h3 className="display text-lg leading-snug">{m.title}</h3>
                {m.reading && (
                  <p className="mono-cap mt-2 text-parchment-500 dark:text-parchment-400">
                    Reading · {m.reading}
                  </p>
                )}
                {m.notes && (
                  <p className="mt-3 whitespace-pre-line text-sm text-parchment-700 dark:text-parchment-300 line-clamp-4">
                    {m.notes}
                  </p>
                )}
                <Link
                  href="/plan"
                  className="mt-4 inline-flex items-center gap-1 text-xs text-iron opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {effectiveAdmin ? "Edit plan" : "Full plan"}
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        )}
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
              className="group inline-flex items-center gap-1 text-sm text-parchment-700 dark:text-parchment-300 hover:text-iron"
            >
              All ideas
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {topIdeas.length === 0 ? (
            <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-6 text-center">
              <p className="serif-italic text-parchment-500 dark:text-parchment-400">
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
                  className="group flex items-start gap-4 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-4 hover:border-iron"
                >
                  <span className="display text-3xl font-semibold text-parchment-400 dark:text-parchment-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="display text-lg">{idea.title}</h3>
                      <span className="mono-cap text-iron">
                        {Object.keys(idea.votes).length} vote{Object.keys(idea.votes).length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-parchment-700 dark:text-parchment-300 line-clamp-2">{idea.body}</p>
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
              className="group inline-flex items-center gap-1 text-sm text-parchment-700 dark:text-parchment-300 hover:text-iron"
            >
              Open chat
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-4">
            {lastMessages.length === 0 ? (
              <p className="serif-italic text-parchment-500 dark:text-parchment-400 text-center py-6">
                Quiet in here. Be the first to speak up.
              </p>
            ) : (
              <ul className="space-y-4">
                {lastMessages.map((m) => (
                  <li key={m.id} className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-parchment-200 dark:bg-parchment-700 text-xs">
                      {m.authorName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-parchment-900 dark:text-parchment-100">{m.authorName}</span>
                      </div>
                      <p className="text-sm text-parchment-700 dark:text-parchment-300 line-clamp-2">{m.body}</p>
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
        <blockquote className="display mx-auto mt-3 max-w-2xl text-2xl serif-italic text-parchment-900 dark:text-parchment-100 sm:text-3xl">
          "{verse.text}"
        </blockquote>
      </section>
    </Shell>
  );
}
