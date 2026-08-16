"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { upsertMeeting, useMeetings } from "@/lib/firestore";
import { fmtDate, fmtDateShort, nextWeekday, startOfWeek, toDateKey } from "@/lib/utils";
import type { MeetingKind } from "@/lib/types";
import { MEETING_SHORT } from "@/lib/types";

export default function EventsPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const { items } = useMeetings();
  const router = useRouter();
  const effectiveAdmin = isAdmin && viewMode === "leader";

  const [kind, setKind] = useState<MeetingKind>("monday");
  const [date, setDate] = useState(() => toDateKey(nextWeekday(startOfWeek(), 1)));
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  if (!effectiveAdmin) {
    return (
      <Shell>
        <p className="mono-cap text-iron">Events</p>
        <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
          Leaders only
        </h1>
        <p className="mt-3 text-parchment-700 dark:text-parchment-300">
          This page is for the leaders to plan events. You're seeing the app as a member.
        </p>
      </Shell>
    );
  }

  const next = {
    monday: nextWeekday(startOfWeek(), 1),
    wednesday: nextWeekday(startOfWeek(), 3),
    friday: nextWeekday(startOfWeek(), 5),
  };

  function pickKind(k: MeetingKind) {
    setKind(k);
    setDate(toDateKey(next[k]));
  }

  async function save() {
    if (!profile || !title.trim() || saving) return;
    setSaving(true);
    try {
      const id = await upsertMeeting({
        date,
        kind,
        title: title.trim(),
        notes: "",
        reading: "",
        rsvps: {},
        createdBy: profile.uid,
      });
      router.push(`/events/${id}`);
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = items
    .filter((m) => m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = items
    .filter((m) => m.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <p className="mono-cap text-iron">Events</p>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            Plan the next gathering
          </h1>
        </div>
        <button
          onClick={() => router.push("/calendar")}
          className="inline-flex items-center gap-1 text-sm text-parchment-500 dark:text-parchment-400 hover:text-iron"
        >
          <ArrowLeft size={14} /> Calendar
        </button>
      </div>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        Pick a day, give it a topic, and the event opens up so you can add readings and notes.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <aside className="lg:col-span-1">
          <h2 className="display text-xl mb-3">Pick a day</h2>
          <div className="space-y-2">
            {(["monday", "wednesday", "friday"] as const).map((k) => {
              const d = toDateKey(next[k]);
              const taken = items.find((m) => m.date === d && m.kind === k);
              return (
                <button
                  key={k}
                  onClick={() => pickKind(k)}
                  className={
                    kind === k
                      ? "block w-full rounded border border-iron bg-iron/5 p-3 text-left"
                      : "block w-full rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-3 text-left hover:border-iron"
                  }
                >
                  <div className="flex items-baseline justify-between">
                    <span className="mono-cap text-iron">{MEETING_SHORT[k]}</span>
                    {taken && (
                      <span className="mono-cap text-[10px] text-parchment-500 dark:text-parchment-400">planned</span>
                    )}
                  </div>
                  <div className="display mt-1 text-lg">{fmtDate(d)}</div>
                  {taken && (
                    <p className="mt-1 text-xs text-parchment-700 dark:text-parchment-300 truncate">
                      {taken.title}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-6">
            <label className="block">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Or pick a different date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100"
              />
            </label>
          </div>
        </aside>

        <div className="lg:col-span-2">
          <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5">
            <label className="block">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Topic</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Walking in the Spirit"
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-lg display text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              />
            </label>
            <p className="mt-2 text-xs text-parchment-500 dark:text-parchment-400">
              You can add readings, notes, and RSVPs on the next screen.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => router.push("/calendar")}
                className="inline-flex items-center gap-1 rounded border border-parchment-200 dark:border-parchment-700 px-3 py-1.5 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={save}
                disabled={!title.trim() || saving}
                className="inline-flex items-center gap-1 rounded bg-iron px-4 py-1.5 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
              >
                <Save size={14} /> {saving ? "Creating..." : "Create event"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing events list */}
      {upcoming.length > 0 && (
        <>
          <div className="my-12">
            <CoalBedThin />
          </div>
          <section>
            <h2 className="display text-2xl mb-4">Upcoming</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {upcoming.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/events/${m.id}`}
                    className="block rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5 hover:border-iron"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="mono-cap text-iron">{MEETING_SHORT[m.kind]}</span>
                      <span className="text-xs text-parchment-500 dark:text-parchment-400">{fmtDateShort(m.date)}</span>
                    </div>
                    <h3 className="display mt-1 text-lg leading-snug">{m.title}</h3>
                    {m.reading && (
                      <p className="mono-cap mt-2 text-[10px] text-parchment-500 dark:text-parchment-400 truncate">
                        {m.reading}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {past.length > 0 && (
        <section className="mt-12">
          <h2 className="display text-2xl mb-4">Past</h2>
          <ul className="space-y-2">
            {past.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/events/${m.id}`}
                  className="flex items-baseline justify-between gap-3 rounded border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-900/40 px-4 py-3 hover:border-iron opacity-80"
                >
                  <div className="min-w-0">
                    <span className="mono-cap mr-2 text-parchment-500 dark:text-parchment-400">
                      {MEETING_SHORT[m.kind]}
                    </span>
                    <span className="text-parchment-900 dark:text-parchment-100">{m.title}</span>
                  </div>
                  <span className="text-xs text-parchment-500 dark:text-parchment-400 shrink-0">{fmtDateShort(m.date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}
