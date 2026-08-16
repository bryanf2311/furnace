"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Compass,
  Flame,
  LogOut,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { BrandMark } from "./Brand";
import { classNames, verseForWeek } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Flame },
  { href: "/plan", label: "This week", icon: Compass },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/ideas", label: "Ideas", icon: Sparkles },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/admin", label: "Leaders", icon: Users, adminOnly: true },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin, loading, signOut, configured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !loading && !user && configured) {
      router.replace("/login");
    }
  }, [mounted, loading, user, configured, router]);

  if (loading || !mounted) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="display text-forge-300 serif-italic">kindling...</div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-xl text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <BrandMark size={28} />
          </div>
          <h1 className="display text-3xl mb-3">Furnace is not yet lit.</h1>
          <p className="text-forge-300 mb-6">
            Add your Firebase project credentials to <span className="mono-cap bg-forge-800 px-1.5 py-0.5">.env.local</span> and rebuild.
          </p>
          <pre className="text-left text-xs bg-forge-800/60 border border-forge-700 rounded p-4 overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_ADMIN_EMAILS=you@gmail.com`}
          </pre>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  const verse = verseForWeek();

  return (
    <div className="grain flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-forge-800 bg-forge-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <BrandMark size={20} />
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
              const active = pathname === n.href || pathname?.startsWith(n.href + "/");
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={classNames(
                    "group flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-forge-800 text-parchment"
                      : "text-forge-300 hover:text-parchment hover:bg-forge-800/60"
                  )}
                >
                  <Icon size={15} className={active ? "text-iron" : "text-forge-400 group-hover:text-iron"} />
                  <span className="whitespace-nowrap">{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm text-parchment">{profile.displayName}</span>
              <span className="mono-cap text-forge-400">
                {isAdmin ? "Leader" : "Member"}
              </span>
            </div>
            {profile.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoURL}
                alt=""
                className="h-8 w-8 rounded-full border border-forge-700"
              />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-forge-700 text-xs">
                {profile.displayName[0]?.toUpperCase()}
              </div>
            )}
            <button
              onClick={() => signOut()}
              className="grid h-8 w-8 place-items-center rounded-sm border border-forge-700 text-forge-300 hover:text-parchment hover:border-iron hover:bg-forge-800 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-10">
        <div className="rounded border border-forge-800 bg-forge-900/60 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
            <span className="mono-cap text-iron shrink-0">{verse.ref}</span>
            <span className="serif-italic text-forge-200">"{verse.text}"</span>
          </div>
          <div className="mt-4">
            <div className="coal-bed-thin" />
          </div>
        </div>
      </footer>
    </div>
  );
}
