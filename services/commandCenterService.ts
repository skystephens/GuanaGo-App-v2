// Persiste datos editables del Command Center en Firestore.
// Colecciones: command_center (roadmap), estrategia_docs, context_docs

import {
  collection, doc, getDoc, getDocs, setDoc,
  addDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ── Fases del roadmap ─────────────────────────────────────────────────────────

export interface Phase {
  id: string;
  label: string;
  color: string;
  title: string;
  items: string[];
}

export async function loadRoadmapPhases(): Promise<Phase[] | null> {
  const snap = await getDoc(doc(db, 'command_center', 'roadmap'));
  return snap.exists() ? (snap.data().phases as Phase[]) : null;
}

export async function saveRoadmapPhases(phases: Phase[], userEmail: string): Promise<void> {
  await setDoc(doc(db, 'command_center', 'roadmap'), {
    phases,
    updatedAt: serverTimestamp(),
    updatedBy: userEmail,
  });
}

// ── Docs estratégicos extra ───────────────────────────────────────────────────

export interface ExtraDoc {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  url: string;
  color: string;
  emoji: string;
  createdBy?: string;
}

export async function loadExtraDocs(): Promise<ExtraDoc[]> {
  const snap = await getDocs(collection(db, 'estrategia_docs'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ExtraDoc);
}

export async function addExtraDoc(data: Omit<ExtraDoc, 'id'>, userEmail: string): Promise<ExtraDoc> {
  const ref = await addDoc(collection(db, 'estrategia_docs'), {
    ...data, createdBy: userEmail, createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data };
}

export async function deleteExtraDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'estrategia_docs', id));
}

// ── Docs de contexto (tab Docs) ───────────────────────────────────────────────

export interface ContextDoc {
  id: string;
  titulo: string;
  categoria: string;
  contenido: string;
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export async function loadContextDocs(): Promise<ContextDoc[]> {
  const snap = await getDocs(collection(db, 'context_docs'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ContextDoc);
}

export async function saveContextDoc(
  data: Pick<ContextDoc, 'titulo' | 'categoria' | 'contenido'>,
  userEmail: string,
): Promise<ContextDoc> {
  const ref = await addDoc(collection(db, 'context_docs'), {
    ...data, createdBy: userEmail, createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data };
}

export async function updateContextDoc(
  id: string,
  data: Pick<ContextDoc, 'titulo' | 'categoria' | 'contenido'>,
  userEmail: string,
): Promise<void> {
  await setDoc(doc(db, 'context_docs', id), {
    ...data, updatedBy: userEmail, updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteContextDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'context_docs', id));
}
