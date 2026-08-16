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
import type { ChatRoom, Idea, Meeting, Message, RsvpStatus, UserRole } from "./types";

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
}) {
  if (!db) throw new Error("Firebase not configured");
  await addDoc(collection(db, "ideas"), {
    ...input,
    createdAt: serverTimestamp(),
    votes: {},
  });
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
