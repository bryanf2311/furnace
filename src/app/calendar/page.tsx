"use client";

import { useMemo } from "react";
import { Shell } from "@/components/Shell";
import { CoalBed } from "@/components/CoalBed";
import { useMeetings } from "@/lib/firestore";
import { toDateKey } from "@/lib/utils";
import { MEETING_SHORT } from "@/lib/types";

const WEEKS = 4;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_LABELS_LONG = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  const { items } = useMeetings();

  // Build week-by-week: an array of weeks, each with 7 days.
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const all: { date: Date; key: string }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const row: { date: Date; key: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        row.push({ date, key: toDateKey(date) });
      }
      all.push(row);
    }
    return all;
  }, []);

  function meetingFor(date: string) {
    return items.find((m) => m.date === date);
  }

  function isFridayHang(date: Date): boolean {
    if (date.getDay() !== 5) return false;
    const ref = new Date(date);
    const start = new Date(ref.getFullYear(), 0, 1);
    const offset = Math.floor((ref.getTime() - start.getTime()) / (7 * 86400000));
    return offset % 2 === 0;
  }

  const todayKey = toDateKey(new Date());
  const monthYear = (d: Date) => d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <Shell>
      <p className="mono-cap text-iron">Calendar</p>
      <h1 className="display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
        Six weeks ahead
      </h1>
      <p className="mt-3 max-w-2xl text-parchment-700 dark:text-parchment-300">
        Mondays and Wednesdays are our weekly study. Every other Friday we hang.
      </p>

      <div className="my-8">
        <CoalBed />
      </div>

      {/* WEEK LEGEND (desktop only — labels above the grid) */}
      <div className="hidden sm:grid grid-cols-7 gap-2 mb-2">
        {DAY_LABELS_LONG.map((d, i) => (
          <div key={i} className="mono-cap text-center text-parchment-500 dark:text-parchment-400">
            {d}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {weeks.map((week, wi) => {
          const weekStart = week[0].date;
          // Only show the month label on the first row, or when the month changes mid-grid
          const showMonth = wi === 0 || weekStart.getMonth() !== weeks[wi - 1][0].date.getMonth();
          return (
            <div key={wi}>
              {showMonth && (
                <p className="display text-sm text-parchment-500 dark:text-parchment-400 mb-1.5">
                  {monthYear(weekStart)}
                </p>
              )}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {week.map((c) => {
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
                        "min-h-[88px] sm:min-h-[110px] rounded-sm border p-1.5 sm:p-2 transition-colors",
                        isPast ? "opacity-60" : "",
                      ].join(" ")}
                      style={{
                        background: isToday
                          ? "rgba(217,84,43,0.06)"
                          : "var(--tw-bg-opacity,1)",
                        borderColor: isToday
                          ? "rgba(217,84,43,0.5)"
                          : undefined,
                      }}
                    >
                      <div className="flex items-baseline justify-between gap-1">
                        {/* Mobile: short letter; Desktop: nothing — header above */}
                        <span
                          className={
                            isToday
                              ? "display text-base sm:text-lg text-iron"
                              : "text-sm sm:text-sm text-parchment-700 dark:text-parchment-300"
                          }
                        >
                          <span className="sm:hidden mr-1 mono-cap text-[9px] text-parchment-500 dark:text-parchment-400">
                            {DAY_LABELS[c.date.getDay() === 0 ? 6 : c.date.getDay() - 1]}
                          </span>
                          {dayNum}
                        </span>
                        {m && (
                          <span className="mono-cap text-[9px] sm:text-[10px] text-iron">
                            {MEETING_SHORT[m.kind]}
                          </span>
                        )}
                        {!m && isFri && hangDay && (
                          <span className="mono-cap text-[9px] sm:text-[10px] text-parchment-400 dark:text-parchment-500">
                            FRI
                          </span>
                        )}
                      </div>
                      {m ? (
                        <a
                          href="/plan"
                          className="mt-1 block rounded-sm border border-parchment-200 dark:border-parchment-700 bg-parchment-100/60 dark:bg-parchment-800/60 px-1.5 py-1 text-[10px] sm:text-xs hover:border-iron"
                        >
                          <span className="block display text-parchment-900 dark:text-parchment-100 truncate text-xs sm:text-sm">
                            {m.title}
                          </span>
                          {m.reading && (
                            <span className="mono-cap mt-0.5 block text-[9px] sm:text-[10px] text-parchment-500 dark:text-parchment-400 truncate">
                              {m.reading}
                            </span>
                          )}
                        </a>
                      ) : (
                        (c.date.getDay() === 1 || c.date.getDay() === 3) &&
                        !isPast && (
                          <a
                            href="/plan"
                            className="mt-1 block rounded-sm border border-dashed border-parchment-200 dark:border-parchment-700 px-1 py-1 text-center text-[9px] sm:text-[10px] text-parchment-400 dark:text-parchment-500 hover:border-iron hover:text-iron"
                          >
                            + plan
                          </a>
                        )
                      )}
                      {!m && isFri && hangDay && !isPast && (
                        <a
                          href="/plan"
                          className="mt-1 block rounded-sm border border-dashed border-parchment-200 dark:border-parchment-700 px-1 py-1 text-center text-[9px] sm:text-[10px] text-parchment-400 dark:text-parchment-500 hover:border-iron hover:text-iron"
                        >
                          + hang
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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
