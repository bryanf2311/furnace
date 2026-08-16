"use client";

import { useMemo } from "react";
import { Shell } from "@/components/Shell";
import { CoalBed } from "@/components/CoalBed";
import { useMeetings } from "@/lib/firestore";
import { toDateKey } from "@/lib/utils";
import { MEETING_SHORT } from "@/lib/types";

const WEEKS = 6;

export default function CalendarPage() {
  const { items } = useMeetings();

  const grid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // back to Monday
    const cells: { date: Date; key: string }[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push({ date: d, key: toDateKey(d) });
    }
    return cells;
  }, []);

  function meetingFor(date: string) {
    return items.find((m) => m.date === date);
  }

  function isFridayHang(date: Date): boolean {
    // every other Friday — alternate weeks starting from current week's Friday
    if (date.getDay() !== 5) return false;
    const ref = new Date(date);
    const offset = Math.floor(
      (ref.getTime() - new Date(ref.getFullYear(), 0, 1).getTime()) / (7 * 86400000)
    );
    return offset % 2 === 0;
  }

  const todayKey = toDateKey(new Date());

  return (
    <Shell>
      <p className="mono-cap text-iron">Calendar</p>
      <h1 className="display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
        Six weeks ahead
      </h1>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        Mondays and Wednesdays are our weekly study. Every other Friday we hang. Tap a meeting to see its plan.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      <div className="overflow-x-auto rounded border border-parchment-200 dark:border-parchment-700 bg-white/70 dark:bg-parchment-900/40">
        <div className="grid min-w-[640px] grid-cols-7 border-b border-parchment-200 dark:border-parchment-700">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="mono-cap p-2 text-center text-parchment-400 dark:text-parchment-500 border-r last:border-r-0 border-parchment-200 dark:border-parchment-700">
              {d}
            </div>
          ))}
        </div>
        <div className="grid min-w-[640px] grid-cols-7">
          {grid.map((c) => {
            const m = meetingFor(c.key);
            const isFri = c.date.getDay() === 5;
            const hangDay = isFridayHang(c.date);
            const isToday = c.key === todayKey;
            const isPast = c.key < todayKey;
            const dayNum = c.date.getDate();
            return (
              <div
                key={c.key}
                className={[
                  "min-h-[110px] border-r border-b border-parchment-200 dark:border-parchment-700 p-2 transition-colors",
                  isPast ? "opacity-60" : "",
                  "last-in-row:border-r-0",
                ].join(" ")}
                style={{
                  background: isToday ? "rgba(217,84,43,0.06)" : "transparent",
                }}
              >
                <div className="flex items-baseline justify-between">
                  <span className={isToday ? "display text-lg text-iron" : "text-sm text-parchment-700 dark:text-parchment-300"}>
                    {dayNum}
                  </span>
                  {m && (
                    <span className="mono-cap text-iron">
                      {MEETING_SHORT[m.kind]}
                    </span>
                  )}
                  {!m && isFri && hangDay && (
                    <span className="mono-cap text-parchment-400 dark:text-parchment-500">FRI</span>
                  )}
                </div>
                {m ? (
                  <a
                    href="/plan"
                    className="mt-1.5 block rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-100/60 dark:bg-parchment-800/60 px-2 py-1.5 text-xs hover:border-iron"
                  >
                    <span className="block display text-parchment-900 dark:text-parchment-100 truncate">{m.title}</span>
                    {m.reading && (
                      <span className="mono-cap mt-0.5 block text-[10px] text-parchment-500 dark:text-parchment-400 truncate">
                        {m.reading}
                      </span>
                    )}
                  </a>
                ) : (
                  (c.date.getDay() === 1 || c.date.getDay() === 3) &&
                  !isPast && (
                    <a
                      href="/plan"
                      className="mt-1.5 block rounded-sm border border-dashed border-parchment-200 dark:border-parchment-700 px-2 py-1.5 text-center text-[10px] text-parchment-400 dark:text-parchment-500 hover:border-iron hover:text-iron"
                    >
                      + plan
                    </a>
                  )
                )}
                {!m && isFri && hangDay && !isPast && (
                  <a
                    href="/plan"
                    className="mt-1.5 block rounded-sm border border-dashed border-parchment-200 dark:border-parchment-700 px-2 py-1.5 text-center text-[10px] text-parchment-400 dark:text-parchment-500 hover:border-iron hover:text-iron"
                  >
                    + hang
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-parchment-500 dark:text-parchment-400">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm bg-ember" /> Today
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm border border-iron" /> Planned gathering
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm border border-dashed border-parchment-200 dark:border-parchment-700" /> Open slot
        </span>
        <span className="mono-cap">Mondays + Wednesdays · biweekly Fridays</span>
      </div>
    </Shell>
  );
}
