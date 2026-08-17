export type UserRole = "admin" | "member";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  createdAt: number;
  notifPrefs?: NotifPrefs;
  lastSeenActivityAt?: number;
}

export type NotifCategory = "events" | "ideas" | "polls" | "messages" | "readings";

export interface NotifPrefs {
  events: boolean;
  ideas: boolean;
  polls: boolean;
  messages: boolean;
  readings: boolean;
}

export const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  events: true,
  ideas: true,
  polls: true,
  messages: true,
  readings: true,
};

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

export type ReadingKind = "book" | "passage" | "article" | "devotional";

export const READING_KIND_LABEL: Record<ReadingKind, string> = {
  book: "Book",
  passage: "Passage",
  article: "Article",
  devotional: "Devotional",
};

// What each brother is currently reading. One per user.
export interface CurrentRead {
  uid: string;
  displayName: string;
  photoURL: string | null;
  title: string;
  author?: string;
  note?: string;
  updatedAt: number;
}

// Books the leaders recommend for the group.
export interface Recommendation {
  id: string;
  title: string;
  author?: string;
  kind: ReadingKind;
  note?: string;
  addedBy: string;
  addedByName: string;
  createdAt: number;
}

// Polls (leader-created, anyone votes).
export interface PollOption {
  id: string;
  label: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  votes: Record<string, string>; // uid -> optionId
  createdBy: string;
  createdByName: string;
  createdAt: number;
  closed: boolean;
}

export type ChatRoom = "leaders" | "members";

// Activity feed entry — one doc per notable event in the app.
export type ActivityKind =
  | "event_created"
  | "idea_posted"
  | "poll_posted"
  | "message_posted"
  | "reading_shared"
  | "recommendation_added";

export type ActivityCategory = "events" | "ideas" | "polls" | "messages" | "readings";

export const ACTIVITY_CATEGORY: Record<ActivityKind, ActivityCategory> = {
  event_created: "events",
  idea_posted: "ideas",
  poll_posted: "polls",
  message_posted: "messages",
  reading_shared: "readings",
  recommendation_added: "readings",
};

export interface Activity {
  id: string;
  kind: ActivityKind;
  summary: string;
  actorUid: string;
  actorName: string;
  actorPhoto: string | null;
  refType: "idea" | "event" | "poll" | "message" | "reading";
  refId: string;
  extra?: Record<string, string>;
  createdAt: number;
}

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
