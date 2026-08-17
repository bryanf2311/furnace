"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, Sparkles, ThumbsUp, Vote, X, BookOpen, CalendarPlus } from "lucide-react";
import { ACTIVITY_CATEGORY, type Activity } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { markActivitySeen, useActivity } from "@/lib/firestore";
import { timeAgo, classNames } from "@/lib/utils";

export function NotificationBell() {
  const { profile } = useAuth();
  const router = useRouter();
  const { items, loading } = useActivity(30);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const prefs = profile?.notifPrefs ?? {
    events: true,
    ideas: true,
    polls: true,
    messages: true,
    readings: true,
  };

  // Filter items by prefs; drop the user's own activity.
  const visible = items.filter((it) => {
    if (it.actorUid === profile?.uid) return false;
    const cat = ACTIVITY_CATEGORY[it.kind];
    return prefs[cat];
  });

  const lastSeen = profile?.lastSeenActivityAt ?? 0;
  const unreadCount = visible.filter((it) => it.createdAt > lastSeen).length;

  // Mark all seen when the user opens the panel.
  useEffect(() => {
    if (!open || !profile) return;
    if (unreadCount > 0) {
      void markActivitySeen(profile.uid);
    }
  }, [open, profile, unreadCount]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openItem(a: Activity) {
    setOpen(false);
    switch (a.refType) {
      case "event":
        router.push(`/events/${a.refId}`);
        break;
      case "idea":
      case "poll":
        router.push("/voting");
        break;
      case "message":
        router.push("/chat");
        break;
      case "reading":
        router.push("/readings");
        break;
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-sm border border-parchment-200 dark:border-parchment-700 text-parchment-700 dark:text-parchment-200 hover:border-iron"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
        title="Notifications"
      >
        <Bell size={14} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-ember px-1 text-[10px] font-medium text-parchment-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="drawer-enter fixed inset-x-3 top-[60px] z-50 mx-auto max-h-[70vh] max-w-md overflow-hidden rounded border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-900 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-[80vh]">
          <div className="flex items-center justify-between border-b border-parchment-200 dark:border-parchment-700 px-4 py-3">
            <div>
              <p className="display text-lg leading-none">Activity</p>
              <p className="mono-cap mt-1 text-[10px] text-parchment-500 dark:text-parchment-400">
                {unreadCount > 0 ? `${unreadCount} new` : "All caught up"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="mono-cap rounded-sm border border-parchment-200 dark:border-parchment-700 px-2 py-1 text-[10px] text-parchment-700 dark:text-parchment-300 hover:border-iron"
              >
                Settings
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-sm border border-parchment-200 dark:border-parchment-700 text-parchment-500 dark:text-parchment-400 hover:border-iron"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <ul className="max-h-[60vh] overflow-y-auto">
            {loading && visible.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-parchment-500 dark:text-parchment-400 serif-italic">
                Loading...
              </li>
            )}
            {!loading && visible.length === 0 && (
              <li className="px-4 py-10 text-center">
                <p className="serif-italic text-parchment-500 dark:text-parchment-400">
                  Nothing new. The forge is quiet.
                </p>
              </li>
            )}
            {visible.map((a) => {
              const isNew = a.createdAt > lastSeen;
              return (
                <li key={a.id}>
                  <button
                    onClick={() => openItem(a)}
                    className={classNames(
                      "flex w-full items-start gap-3 border-b border-parchment-100 dark:border-parchment-800 px-4 py-3 text-left hover:bg-parchment-100 dark:hover:bg-parchment-800/40",
                      isNew ? "bg-iron/5" : ""
                    )}
                  >
                    <Avatar name={a.actorName} photo={a.actorPhoto} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-parchment-900 dark:text-parchment-100 truncate">
                          {a.actorName}
                        </span>
                        <span className="text-xs text-parchment-500 dark:text-parchment-400">
                          {activityVerb(a.kind)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-parchment-700 dark:text-parchment-300 truncate">
                        {a.summary}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <ActivityIcon kind={a.kind} />
                        <span className="mono-cap text-[10px] text-parchment-500 dark:text-parchment-400">
                          {timeAgo(a.createdAt)}
                        </span>
                        {isNew && (
                          <span className="inline-flex items-center gap-1 mono-cap text-[10px] text-ember">
                            <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                            new
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function activityVerb(kind: Activity["kind"]): string {
  switch (kind) {
    case "event_created":
      return "planned an event";
    case "idea_posted":
      return "pitched an idea";
    case "poll_posted":
      return "posted a poll";
    case "message_posted":
      return "wrote in chat";
    case "reading_shared":
      return "shared what they're reading";
    case "recommendation_added":
      return "added a recommendation";
  }
}

function ActivityIcon({ kind }: { kind: Activity["kind"] }) {
  const cls = "h-5 w-5 shrink-0 grid place-items-center rounded-sm bg-parchment-200 dark:bg-parchment-800 text-iron";
  const icon = (() => {
    switch (kind) {
      case "event_created":
        return <CalendarPlus size={11} />;
      case "idea_posted":
        return <ThumbsUp size={11} />;
      case "poll_posted":
        return <Vote size={11} />;
      case "message_posted":
        return <MessageSquare size={11} />;
      case "reading_shared":
        return <BookOpen size={11} />;
      case "recommendation_added":
        return <Sparkles size={11} />;
    }
  })();
  return <span className={cls}>{icon}</span>;
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" className="h-8 w-8 shrink-0 rounded-full border border-parchment-200 dark:border-parchment-700" />;
  }
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-parchment-200 dark:bg-parchment-700 text-xs">
      {name[0]?.toUpperCase()}
    </div>
  );
}
