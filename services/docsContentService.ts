// services/docsContentService.ts
// Persiste versiones editadas de los documentos estratégicos en Firestore.
// Colección: "docs_content"  — cada doc = un DocEntry.id (canvas, economico, etc.)

import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DocContent {
  html: string;
  updatedAt?: any;
  updatedBy?: string;
}

export async function loadDocContent(docId: string): Promise<DocContent | null> {
  const ref = doc(db, 'docs_content', docId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as DocContent) : null;
}

export async function saveDocContent(
  docId: string,
  html: string,
  userEmail: string,
): Promise<void> {
  const ref = doc(db, 'docs_content', docId);
  await setDoc(ref, {
    html,
    updatedAt: serverTimestamp(),
    updatedBy: userEmail,
  });
}