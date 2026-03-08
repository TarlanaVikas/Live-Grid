import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { DocumentMeta, CellData, UserPresence } from "./types";

const DOCS = "documents";
const CELLS = "cells";
const PRESENCE = "presence";

export function documentsRef() {
  return collection(db, DOCS);
}

export function documentRef(id: string) {
  return doc(db, DOCS, id);
}

export function cellsRef(docId: string) {
  return collection(db, DOCS, docId, CELLS);
}

export function cellRef(docId: string, cellKey: string) {
  return doc(db, DOCS, docId, CELLS, cellKey);
}

export function presenceRef(docId: string) {
  return collection(db, DOCS, docId, PRESENCE);
}

export function userPresenceRef(docId: string, userId: string) {
  return doc(db, DOCS, docId, PRESENCE, userId);
}

export async function createDocument(
  id: string,
  title: string,
  ownerId: string,
  ownerName: string
): Promise<void> {
  await setDoc(documentRef(id), {
    title,
    ownerId,
    ownerName,
    lastModified: serverTimestamp(),
  });
}

export async function updateDocumentTitle(id: string, title: string): Promise<void> {
  await updateDoc(documentRef(id), {
    title,
    lastModified: serverTimestamp(),
  });
}

export async function deleteDocument(id: string): Promise<void> {
  const batch = writeBatch(db);
  
  // Delete all cells in the document
  const cellsSnap = await getDocs(cellsRef(id));
  cellsSnap.docs.forEach((cellDoc) => {
    batch.delete(cellDoc.ref);
  });
  
  // Delete all presence records
  const presenceSnap = await getDocs(presenceRef(id));
  presenceSnap.docs.forEach((presenceDoc) => {
    batch.delete(presenceDoc.ref);
  });
  
  // Delete the document itself
  batch.delete(documentRef(id));
  
  await batch.commit();
}

export async function getDocument(id: string): Promise<DocumentMeta | null> {
  const snap = await getDoc(documentRef(id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    title: d.title ?? "Untitled",
    lastModified: d.lastModified?.toMillis?.() ?? Date.now(),
    ownerId: d.ownerId ?? "",
    ownerName: d.ownerName ?? "",
  };
}

export async function listDocuments(): Promise<DocumentMeta[]> {
  const snap = await getDocs(documentsRef());
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? "Untitled",
      lastModified: data.lastModified?.toMillis?.() ?? Date.now(),
      ownerId: data.ownerId ?? "",
      ownerName: data.ownerName ?? "",
    };
  });
}

export function cellKey(col: number, row: number): string {
  return `${col}_${row}`;
}

export async function setCell(
  docId: string,
  col: number,
  row: number,
  value: string,
  formula?: string,
  format?: any
): Promise<void> {
  const key = cellKey(col, row);
  const data: CellData = { value };
  if (formula) data.formula = formula;
  if (format) data.format = format;
  await setDoc(cellRef(docId, key), data);
  await updateDoc(documentRef(docId), { lastModified: serverTimestamp() });
}

export async function setCellsBatch(
  docId: string,
  updates: Array<{ col: number; row: number; value: string; formula?: string; format?: any }>
): Promise<void> {
  const batch = writeBatch(db);
  for (const u of updates) {
    const key = cellKey(u.col, u.row);
    const data: CellData = { value: u.value };
    if (u.formula) data.formula = u.formula;
    if (u.format) data.format = u.format;
    batch.set(cellRef(docId, key), data);
  }
  batch.update(documentRef(docId), { lastModified: serverTimestamp() });
  await batch.commit();
}

export function subscribeToCells(
  docId: string,
  callback: (cells: Map<string, CellData>) => void
): Unsubscribe {
  return onSnapshot(cellsRef(docId), (snap) => {
    const map = new Map<string, CellData>();
    snap.docs.forEach((d) => {
      const data = d.data();
      map.set(d.id, {
        value: data.value ?? "",
        formula: data.formula,
        format: data.format,
      });
    });
    callback(map);
  });
}

export function subscribeToDocument(
  docId: string,
  callback: (meta: DocumentMeta | null) => void
): Unsubscribe {
  return onSnapshot(documentRef(docId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const d = snap.data();
    callback({
      id: snap.id,
      title: d.title ?? "Untitled",
      lastModified: d.lastModified?.toMillis?.() ?? Date.now(),
      ownerId: d.ownerId ?? "",
      ownerName: d.ownerName ?? "",
    });
  });
}

export async function updatePresence(
  docId: string,
  userId: string,
  displayName: string,
  color: string
): Promise<void> {
  await setDoc(userPresenceRef(docId, userId), {
    userId,
    displayName,
    color,
    lastSeen: serverTimestamp(),
  });
}

export function subscribeToPresence(
  docId: string,
  callback: (users: UserPresence[]) => void
): Unsubscribe {
  return onSnapshot(presenceRef(docId), (snap) => {
    const now = Date.now();
    const stale = 30_000; // 30s
    const users = snap.docs
      .map((d) => {
        const data = d.data();
        const lastSeen = data.lastSeen?.toMillis?.() ?? 0;
        return {
          userId: data.userId ?? d.id,
          displayName: data.displayName ?? "Anonymous",
          color: data.color ?? "#666",
          lastSeen,
        };
      })
      .filter((u) => now - u.lastSeen < stale)
      .sort((a, b) => b.lastSeen - a.lastSeen);
    callback(users);
  });
}
