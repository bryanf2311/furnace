"use client";

import { Suspense, useEffect, useState } from "react";
import { Copy, Check, Send, Shield, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { db, isConfigured } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/lib/types";

function LeadersInner() {
  const { profile, isAdmin, setRole } = useAuth();
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }
    const q = collection(db, "users");
    const unsub = onSnapshot(q, (snap) => {
      const list: AppUser[] = [];
      snap.forEach((d) => list.push(d.data() as AppUser));
      list.sort((a, b) => {
        if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
        return a.displayName.localeCompare(b.displayName);
      });
      setMembers(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function toggle(uid: string, current: UserRole) {
    if (!isAdmin) return;
    const next: UserRole = current === "admin" ? "member" : "admin";
    if (!confirm(`${current === "admin" ? "Demote" : "Promote"} this member to ${next}?`)) return;
    await setRole(uid, next);
  }

  const inviteUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }

  return (
    <Shell>
      <p className="mono-cap text-iron">Leaders</p>
      <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
        Who's in the room
      </h1>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        Members who can post plans, set the week's topics, and promote other brothers to leader.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* INVITE LINK */}
      {isAdmin && (
        <div className="mb-8 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-ember/15 text-ember">
              <Send size={16} />
            </div>
            <div className="flex-1">
              <h2 className="display text-lg">Invite a brother</h2>
              <p className="mt-1 text-sm text-parchment-700 dark:text-parchment-300">
                Send this link to the men in your group. They sign in with their Google account and they're in.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-50 dark:bg-parchment-950 px-3 py-2 text-sm text-parchment-900 dark:text-parchment-100 font-mono"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={copyInvite}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-iron px-3 py-2 text-sm font-medium text-ink hover:bg-iron-glow"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="rounded border border-parchment-300 dark:border-parchment-700 bg-parchment-100 dark:bg-parchment-900/70 p-5 text-parchment-700 dark:text-parchment-300">
          You're viewing this page as a member. Only leaders can change roles.
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center serif-italic text-parchment-500 dark:text-parchment-400">Loading...</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <li
              key={m.uid}
              className="flex items-center gap-4 rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900/70 p-4"
            >
              {m.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.photoURL}
                  alt=""
                  className="h-10 w-10 rounded-full border border-parchment-200 dark:border-parchment-700"
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-parchment-300 dark:bg-parchment-700 text-sm">
                  {m.displayName[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-parchment-900 dark:text-parchment-100 truncate">{m.displayName}</span>
                  {m.uid === profile?.uid && (
                    <span className="mono-cap text-[10px] text-iron">you</span>
                  )}
                </div>
                <span className="mono-cap text-parchment-500 dark:text-parchment-400 truncate block">{m.email}</span>
              </div>
              <button
                onClick={() => toggle(m.uid, m.role)}
                disabled={!isAdmin}
                className={
                  m.role === "admin"
                    ? "inline-flex items-center gap-1.5 rounded-sm border border-ember/40 bg-ember/10 px-3 py-1.5 text-xs text-ember hover:bg-ember/20 disabled:opacity-60"
                    : "inline-flex items-center gap-1.5 rounded-sm border border-parchment-300 dark:border-parchment-700 px-3 py-1.5 text-xs text-parchment-700 dark:text-parchment-300 hover:border-iron disabled:opacity-60"
                }
              >
                {m.role === "admin" ? (
                  <>
                    <ShieldCheck size={13} /> Leader
                  </>
                ) : (
                  <>
                    <Shield size={13} /> Member
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <LeadersInner />
    </Suspense>
  );
}
