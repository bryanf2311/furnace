"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, google, isConfigured } from "./firebase";
import type { AppUser, UserRole } from "./types";

type ViewMode = "leader" | "member";

interface AuthContextValue {
  user: User | null;
  profile: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  configured: boolean;
  initError: string | null;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (uid: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>("leader");

  useEffect(() => {
    if (!isConfigured || !auth || !db) {
      setLoading(false);
      return;
    }
    const watchdog = setTimeout(() => {
      setLoading((stillLoading) => {
        if (stillLoading) setInitError("Sign-in never finished. Check your network and any ad-blockers, then retry.");
        return false;
      });
    }, 6000);

    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        clearTimeout(watchdog);
        setUser(u);
        if (u) {
          try {
            const ref = doc(db!, "users", u.uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              const seededRole: UserRole = isAdminEmail(u.email) ? "admin" : "member";
              const newProfile: AppUser = {
                uid: u.uid,
                email: u.email ?? "",
                displayName: u.displayName ?? u.email ?? "Member",
                photoURL: u.photoURL ?? null,
                role: seededRole,
                createdAt: Date.now(),
              };
              await setDoc(ref, { ...newProfile, createdAt: serverTimestamp() });
              setProfile(newProfile);
            } else {
              setProfile(snap.data() as AppUser);
            }
          } catch (err) {
            setInitError(err instanceof Error ? err.message : "Failed to load profile.");
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        clearTimeout(watchdog);
        setInitError(err.message);
        setLoading(false);
      }
    );
    return () => {
      clearTimeout(watchdog);
      unsub();
    };
  }, []);

  // View mode is persisted per-user in localStorage. Leaders default to leader;
  // they can flip to "member" to preview what brothers see.
  useEffect(() => {
    if (!user) return;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(`furnace:viewMode:${user.uid}`) : null;
    if (stored === "member" || stored === "leader") setViewModeState(stored);
  }, [user]);

  const setViewMode = useCallback(
    (m: ViewMode) => {
      setViewModeState(m);
      if (user && typeof window !== "undefined") {
        window.localStorage.setItem(`furnace:viewMode:${user.uid}`, m);
      }
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAdmin: profile?.role === "admin",
      loading,
      configured: isConfigured,
      initError,
      viewMode,
      setViewMode,
      signIn: async () => {
        if (!auth || !google) throw new Error("Firebase not configured");
        await signInWithPopup(auth, google);
      },
      signOut: async () => {
        if (!auth) return;
        await signOut(auth);
      },
      setRole: async (uid: string, role: UserRole) => {
        if (!db) throw new Error("Firebase not configured");
        await updateDoc(doc(db, "users", uid), { role });
      },
    }),
    [user, profile, loading, initError, viewMode, setViewMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
