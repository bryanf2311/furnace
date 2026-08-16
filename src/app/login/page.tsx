"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { BrandMark } from "@/components/Brand";
import { CoalBed } from "@/components/CoalBed";

export default function LoginPage() {
  const { user, loading, signIn, configured } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function onSignIn() {
    setPending(true);
    setError(null);
    try {
      await signIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grain relative grid min-h-screen place-items-center px-5 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-ember/10 to-transparent" />
      <div className="relative w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <BrandMark size={26} />
        </div>

        <h1 className="display text-center text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Where iron<br />
          <span className="serif-italic text-iron">sharpens iron.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-sm text-center text-parchment-700 dark:text-parchment-300">
          The sync room for our small group. Plan the week, pitch topics, gather on Mondays and Wednesdays, and hang on the off-Fridays.
        </p>

        <div className="my-10">
          <CoalBed />
        </div>

        {!configured ? (
          <div className="rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900 p-5 text-sm text-parchment-700 dark:text-parchment-300">
            Firebase isn't configured yet. Add your credentials to{" "}
            <span className="mono-cap bg-parchment-100 dark:bg-parchment-800 px-1.5 py-0.5 text-iron">.env.local</span>{" "}
            and restart the dev server.
          </div>
        ) : (
          <button
            onClick={onSignIn}
            disabled={pending}
            className="group flex w-full items-center justify-between rounded border border-parchment-200 dark:border-parchment-700 bg-white dark:bg-parchment-900 px-5 py-4 text-left transition-all hover:border-iron hover:bg-parchment-100 dark:bg-parchment-800 disabled:opacity-60"
          >
            <span>
              <span className="block text-parchment-900 dark:text-parchment-100">
                {pending ? "Opening Google..." : "Sign in with Google"}
              </span>
              <span className="mt-0.5 block text-sm text-parchment-500 dark:text-parchment-400">
                Same Google account your leaders use
              </span>
            </span>
            <ArrowRight className="text-iron transition-transform group-hover:translate-x-1" />
          </button>
        )}

        {error && (
          <p className="mt-4 text-center text-sm text-ember">{error}</p>
        )}

        <div className="mt-12 text-center">
          <p className="mono-cap text-parchment-400 dark:text-parchment-500">
            Proverbs 27:17 · Men of the Forge
          </p>
        </div>
      </div>
    </div>
  );
}
