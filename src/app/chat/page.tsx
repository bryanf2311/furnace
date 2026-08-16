"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Shield, Users } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { sendMessage, useMessages } from "@/lib/firestore";
import { timeAgo, classNames } from "@/lib/utils";
import type { ChatRoom } from "@/lib/types";

export default function ChatPage() {
  const { profile, isAdmin, viewMode } = useAuth();
  const effectiveAdmin = isAdmin && viewMode === "leader";

  // Leaders see both rooms and can flip between them. Members only see the members room.
  const initialRoom: ChatRoom = effectiveAdmin ? "leaders" : "members";
  const [room, setRoom] = useState<ChatRoom>(initialRoom);
  const { items, loading } = useMessages(room);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({
        uid: profile.uid,
        authorName: profile.displayName,
        authorPhoto: profile.photoURL,
        authorRole: profile.role,
        body: text.trim(),
        room,
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <Shell>
      <p className="mono-cap text-iron">The room</p>
      <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
        Chat with the brothers
      </h1>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        Two rooms — one for leaders planning the week, one for the brothers. Pick yours.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* ROOM TABS */}
      <div className="mb-4 flex gap-2">
        {effectiveAdmin && (
          <button
            onClick={() => setRoom("leaders")}
            className={classNames(
              "flex items-center gap-2 rounded-sm border px-4 py-2 text-sm transition-colors",
              room === "leaders"
                ? "border-ember/40 bg-ember/10 text-ember"
                : "border-parchment-200 dark:border-parchment-700 text-parchment-700 dark:text-parchment-300 hover:border-iron"
            )}
          >
            <Shield size={14} />
            Leaders only
          </button>
        )}
        <button
          onClick={() => setRoom("members")}
          className={classNames(
            "flex items-center gap-2 rounded-sm border px-4 py-2 text-sm transition-colors",
            room === "members"
              ? "border-iron/40 bg-iron/10 text-iron"
              : "border-parchment-200 dark:border-parchment-700 text-parchment-700 dark:text-parchment-300 hover:border-iron"
          )}
        >
          <Users size={14} />
          Brothers
        </button>
      </div>

      <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70">
        <div className="max-h-[60vh] overflow-y-auto px-4 py-5 space-y-4">
          {loading && (
            <p className="text-center text-parchment-500 dark:text-parchment-400 py-12 serif-italic">Loading...</p>
          )}
          {!loading && items.length === 0 && (
            <p className="text-center text-parchment-500 dark:text-parchment-400 py-12 serif-italic">
              No messages yet. The first word starts the fire.
            </p>
          )}
          {items.map((m, i) => {
            const mine = m.uid === profile?.uid;
            const prev = items[i - 1];
            const sameAuthor = prev?.uid === m.uid && m.createdAt - (prev?.createdAt ?? 0) < 5 * 60 * 1000;
            const leaderBadge = m.authorRole === "admin";
            return (
              <div
                key={m.id}
                className={classNames(
                  "flex items-start gap-3",
                  sameAuthor ? "mt-1" : "mt-4"
                )}
              >
                <div className="w-8 shrink-0">
                  {!sameAuthor &&
                    (m.authorPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.authorPhoto}
                        alt=""
                        className="h-8 w-8 rounded-full border border-parchment-200 dark:border-parchment-700"
                      />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-parchment-200 dark:bg-parchment-700 text-xs">
                        {m.authorName[0]?.toUpperCase()}
                      </div>
                    ))}
                </div>
                <div className="flex-1">
                  {!sameAuthor && (
                    <div className="flex items-baseline gap-2">
                      <span className={classNames("text-sm", mine ? "text-iron" : "text-parchment-900 dark:text-parchment-100")}>
                        {m.authorName}
                      </span>
                      {leaderBadge && (
                        <span className="mono-cap text-[10px] text-ember">Leader</span>
                      )}
                      <span className="mono-cap text-[10px] text-parchment-500 dark:text-parchment-400">
                        {timeAgo(m.createdAt)}
                      </span>
                    </div>
                  )}
                  <p
                    className={classNames(
                      "mt-1 inline-block max-w-prose whitespace-pre-line rounded-sm border px-3 py-2 text-sm",
                      mine
                        ? "border-iron/30 bg-iron/10 text-parchment-900 dark:text-parchment-100"
                        : "border-parchment-200 dark:border-parchment-700 bg-parchment-100 dark:bg-parchment-800/60 text-parchment-700 dark:text-parchment-200"
                    )}
                  >
                    {m.body}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-parchment-200 dark:border-parchment-700 px-4 py-3">
          <CoalBedThin className="mb-3" />
          <form onSubmit={send} className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={profile ? "Say something to the brothers..." : "Sign in to chat"}
              disabled={!profile || sending}
              className="flex-1 rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-parchment-900 dark:text-parchment-100 placeholder:text-parchment-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!text.trim() || !profile || sending}
              className="grid h-10 w-10 place-items-center rounded-sm bg-iron text-ink hover:bg-iron-glow disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </Shell>
  );
}
