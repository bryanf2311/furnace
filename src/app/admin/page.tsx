"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CoalBed } from "@/components/CoalBed";
import { useAuth } from "@/lib/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { db, isConfigured } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/lib/types";

export default function AdminPage() {
  const { profile, isAdmin, setRole } = useAuth();
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Shell>
      <p className="mono-cap text-iron">Leaders</p>
      <h1 className="display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
        Who's in the room
      </h1>
      <p className="mt-3 max-w-2xl text-forge-300">
        Members who can post plans, set the week's topics, and promote other brothers to leader.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {!isAdmin && (
        <div className="rounded border border-forge-700 bg-forge-900 p-5 text-forge-300">
          You're viewing this page as a member. Only leaders can change roles.
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center serif-italic text-forge-400">Gathering the brothers...</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <li
              key={m.uid}
              className="flex items-center gap-4 rounded border border-forge-800 bg-forge-900/50 p-4"
            >
              {m.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.photoURL}
                  alt=""
                  className="h-10 w-10 rounded-full border border-forge-700"
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-forge-700 text-sm">
                  {m.displayName[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-parchment truncate">{m.displayName}</span>
                  {m.uid === profile?.uid && (
                    <span className="mono-cap text-[10px] text-iron">you</span>
                  )}
                </div>
                <span className="mono-cap text-forge-500 truncate block">{m.email}</span>
              </div>
              <button
                onClick={() => toggle(m.uid, m.role)}
                disabled={!isAdmin}
                className={
                  m.role === "admin"
                    ? "inline-flex items-center gap-1.5 rounded-sm border border-ember/40 bg-ember/10 px-3 py-1.5 text-xs text-ember hover:bg-ember/20 disabled:opacity-60"
                    : "inline-flex items-center gap-1.5 rounded-sm border border-forge-700 px-3 py-1.5 text-xs text-forge-300 hover:border-iron hover:text-parchment disabled:opacity-60"
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
