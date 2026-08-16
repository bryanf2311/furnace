export function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(ts).toLocaleDateString();
}

export function startOfWeek(d: Date = new Date()): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function nextWeekday(start: Date, weekday: number): Date {
  const d = new Date(start);
  const cur = d.getDay();
  const diff = (weekday - cur + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const ROTATING_VERSE = [
  { ref: "Proverbs 27:17", text: "As iron sharpens iron, so one man sharpens another." },
  { ref: "1 Thessalonians 5:11", text: "Encourage one another and build each other up." },
  { ref: "Hebrews 10:24-25", text: "Spur one another on toward love and good deeds." },
  { ref: "Ecclesiastes 4:9-10", text: "Two are better than one, because they have a good return for their labor." },
  { ref: "Galatians 6:2", text: "Carry each other's burdens, and in this way you will fulfill the law of Christ." },
];

export function verseForWeek(d: Date = new Date()): typeof ROTATING_VERSE[number] {
  const start = startOfWeek(d);
  const weekIndex = Math.floor(start.getTime() / (7 * 24 * 60 * 60 * 1000));
  return ROTATING_VERSE[weekIndex % ROTATING_VERSE.length];
}
