"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, isConfigured } from "./firebase";
import type { ChatRoom, CurrentRead, Idea, Meeting, Message, Recommendation, ReadingKind, RsvpStatus, UserRole } from "./types";

function ts(createdAt: unknown): number {
  if (createdAt && typeof createdAt === "object" && "toMillis" in (createdAt as Record<string, unknown>)) {
    return (createdAt as { toMillis: () => number }).toMillis();
  }
  if (typeof createdAt === "number") return createdAt;
  return Date.now();
}

export function useMeetings() {
  const [items, setItems] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "meetings"), orderBy("date", "asc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            date: data.date as string,
            kind: data.kind as Meeting["kind"],
            title: data.title as string,
            notes: data.notes as string,
            reading: data.reading as string | undefined,
            rsvps: (data.rsvps as Record<string, RsvpStatus> | undefined) ?? {},
            createdBy: data.createdBy as string,
            createdAt: ts(data.createdAt),
          };
        })
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  return { items, loading };
}

export async function upsertMeeting(
  m: Omit<Meeting, "id" | "createdAt"> & { id?: string }
) {
  if (!db) throw new Error("Firebase not configured");
  const data = { ...m, createdAt: serverTimestamp() };
  if (m.id) {
    await setDoc(doc(db, "meetings", m.id), data, { merge: true });
    return m.id;
  }
  const ref = await addDoc(collection(db, "meetings"), data);
  return ref.id;
}

export async function deleteMeeting(id: string) {
  if (!db) return;
  await deleteDoc(doc(db, "meetings", id));
}

export async function setRsvp(meetingId: string, uid: string, status: RsvpStatus) {
  if (!db) return;
  await updateDoc(doc(db, "meetings", meetingId), {
    [`rsvps.${uid}`]: status,
  });
}

export function useIdeas() {
  const [items, setItems] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title as string,
            body: data.body as string,
            createdBy: data.createdBy as string,
            createdByName: data.createdByName as string,
            createdAt: ts(data.createdAt),
            votes: (data.votes as Record<string, 1> | undefined) ?? {},
            source: (data.source as Idea["source"]) ?? "leader",
          };
        })
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  return { items, loading };
}

export async function addIdea(input: {
  title: string;
  body: string;
  createdBy: string;
  createdByName: string;
  source: Idea["source"];
}) {
  if (!db) throw new Error("Firebase not configured");
  await addDoc(collection(db, "ideas"), {
    ...input,
    createdAt: serverTimestamp(),
    votes: {},
  });
}

// One current read per user (doc id == uid)
export function useCurrentReads() {
  const [items, setItems] = useState<CurrentRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "currentReads"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            displayName: (data.displayName as string) ?? "Member",
            photoURL: (data.photoURL as string | null) ?? null,
            title: (data.title as string) ?? "",
            author: (data.author as string) ?? "",
            note: (data.note as string) ?? "",
            updatedAt: ts(data.updatedAt),
          };
        })
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  return { items, loading };
}

export async function setCurrentRead(input: {
  uid: string;
  displayName: string;
  photoURL: string | null;
  title: string;
  author?: string;
  note?: string;
}) {
  if (!db) throw new Error("Firebase not configured");
  await setDoc(
    doc(db, "currentReads", input.uid),
    {
      displayName: input.displayName,
      photoURL: input.photoURL,
      title: input.title.trim(),
      author: input.author?.trim() ?? "",
      note: input.note?.trim() ?? "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function clearCurrentRead(uid: string) {
  if (!db) throw new Error("Firebase not configured");
  await deleteDoc(doc(db, "currentReads", uid));
}

// Books the leaders recommend for the group.
export function useRecommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "recommendations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: (data.title as string) ?? "",
            author: (data.author as string) ?? "",
            kind: (data.kind as ReadingKind) ?? "book",
            note: (data.note as string) ?? "",
            addedBy: (data.addedBy as string) ?? "",
            addedByName: (data.addedByName as string) ?? "",
            createdAt: ts(data.createdAt),
          };
        })
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  return { items, loading };
}

export async function addRecommendation(input: Omit<Recommendation, "id" | "createdAt">) {
  if (!db) throw new Error("Firebase not configured");
  await addDoc(collection(db, "recommendations"), {
    ...input,
    title: input.title.trim(),
    author: input.author?.trim() ?? "",
    note: input.note?.trim() ?? "",
    createdAt: serverTimestamp(),
  });
}

export async function deleteRecommendation(id: string) {
  if (!db) throw new Error("Firebase not configured");
  await deleteDoc(doc(db, "recommendations", id));
}

export async function toggleVote(ideaId: string, uid: string, voted: boolean) {
  if (!db) return;
  const ref = doc(db, "ideas", ideaId);
  if (voted) {
    await updateDoc(ref, { [`votes.${uid}`]: 1 });
  } else {
    await updateDoc(ref, { [`votes.${uid}`]: null });
  }
}

export function useMessages(room: ChatRoom) {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "messages"),
      where("room", "==", room),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: data.uid as string,
            authorName: data.authorName as string,
            authorPhoto: (data.authorPhoto as string | null) ?? null,
            authorRole: (data.authorRole as Message["authorRole"]) ?? "member",
            body: data.body as string,
            createdAt: ts(data.createdAt),
          };
        })
      );
      setLoading(false);
    });
    return unsub;
  }, [room]);

  return { items, loading };
}

export async function sendMessage(input: {
  uid: string;
  authorName: string;
  authorPhoto: string | null;
  authorRole: UserRole;
  body: string;
  room: ChatRoom;
}) {
  if (!db) throw new Error("Firebase not configured");
  await addDoc(collection(db, "messages"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}
