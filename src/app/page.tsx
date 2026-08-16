"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [user, loading, router]);

  return (
    <div className="grid min-h-screen place-items-center">
      <div className="display text-parchment-900 dark:text-parchment-100-900 dark:text-parchment-900 dark:text-parchment-100-100-700 dark:text-parchment-900 dark:text-parchment-100-900 dark:text-parchment-900 dark:text-parchment-100-100-300 serif-italic">kindling...</div>
    </div>
  );
}
