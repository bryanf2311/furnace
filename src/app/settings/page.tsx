"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CalendarPlus, MessageSquare, ThumbsUp, Vote, BookOpen } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { setNotifPrefs } from "@/lib/firestore";
import { DEFAULT_NOTIF_PREFS, type NotifCategory, type NotifPrefs } from "@/lib/types";
import { classNames } from "@/lib/utils";

const CATEGORIES: Array<{
  key: NotifCategory;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { key: "events", label: "Events", description: "When a leader plans a new gathering.", icon: CalendarPlus },
  { key: "ideas", label: "Ideas", description: "When a leader pitches a topic.", icon: ThumbsUp },
  { key: "polls", label: "Polls", description: "When a leader posts a new poll.", icon: Vote },
  { key: "messages", label: "Messages", description: "When someone posts in the chat rooms.", icon: MessageSquare },
  { key: "readings", label: "Readings", description: "When brothers share what they're reading or leaders add recommendations.", icon: BookOpen },
];

export default function SettingsPage() {
  const { profile } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (profile?.notifPrefs) {
      setPrefs({ ...DEFAULT_NOTIF_PREFS, ...profile.notifPrefs });
    }
  }, [profile?.uid, profile?.notifPrefs]);

  function toggle(key: NotifCategory) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setDirty(true);
      return next;
    });
  }

  async function save() {
    if (!profile || !dirty || saving) return;
    setSaving(true);
    try {
      await setNotifPrefs(profile.uid, prefs);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <p className="mono-cap text-iron">Settings</p>
          <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            Your notifications
          </h1>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-parchment-500 dark:text-parchment-400 hover:text-iron"
        >
          <ArrowLeft size={14} /> Back
        </Link>
      </div>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        Pick which kinds of activity show up in your bell. You'll never get a notification for something you posted yourself.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      <ul className="space-y-3">
        {CATEGORIES.map(({ key, label, description, icon: Icon }) => (
          <li
            key={key}
            className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-4 sm:p-5"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-iron/15 text-iron">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="display text-lg">{label}</h2>
                  <Toggle on={prefs[key]} onChange={() => toggle(key)} />
                </div>
                <p className="mt-1 text-sm text-parchment-700 dark:text-parchment-300">{description}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-end gap-3">
        {dirty && (
          <span className="mono-cap text-[10px] text-ember">unsaved changes</span>
        )}
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 rounded bg-iron px-4 py-2 text-sm font-medium text-ink hover:bg-iron-glow disabled:opacity-40"
        >
          <Bell size={14} /> {saving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </Shell>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className={classNames(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
        on
          ? "border-iron bg-iron"
          : "border-parchment-300 dark:border-parchment-700 bg-parchment-200 dark:bg-parchment-800"
      )}
    >
      <span
        className={classNames(
          "absolute top-0.5 h-4 w-4 rounded-full transition-all",
          on ? "left-[22px] bg-ink" : "left-0.5 bg-parchment-50 dark:bg-parchment-400"
        )}
      />
    </button>
  );
}
