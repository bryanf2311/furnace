"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { ArrowLeft, Calendar, MapPin, Save, Trash2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { db, isConfigured } from "@/lib/firebase";
import {
  deleteMeeting,
  setRsvp,
  upsertMeeting,
} from "@/lib/firestore";
import { fmtDate, timeAgo } from "@/lib/utils";
import type { Meeting, MeetingKind, RsvpStatus } from "@/lib/types";
import { MEETING_LABELS, MEETING_SHORT } from "@/lib/types";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile, isAdmin, viewMode } = useAuth();
  const router = useRouter();
  const effectiveAdmin = isAdmin && viewMode === "leader";
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    params.then(({ id }) => {
      if (!isConfigured || !db) {
        setLoading(false);
        return;
      }
      unsub = onSnapshot(
        doc(db, "meetings", id),
        (snap) => {
          if (!snap.exists()) {
            setNotFound(true);
          } else {
            const data = snap.data() as Record<string, unknown> | undefined;
            if (!data) {
              setNotFound(true);
            } else {
              setMeeting({
                id: snap.id,
                date: (data.date as string) ?? "",
                kind: (data.kind as MeetingKind) ?? "monday",
                title: (data.title as string) ?? "",
                notes: (data.notes as string) ?? "",
                reading: (data.reading as string) ?? "",
                rsvps: (data.rsvps as Record<string, RsvpStatus>) ?? {},
                createdBy: (data.createdBy as string) ?? "",
                createdAt: coerceTs(data.createdAt),
              });
            }
          }
          setLoading(false);
        },
        () => {
          setNotFound(true);
          setLoading(false);
        }
      );
    });
    return () => unsub?.();
  }, [params]);

  const [title, setTitle] = useState("");
  const [reading, setReading] = useState("");
  const [notes, setNotes] = useState("");
  const [kind, setKind] = useState<MeetingKind>("monday");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync local edit state when the meeting loads/changes.
  useEffect(() => {
    if (!meeting) return;
    setTitle(meeting.title);
    setReading(meeting.reading ?? "");
    setNotes(meeting.notes);
    setKind(meeting.kind);
    setDate(meeting.date);
  }, [meeting]);

  if (loading) {
    return (
      <Shell>
        <p className="display text-center py-12 text-parchment-500 dark:text-parchment-400 serif-italic">Loading...</p>
      </Shell>
    );
  }

  if (notFound || !meeting) {
    return (
      <Shell>
        <p className="mono-cap text-iron">Event</p>
        <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
          We couldn't find that one
        </h1>
        <p className="mt-3 text-parchment-700 dark:text-parchment-300">
          It may have been deleted, or the link is wrong.
        </p>
        <button
          onClick={() => router.push("/calendar")}
          className="mt-6 inline-flex items-center gap-1 rounded border border-parchment-200 dark:border-parchment-700 px-4 py-2 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron"
        >
          Back to the calendar
        </button>
      </Shell>
    );
  }

  const dirty =
    title !== meeting.title ||
    reading !== (meeting.reading ?? "") ||
    notes !== meeting.notes ||
    kind !== meeting.kind ||
    date !== meeting.date;

  async function save() {
    if (!profile || !title.trim() || saving) return;
    setSaving(true);
    try {
      await upsertMeeting({
        id: meeting!.id,
        date,
        kind,
        title: title.trim(),
        notes,
        reading,
        rsvps: meeting!.rsvps ?? {},
        createdBy: profile.uid,
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this event?")) return;
    await deleteMeeting(meeting!.id);
    router.push("/calendar");
  }

  async function setMyRsvp(s: RsvpStatus) {
    if (!profile) return;
    await setRsvp(meeting!.id, profile.uid, s);
  }

  const tally: Record<RsvpStatus, number> = { yes: 0, no: 0, maybe: 0 };
  Object.values(meeting.rsvps ?? {}).forEach((v) => (tally[v] = (tally[v] ?? 0) + 1));
  const myRsvp: RsvpStatus = profile ? (meeting.rsvps?.[profile.uid] ?? "maybe") : "maybe";

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <p className="mono-cap text-iron">{MEETING_SHORT[meeting.kind]} · {fmtDate(meeting.date)}</p>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            {meeting.title}
          </h1>
        </div>
        <button
          onClick={() => router.push("/calendar")}
          className="inline-flex items-center gap-1 text-sm text-parchment-500 dark:text-parchment-400 hover:text-iron"
        >
          <ArrowLeft size={14} /> Calendar
        </button>
      </div>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* EDITOR (leaders) */}
      {effectiveAdmin && (
        <section className="mb-8 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5">
          <h2 className="display text-xl mb-4">Event details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100"
              />
            </label>
            <label className="block">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Kind</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as MeetingKind)}
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100"
              >
                {(["monday", "wednesday", "friday"] as const).map((k) => (
                  <option key={k} value={k}>{MEETING_LABELS[k]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Reading</span>
              <input
                type="text"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="Galatians 5:16-26"
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Discussion questions, prayer points, takeaways..."
                rows={6}
                className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-300 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
              />
            </label>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={remove}
              className="inline-flex items-center gap-1 text-sm text-ember hover:underline"
            >
              <Trash2 size={14} /> Delete event
            </button>
            <button
              onClick={save}
              disabled={!dirty || !title.trim() || saving}
              className="inline-flex items-center gap-1 rounded bg-iron px-4 py-1.5 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
            >
              <Save size={14} /> {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </section>
      )}

      {/* PUBLIC VIEW */}
      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {meeting.reading && (
            <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5">
              <p className="mono-cap text-iron">Reading</p>
              <p className="display mt-1 text-lg">{meeting.reading}</p>
            </div>
          )}
          {meeting.notes && (
            <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5">
              <p className="mono-cap text-iron">Notes</p>
              <p className="mt-2 whitespace-pre-line text-parchment-700 dark:text-parchment-300">
                {meeting.notes}
              </p>
            </div>
          )}
          {!meeting.reading && !meeting.notes && (
            <div className="rounded border border-dashed border-parchment-300 dark:border-parchment-700 p-8 text-center">
              <p className="serif-italic text-parchment-500 dark:text-parchment-400">
                No details yet.
                {effectiveAdmin && " Add a reading or notes above."}
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-iron" />
              <span className="mono-cap text-iron">When</span>
            </div>
            <p className="display mt-2 text-lg leading-snug">{MEETING_LABELS[meeting.kind]}</p>
            <p className="text-sm text-parchment-700 dark:text-parchment-300">{fmtDate(meeting.date)}</p>
          </div>

          <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-iron" />
              <span className="mono-cap text-iron">Who's coming</span>
            </div>
            {profile ? (
              <>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(["yes", "maybe", "no"] as const).map((s) => {
                    const labels: Record<RsvpStatus, string> = { yes: "In", maybe: "Maybe", no: "Out" };
                    const active = myRsvp === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setMyRsvp(s)}
                        className={
                          active
                            ? s === "yes"
                              ? "rounded-sm border border-ember/40 bg-ember/15 px-3 py-1.5 text-xs text-ember"
                              : s === "maybe"
                                ? "rounded-sm border border-iron/40 bg-iron/15 px-3 py-1.5 text-xs text-iron"
                                : "rounded-sm border border-parchment-400 bg-parchment-200 dark:bg-parchment-700/40 px-3 py-1.5 text-xs text-parchment-900 dark:text-parchment-100"
                            : "rounded-sm border border-parchment-200 dark:border-parchment-700 px-3 py-1.5 text-xs text-parchment-700 dark:text-parchment-300 hover:border-iron"
                        }
                      >
                        {labels[s]} <span className="opacity-60">({tally[s]})</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mono-cap mt-3 text-[10px] text-parchment-500 dark:text-parchment-400">
                  {tally.yes} in · {tally.maybe} maybe · {tally.no} out
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-parchment-500 dark:text-parchment-400">
                Sign in to RSVP.
              </p>
            )}
          </div>

          <p className="mono-cap text-[10px] text-parchment-500 dark:text-parchment-400">
            Created {timeAgo(meeting.createdAt)}
          </p>
        </aside>
      </section>
    </Shell>
  );
}

function coerceTs(v: unknown): number {
  if (v && typeof v === "object" && "toMillis" in (v as Record<string, unknown>)) {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (typeof v === "number") return v;
  return Date.now();
}
