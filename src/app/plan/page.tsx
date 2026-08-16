"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import {
  deleteMeeting,
  setRsvp,
  upsertMeeting,
  useMeetings,
} from "@/lib/firestore";
import {
  fmtDate,
  fmtDateShort,
  nextWeekday,
  startOfWeek,
  toDateKey,
} from "@/lib/utils";
import type { Meeting, MeetingKind, RsvpStatus } from "@/lib/types";
import { MEETING_LABELS, MEETING_SHORT } from "@/lib/types";

const EMPTY_DRAFT = (date: string, kind: MeetingKind): Omit<Meeting, "id" | "createdAt"> => ({
  date,
  kind,
  title: "",
  notes: "",
  reading: "",
  rsvps: {},
  createdBy: "",
});

export default function PlanPage() {
  const { profile, isAdmin } = useAuth();
  const { items: meetings, loading } = useMeetings();

  const weekStart = useMemo(() => startOfWeek(), []);
  const monday = useMemo(() => toDateKey(nextWeekday(weekStart, 1)), [weekStart]);
  const wednesday = useMemo(() => toDateKey(nextWeekday(weekStart, 3)), [weekStart]);
  const friday = useMemo(() => toDateKey(nextWeekday(weekStart, 5)), [weekStart]);
  const weekEnd = toDateKey(new Date(weekStart.getTime() + 6 * 86400000));

  const inThisWeek = meetings.filter((m) => m.date >= monday && m.date <= weekEnd);

  const lookup = (kind: MeetingKind, date: string) =>
    inThisWeek.find((m) => m.kind === kind && m.date === date);

  const [editing, setEditing] = useState<Meeting | null>(null);
  const [draft, setDraft] = useState<Omit<Meeting, "id" | "createdAt"> | null>(null);

  function startNew(kind: MeetingKind, date: string) {
    if (!profile) return;
    setEditing({ id: "", ...EMPTY_DRAFT(date, kind), createdBy: profile.uid, createdAt: 0 });
    setDraft({ ...EMPTY_DRAFT(date, kind), createdBy: profile.uid });
  }

  function startEdit(m: Meeting) {
    setEditing(m);
    setDraft({
      date: m.date,
      kind: m.kind,
      title: m.title,
      notes: m.notes,
      reading: m.reading ?? "",
      rsvps: m.rsvps ?? {},
      createdBy: m.createdBy,
    });
  }

  function close() {
    setEditing(null);
    setDraft(null);
  }

  async function save() {
    if (!draft) return;
    const id = editing?.id || undefined;
    await upsertMeeting({ ...draft, id });
    close();
  }

  async function remove(id: string) {
    if (!confirm("Delete this plan?")) return;
    await deleteMeeting(id);
    close();
  }

  const slots: Array<{ kind: MeetingKind; date: string }> = [
    { kind: "monday", date: monday },
    { kind: "wednesday", date: wednesday },
    { kind: "friday", date: friday },
  ];

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <p className="mono-cap text-iron">This week</p>
          <h1 className="display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            {fmtDateShort(monday)} – {fmtDateShort(weekEnd)}
          </h1>
        </div>
        {!isAdmin && (
          <span className="mono-cap text-parchment-500 dark:text-parchment-400">Read-only</span>
        )}
      </div>
      <p className="mt-3 text-parchment-700 dark:text-parchment-300">
        {isAdmin
          ? "Set the topics, readings, and notes for each gathering this week."
          : "Here's what the leaders have planned. RSVP so they know who's coming."}
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {slots.map((s) => {
          const m = lookup(s.kind, s.date);
          const isEditing = editing && editing.date === s.date && editing.kind === s.kind;
          return (
            <article
              key={`${s.kind}-${s.date}`}
              className="relative overflow-hidden rounded border border-parchment-200 dark:border-parchment-700 bg-white/80 dark:bg-parchment-900/60"
            >
              <div className="flex items-baseline justify-between border-b border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900 px-5 py-3">
                <div>
                  <div className="mono-cap text-iron">{MEETING_SHORT[s.kind]}</div>
                  <h2 className="display mt-0.5 text-lg">{MEETING_LABELS[s.kind]}</h2>
                </div>
                <span className="text-xs text-parchment-500 dark:text-parchment-400">{fmtDate(s.date)}</span>
              </div>

              {!isEditing && (
                <div className="p-5">
                  {loading && <p className="text-sm text-parchment-500 dark:text-parchment-400">Loading...</p>}
                  {!loading && !m && (
                    <div className="py-6 text-center">
                      <p className="serif-italic text-parchment-500 dark:text-parchment-400">No plan yet.</p>
                      {isAdmin && (
                        <button
                          onClick={() => startNew(s.kind, s.date)}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm text-iron hover:underline"
                        >
                          <Plus size={14} /> Plan this gathering
                        </button>
                      )}
                    </div>
                  )}
                  {!loading && m && (
                    <div>
                      <h3 className="display text-xl">{m.title}</h3>
                      {m.reading && (
                        <p className="mono-cap mt-2 text-iron">
                          Reading · {m.reading}
                        </p>
                      )}
                      {m.notes && (
                        <p className="mt-3 whitespace-pre-line text-parchment-700 dark:text-parchment-300">{m.notes}</p>
                      )}

                      <div className="my-4 coal-bed-thin" />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <RsvpRow meeting={m} />
                        {isAdmin && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(m)}
                              className="text-xs text-parchment-700 dark:text-parchment-300 hover:text-iron"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isEditing && draft && (
                <div className="p-5 space-y-3">
                  <Field
                    label="Topic"
                    value={draft.title}
                    onChange={(v) => setDraft({ ...draft, title: v })}
                    placeholder="e.g. Walking in the Spirit"
                  />
                  <Field
                    label="Reading"
                    value={draft.reading ?? ""}
                    onChange={(v) => setDraft({ ...draft, reading: v })}
                    placeholder="Galatians 5:16-26"
                  />
                  <TextArea
                    label="Notes"
                    value={draft.notes}
                    onChange={(v) => setDraft({ ...draft, notes: v })}
                    placeholder="Discussion questions, prayer points, takeaways..."
                    rows={5}
                  />
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      onClick={close}
                      className="inline-flex items-center gap-1 rounded border border-parchment-200 dark:border-parchment-700 px-3 py-1.5 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron hover:text-parchment-900 dark:text-parchment-100"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <div className="flex gap-2">
                      {editing?.id && (
                        <button
                          onClick={() => remove(editing.id)}
                          className="inline-flex items-center gap-1 rounded border border-ember/40 bg-ember/10 px-3 py-1.5 text-sm text-ember hover:bg-ember/20"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                      <button
                        onClick={save}
                        disabled={!draft.title.trim()}
                        className="inline-flex items-center gap-1 rounded bg-iron px-3 py-1.5 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
                      >
                        <Save size={14} /> Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Shell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mono-cap text-parchment-500 dark:text-parchment-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:text-parchment-500"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mono-cap text-parchment-500 dark:text-parchment-400">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:text-parchment-500"
      />
    </label>
  );
}

function RsvpRow({ meeting }: { meeting: Meeting }) {
  const { profile } = useAuth();
  if (!profile) return null;
  const current: RsvpStatus = meeting.rsvps?.[profile.uid] ?? "maybe";
  const tally: Record<RsvpStatus, number> = { yes: 0, no: 0, maybe: 0 };
  Object.values(meeting.rsvps ?? {}).forEach((v) => (tally[v] = (tally[v] ?? 0) + 1));

  const opts: Array<{ v: RsvpStatus; label: string; color: string }> = [
    { v: "yes", label: "In", color: "ember" },
    { v: "maybe", label: "Maybe", color: "iron" },
    { v: "no", label: "Out", color: "muted" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => setRsvp(meeting.id, profile.uid, o.v)}
          className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
            current === o.v
              ? o.color === "ember"
                ? "border-ember/60 bg-ember/15 text-ember"
                : o.color === "iron"
                  ? "border-iron/60 bg-iron/15 text-iron"
                  : "border-parchment-400 bg-parchment-200 dark:bg-parchment-700/40 text-parchment-900 dark:text-parchment-100"
              : "border-parchment-200 dark:border-parchment-700 text-parchment-500 dark:text-parchment-400 hover:text-parchment-900 dark:hover:text-parchment-100 hover:border-parchment-400"
          }`}
        >
          {o.label} <span className="opacity-60">({tally[o.v]})</span>
        </button>
      ))}
    </div>
  );
}
