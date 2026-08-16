"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarPlus, MapPin } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { fmtDate, fmtDateShort, verseForWeek } from "@/lib/utils";
import { MEETING_LABELS, MEETING_SHORT } from "@/lib/types";
import { useIdeas, useMeetings, useMessages, useCurrentReads } from "@/lib/firestore";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mono-cap text-iron">{children}</div>;
}

export default function DashboardPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const { items: meetings } = useMeetings();
  const { items: ideas } = useIdeas();
  const { items: reads } = useCurrentReads();
  const { items: messages } = useMessages("members");

  const effectiveAdmin = isAdmin && viewMode === "leader";

  // Only show days that have been planned, sorted chronologically.
  const planned = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...meetings]
      .filter((m) => m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [meetings]);

  const next = planned[0];

  const topIdeas = useMemo(() => {
    return [...ideas]
      .sort((a, b) => Object.keys(b.votes).length - Object.keys(a.votes).length)
      .slice(0, 3);
  }, [ideas]);

  const myRead = useMemo(() => {
    if (!profile) return null;
    return reads.find((r) => r.uid === profile.uid) ?? null;
  }, [reads, profile]);

  const othersReading = useMemo(() => {
    if (!profile) return reads.slice(0, 3);
    return reads.filter((r) => r.uid !== profile.uid).slice(0, 3);
  }, [reads, profile]);

  const lastMessages = useMemo(() => {
    return [...messages].slice(-3).reverse();
  }, [messages]);

  const verse = verseForWeek();

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <SectionLabel>{effectiveAdmin ? "Welcome back" : "Hey brother"}</SectionLabel>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            {effectiveAdmin ? (
              <>
                Good to see you,{" "}
                <span className="serif-italic text-iron">{profile?.displayName?.split(" ")[0]}</span>.
              </>
            ) : (
              <>
                <span className="serif-italic text-iron">{profile?.displayName?.split(" ")[0]}</span>, the brothers are sharpening iron.
              </>
            )}
          </h1>
        </div>
        {isAdmin && (
          <span className="mono-cap hidden sm:inline-block rounded border border-iron/40 bg-ember/10 px-2 py-1 text-iron">
            {viewMode === "leader" ? "Leader" : "Member view"}
          </span>
        )}
      </div>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* NEXT GATHERING — always shown, the anchor */}
      <section className="mb-10">
        {next ? (
          <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="mono-cap text-iron">{MEETING_SHORT[next.kind]}</span>
                <span className="display text-xl sm:text-2xl">{MEETING_LABELS[next.kind]}</span>
              </div>
              <span className="text-sm text-parchment-500 dark:text-parchment-400">{fmtDate(next.date)}</span>
            </div>
            <h2 className="display mt-3 text-3xl sm:text-4xl leading-tight">{next.title}</h2>
            {next.reading && (
              <p className="mono-cap mt-3 text-iron">Reading · {next.reading}</p>
            )}
            {next.notes && (
              <p className="mt-4 whitespace-pre-line text-parchment-700 dark:text-parchment-300 max-w-2xl">
                {next.notes}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/plan"
                className="inline-flex items-center gap-1.5 rounded bg-iron px-4 py-2 text-sm font-medium text-ink hover:bg-iron-glow"
              >
                <MapPin size={14} />
                {effectiveAdmin ? "Manage plan" : "See full plan"}
              </Link>
              {!effectiveAdmin && (
                <Link
                  href="/plan"
                  className="inline-flex items-center gap-1.5 rounded border border-parchment-200 dark:border-parchment-700 px-4 py-2 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron"
                >
                  RSVP
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-8 text-center">
            <CalendarPlus size={28} className="mx-auto text-parchment-400 dark:text-parchment-500" />
            <p className="serif-italic mt-3 text-parchment-500 dark:text-parchment-400">
              {effectiveAdmin
                ? "No gathering planned yet. Pick a day and add a topic."
                : "The leaders haven't set a gathering yet. Check back soon."}
            </p>
            {effectiveAdmin && (
              <Link href="/plan" className="mt-4 inline-block text-sm text-iron hover:underline">
                Plan a gathering →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* UPCOMING (leaders get the full list, members just see the next one already shown) */}
      {effectiveAdmin && planned.length > 1 && (
        <section className="mb-12">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <SectionLabel>Upcoming</SectionLabel>
              <h2 className="display mt-2 text-2xl">{planned.length - 1} more ahead</h2>
            </div>
            <Link
              href="/plan"
              className="group inline-flex items-center gap-1 text-sm text-parchment-700 dark:text-parchment-300 hover:text-iron"
            >
              Open the week
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {planned.slice(1).map((m) => (
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
              </div>
            ))}
          </div>
        </section>
      )}

      {/* IDEAS (leaders only) + READING + CHAT (three columns on desktop) */}
      <div className="grid gap-8 lg:grid-cols-3">
        {effectiveAdmin && (
          <section>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <SectionLabel>Vote on what's next</SectionLabel>
                <h2 className="display mt-2 text-2xl">Ideas</h2>
              </div>
              <Link
                href="/ideas"
                className="group inline-flex items-center gap-1 text-sm text-parchment-700 dark:text-parchment-300 hover:text-iron"
              >
                All
                <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {topIdeas.length === 0 ? (
              <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-6 text-center">
                <p className="serif-italic text-parchment-500 dark:text-parchment-400">
                  Nothing pitched yet.
                </p>
                <Link href="/ideas" className="mt-3 inline-block text-sm text-iron hover:underline">
                  Pitch the first one →
                </Link>
              </div>
            ) : (
              <ol className="space-y-3">
                {topIdeas.map((idea) => (
                  <li
                    key={idea.id}
                    className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="display text-lg leading-snug">{idea.title}</h3>
                      <span className="mono-cap shrink-0 text-iron">
                        {Object.keys(idea.votes).length}
                      </span>
                    </div>
                    {idea.body && (
                      <p className="mt-1 text-sm text-parchment-700 dark:text-parchment-300 line-clamp-2">{idea.body}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <SectionLabel>What we're reading</SectionLabel>
              <h2 className="display mt-2 text-2xl">Tonight</h2>
            </div>
            <Link
              href="/readings"
              className="group inline-flex items-center gap-1 text-sm text-parchment-700 dark:text-parchment-300 hover:text-iron"
            >
              All
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {myRead ? (
            <div className="rounded border border-iron/40 bg-iron/5 p-5">
              <div className="flex items-baseline justify-between">
                <span className="mono-cap text-iron">You're reading</span>
              </div>
              <h3 className="display mt-2 text-xl leading-snug">{myRead.title}</h3>
              {myRead.author && (
                <p className="mt-1 text-sm text-parchment-500 dark:text-parchment-400">{myRead.author}</p>
              )}
              {myRead.note && (
                <p className="mt-3 text-sm text-parchment-700 dark:text-parchment-300 line-clamp-3">{myRead.note}</p>
              )}
              <Link href="/readings" className="mt-3 inline-block text-xs text-iron hover:underline">
                Update →
              </Link>
            </div>
          ) : reads.length === 0 ? (
            <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-6 text-center">
              <p className="serif-italic text-parchment-500 dark:text-parchment-400">
                Nobody's shared yet. Be the first.
              </p>
              <Link href="/readings" className="mt-3 inline-block text-sm text-iron hover:underline">
                Share what I'm reading →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {othersReading.map((r) => (
                <li
                  key={r.uid}
                  className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-4"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-parchment-900 dark:text-parchment-100">{r.displayName}</span>
                    <span className="mono-cap text-[10px] text-parchment-500 dark:text-parchment-400">is reading</span>
                  </div>
                  <h3 className="display mt-1 text-lg leading-snug">{r.title}</h3>
                  {r.author && (
                    <p className="mt-0.5 text-sm text-parchment-500 dark:text-parchment-400">{r.author}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <SectionLabel>From the room</SectionLabel>
              <h2 className="display mt-2 text-2xl">Chat</h2>
            </div>
            <Link
              href="/chat"
              className="group inline-flex items-center gap-1 text-sm text-parchment-700 dark:text-parchment-300 hover:text-iron"
            >
              Open
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-4">
            {lastMessages.length === 0 ? (
              <p className="serif-italic text-parchment-500 dark:text-parchment-400 text-center py-6">
                Quiet in here. Be the first to speak up.
              </p>
            ) : (
              <ul className="space-y-3">
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
