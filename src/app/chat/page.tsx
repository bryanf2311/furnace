"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed, CoalBedThin } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { sendMessage, useMessages } from "@/lib/firestore";
import { timeAgo, classNames } from "@/lib/utils";

export default function ChatPage() {
  const { profile } = useAuth();
  const { items, loading } = useMessages();
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
        body: text.trim(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <Shell>
      <p className="mono-cap text-iron">The room</p>
      <h1 className="display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
        Chat with the brothers
      </h1>
      <p className="mt-3 max-w-2xl text-forge-300">
        Anything on your mind — a verse from your reading, a question for the week, a prayer request. Keep it brotherly.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      <div className="rounded border border-forge-800 bg-forge-900/40">
        <div className="max-h-[60vh] overflow-y-auto px-4 py-5 space-y-4">
          {loading && (
            <p className="text-center text-forge-400 py-12 serif-italic">Listening...</p>
          )}
          {!loading && items.length === 0 && (
            <p className="text-center text-forge-400 py-12 serif-italic">
              No messages yet. The first word starts a fire.
            </p>
          )}
          {items.map((m, i) => {
            const mine = m.uid === profile?.uid;
            const prev = items[i - 1];
            const sameAuthor = prev?.uid === m.uid && m.createdAt - (prev?.createdAt ?? 0) < 5 * 60 * 1000;
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
                        className="h-8 w-8 rounded-full border border-forge-700"
                      />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-forge-700 text-xs">
                        {m.authorName[0]?.toUpperCase()}
                      </div>
                    ))}
                </div>
                <div className="flex-1">
                  {!sameAuthor && (
                    <div className="flex items-baseline gap-2">
                      <span className={classNames("text-sm", mine ? "text-iron" : "text-parchment")}>
                        {m.authorName}
                      </span>
                      <span className="mono-cap text-[10px] text-forge-500">
                        {timeAgo(m.createdAt)}
                      </span>
                    </div>
                  )}
                  <p
                    className={classNames(
                      "mt-1 inline-block max-w-prose whitespace-pre-line rounded-sm border px-3 py-2 text-sm",
                      mine
                        ? "border-iron/30 bg-iron/10 text-parchment"
                        : "border-forge-700 bg-forge-800/60 text-forge-200"
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

        <div className="border-t border-forge-800 px-4 py-3">
          <CoalBedThin className="mb-3" />
          <form onSubmit={send} className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={profile ? "Say something to the brothers..." : "Sign in to chat"}
              disabled={!profile || sending}
              className="flex-1 rounded-sm border border-forge-700 bg-forge-950 px-3 py-2 text-parchment placeholder:text-forge-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!text.trim() || !profile || sending}
              className="grid h-10 w-10 place-items-center rounded-sm bg-iron text-forge-950 hover:bg-iron-glow disabled:opacity-40"
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
