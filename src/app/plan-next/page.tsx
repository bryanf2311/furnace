"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { upsertMeeting, useMeetings } from "@/lib/firestore";
import { fmtDate, nextWeekday, startOfWeek, toDateKey } from "@/lib/utils";
import type { MeetingKind } from "@/lib/types";

export default function PlanNextEventPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const { items } = useMeetings();
  const router = useRouter();
  const effectiveAdmin = isAdmin && viewMode === "leader";

  const [kind, setKind] = useState<MeetingKind>("monday");
  const [date, setDate] = useState(() => {
    const monday = toDateKey(nextWeekday(startOfWeek(), 1));
    return monday;
  });
  const [title, setTitle] = useState("");
  const [reading, setReading] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!effectiveAdmin) {
    return (
      <Shell>
        <p className="mono-cap text-iron">Plan next event</p>
        <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
          Leaders only
        </h1>
        <p className="mt-3 text-parchment-700 dark:text-parchment-300">
          This page is for the leaders. You're seeing the app as a member right now.
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
      await upsertMeeting({
        date,
        kind,
        title: title.trim(),
        notes: notes.trim(),
        reading: reading.trim(),
        rsvps: {},
        createdBy: profile.uid,
      });
      router.push("/plan");
    } finally {
      setSaving(false);
    }
  }

  // Has this day already been planned?
  const existing = items.find((m) => m.date === date);

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <p className="mono-cap text-iron">Plan next event</p>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            Set up the next gathering
          </h1>
        </div>
        <button
          onClick={() => router.push("/plan")}
          className="inline-flex items-center gap-1 text-sm text-parchment-500 dark:text-parchment-400 hover:text-iron"
        >
          <ArrowLeft size={14} /> Back to the week
        </button>
      </div>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        Pick a day, write what you're going to walk through, and it's on the plan.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* LEFT: Day picker */}
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
                    <span className="mono-cap text-iron">{k.toUpperCase()}</span>
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

        {/* RIGHT: form */}
        <div className="lg:col-span-2">
          {existing && existing.id && (
            <div className="mb-5 rounded border border-ember/40 bg-ember/5 p-4 text-sm text-parchment-700 dark:text-parchment-200">
              <strong>Heads up:</strong> there's already a plan for {fmtDate(date)} ({existing.title}). Saving will overwrite it.
            </div>
          )}

          <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5 space-y-4">
            <Field
              label="Topic"
              value={title}
              onChange={setTitle}
              placeholder="e.g. Walking in the Spirit"
              big
            />
            <Field
              label="Reading"
              value={reading}
              onChange={setReading}
              placeholder="Galatians 5:16-26"
            />
            <TextAreaField
              label="Notes"
              value={notes}
              onChange={setNotes}
              placeholder="Discussion questions, prayer points, takeaways..."
              rows={5}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => router.push("/plan")}
                className="inline-flex items-center gap-1 rounded border border-parchment-200 dark:border-parchment-700 px-3 py-1.5 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={save}
                disabled={!title.trim() || saving}
                className="inline-flex items-center gap-1 rounded bg-iron px-4 py-1.5 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
              >
                <Save size={14} /> {saving ? "Saving..." : existing ? "Update plan" : "Add to plan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  big,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  big?: boolean;
}) {
  return (
    <label className="block">
      <span className="mono-cap text-parchment-500 dark:text-parchment-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          big
            ? "mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-lg display text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
            : "mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
        }
      />
    </label>
  );
}

function TextAreaField({
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
        className="mt-1 block w-full rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-300 placeholder:text-parchment-400 dark:placeholder:text-parchment-500"
      />
    </label>
  );
}
