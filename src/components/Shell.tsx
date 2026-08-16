"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Compass,
  Flame,
  LogOut,
  MessageSquare,
  Moon,
  Send,
  Shield,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/useTheme";
import { BrandMark } from "./Brand";
import { classNames, verseForWeek } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Flame },
  { href: "/plan", label: "This week", icon: Compass },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/ideas", label: "Ideas", icon: Sparkles },
  { href: "/readings", label: "Readings", icon: BookOpen },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/admin", label: "Leaders", icon: Users, adminOnly: true },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin, loading, signOut, configured, initError, viewMode, setViewMode } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !loading && !user && configured) {
      router.replace("/login");
    }
  }, [mounted, loading, user, configured, router]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (loading || !mounted) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="display text-parchment-400 dark:text-parchment-500 serif-italic">Loading...</div>
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
          <h1 className="display text-3xl mb-3">Furnace isn't set up yet.</h1>
          <p className="text-parchment-700 dark:text-parchment-300 mb-6">
            Add your Firebase project credentials to{" "}
            <span className="mono-cap bg-parchment-200 dark:bg-parchment-800 px-1.5 py-0.5">.env.local</span>{" "}
            and rebuild.
          </p>
          <pre className="text-left text-xs bg-parchment-100 dark:bg-parchment-800/60 border border-parchment-200 dark:border-parchment-700 rounded p-4 overflow-x-auto">
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

  if (initError && !user) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-xl text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <BrandMark size={28} />
          </div>
          <h1 className="display text-3xl mb-3">Sign-in didn't finish.</h1>
          <p className="text-parchment-700 dark:text-parchment-300 mb-4">{initError}</p>
          <p className="text-sm text-parchment-500 dark:text-parchment-400">
            Most likely: this site isn't on your Firebase project's authorized-domain list, or an ad-blocker is blocking Firebase.
            Add{" "}
            <span className="mono-cap bg-parchment-200 dark:bg-parchment-800 px-1.5 py-0.5 text-iron">
              {typeof window !== "undefined" ? window.location.hostname : "furnace-small-group.netlify.app"}
            </span>{" "}
            under Firebase Console → Authentication → Sign-in method → Authorized domains.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded border border-iron px-4 py-2 text-iron hover:bg-iron/10"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  // Effective admin status: leaders can drop into member view, which hides admin UI
  const effectiveAdmin = isAdmin && viewMode === "leader";
  const verse = verseForWeek();

  const navItems = NAV.filter((n) => !n.adminOnly || effectiveAdmin);

  return (
    <div className="grain flex min-h-screen flex-col">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 border-b border-parchment-200 dark:border-parchment-700 bg-parchment-50/85 dark:bg-parchment-900/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-5">
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-sm border border-parchment-200 dark:border-parchment-700 text-parchment-700 dark:text-parchment-200 hover:border-iron"
            aria-label="Open menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <BrandMark size={20} />
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <button
                onClick={() => setViewMode(viewMode === "leader" ? "member" : "leader")}
                className={classNames(
                  "mono-cap hidden sm:inline-block rounded-sm border px-2 py-1 transition-colors",
                  viewMode === "leader"
                    ? "border-ember/40 bg-ember/10 text-ember"
                    : "border-parchment-300 dark:border-parchment-700 text-parchment-500 dark:text-parchment-400"
                )}
                title="Preview what brothers see"
              >
                {viewMode === "leader" ? "Leader view" : "Member view"}
              </button>
            )}
            <button
              onClick={toggle}
              className="grid h-9 w-9 place-items-center rounded-sm border border-parchment-200 dark:border-parchment-700 text-parchment-700 dark:text-parchment-200 hover:border-iron"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm text-parchment-900 dark:text-parchment-100">{profile.displayName}</span>
              <span className="mono-cap text-parchment-500 dark:text-parchment-400">
                {isAdmin ? "Leader" : "Member"}
              </span>
            </div>
            {profile.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoURL}
                alt=""
                className="h-8 w-8 rounded-full border border-parchment-200 dark:border-parchment-700"
              />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-parchment-300 dark:bg-parchment-700 text-xs text-parchment-900 dark:text-parchment-100">
                {profile.displayName[0]?.toUpperCase()}
              </div>
            )}
            <button
              onClick={() => signOut()}
              className="grid h-9 w-9 place-items-center rounded-sm border border-parchment-200 dark:border-parchment-700 text-parchment-700 dark:text-parchment-200 hover:border-iron hover:text-parchment-900 dark:hover:text-parchment-100"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {drawerOpen && (
        <>
          <div
            className="overlay-enter fixed inset-0 z-50 bg-parchment-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="drawer-enter fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-parchment-50 dark:bg-parchment-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-parchment-200 dark:border-parchment-700 px-5 py-4">
              <BrandMark size={20} />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-sm border border-parchment-200 dark:border-parchment-700 text-parchment-700 dark:text-parchment-200 hover:border-iron"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex items-center gap-3 border-b border-parchment-200 dark:border-parchment-700 px-5 py-4">
              {profile.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoURL} alt="" className="h-10 w-10 rounded-full border border-parchment-200 dark:border-parchment-700" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-parchment-300 dark:bg-parchment-700 text-sm">
                  {profile.displayName[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm text-parchment-900 dark:text-parchment-100">{profile.displayName}</div>
                <span className="mono-cap text-parchment-500 dark:text-parchment-400">{isAdmin ? "Leader" : "Member"}</span>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              {navItems.map((n) => {
                const active = pathname === n.href || pathname?.startsWith(n.href + "/");
                const Icon = n.icon;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={classNames(
                      "mb-1 flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-parchment-200 dark:bg-parchment-800 text-parchment-900 dark:text-parchment-100"
                        : "text-parchment-700 dark:text-parchment-300 hover:bg-parchment-100 dark:hover:bg-parchment-800/60"
                    )}
                  >
                    <Icon size={16} className={active ? "text-iron" : "text-parchment-500"} />
                    <span>{n.label}</span>
                  </Link>
                );
              })}
            </nav>

            {isAdmin && (
              <div className="border-t border-parchment-200 dark:border-parchment-700 p-3">
                <button
                  onClick={() => setViewMode(viewMode === "leader" ? "member" : "leader")}
                  className={classNames(
                    "flex w-full items-center gap-3 rounded-sm border px-3 py-2.5 text-sm transition-colors",
                    viewMode === "leader"
                      ? "border-ember/40 bg-ember/10 text-ember"
                      : "border-parchment-300 dark:border-parchment-700 text-parchment-700 dark:text-parchment-300"
                  )}
                >
                  <Shield size={14} />
                  <span>{viewMode === "leader" ? "Switch to member view" : "Switch to leader view"}</span>
                </button>
                <Link
                  href="/admin?invite=1"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm border border-parchment-200 dark:border-parchment-700 px-3 py-2.5 text-sm text-parchment-700 dark:text-parchment-300 hover:border-iron"
                >
                  <Send size={14} />
                  <span>Invite a brother</span>
                </Link>
              </div>
            )}
          </aside>
        </>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-5 sm:py-10">{children}</main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-5">
        <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-parchment-100/70 dark:bg-parchment-900/60 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
            <span className="mono-cap text-iron shrink-0">{verse.ref}</span>
            <span className="serif-italic text-parchment-700 dark:text-parchment-200">"{verse.text}"</span>
          </div>
          <div className="mt-4">
            <div className="coal-bed-thin" />
          </div>
        </div>
      </footer>
    </div>
  );
}
