export type UserRole = "admin" | "member";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  createdAt: number;
}

export type MeetingKind = "monday" | "wednesday" | "friday";
export type RsvpStatus = "yes" | "no" | "maybe";

export interface Meeting {
  id: string;
  date: string;
  kind: MeetingKind;
  title: string;
  notes: string;
  reading?: string;
  rsvps?: Record<string, RsvpStatus>;
  createdBy: string;
  createdAt: number;
}

export interface Idea {
  id: string;
  title: string;
  body: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  votes: Record<string, 1>;
  source: "leader" | "member";
}

export type ReadingStatus = "upcoming" | "current" | "finished";
export type ReadingKind = "book" | "passage" | "article" | "devotional";

export interface Reading {
  id: string;
  title: string;
  author?: string;
  kind: ReadingKind;
  note?: string;
  status: ReadingStatus;
  createdBy: string;
  createdByName: string;
  createdAt: number;
}

export const READING_KIND_LABEL: Record<ReadingKind, string> = {
  book: "Book",
  passage: "Passage",
  article: "Article",
  devotional: "Devotional",
};

export const READING_STATUS_LABEL: Record<ReadingStatus, string> = {
  upcoming: "Up next",
  current: "Reading now",
  finished: "Finished",
};

export type ChatRoom = "leaders" | "members";

export interface Message {
  id: string;
  uid: string;
  authorName: string;
  authorPhoto: string | null;
  authorRole: UserRole;
  body: string;
  createdAt: number;
}

export const MEETING_LABELS: Record<MeetingKind, string> = {
  monday: "Monday Bible Study",
  wednesday: "Wednesday Bible Study",
  friday: "Friday Hang",
};

export const MEETING_SHORT: Record<MeetingKind, string> = {
  monday: "MON",
  wednesday: "WED",
  friday: "FRI",
};
