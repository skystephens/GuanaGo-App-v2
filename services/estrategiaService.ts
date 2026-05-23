// services/estrategiaService.ts
// Reemplaza el almacenamiento en localStorage de la Torre de Control.
// La data de avance vive ahora en Firestore → compartida, en tiempo real,
// visible para SuperAdmin y Gerente Comercial.
//
// Colección Firestore: "panel_estrategia"
//   Cada documento = una iniciativa estratégica con sus tareas embebidas.

import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completado' | 'bloqueado';
export type Prioridad   = 'critica' | 'alta' | 'media' | 'baja';

export interface TareaEstrategia {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad: Prioridad;
  estado: EstadoTarea;
  responsable?: string;
  fechaVencimiento?: string;
  notas?: string;
}

export interface Iniciativa {
  id: string;
  titulo: string;
  subtitulo?: string;
  centro: 1 | 2 | 3 | 4 | 5;
  color?: string;
  icono?: string;
  tareas: TareaEstrategia[];
  creadaEn?: Timestamp | null;
  actualizadaEn?: Timestamp | null;
}

const COLECCION = 'panel_estrategia';

// ─── Lectura ────────────────────────────────────────────────────────────────

export async function getIniciativas(): Promise<Iniciativa[]> {
  const q = query(collection(db, COLECCION), orderBy('creadaEn', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Iniciativa));
}

export function suscribirIniciativas(
  callback: (iniciativas: Iniciativa[]) => void
): () => void {
  const q = query(collection(db, COLECCION), orderBy('creadaEn', 'asc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Iniciativa)));
  });
}

export async function getIniciativa(id: string): Promise<Iniciativa | null> {
  const ref = doc(db, COLECCION, id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Iniciativa) : null;
}

// ─── Escritura ──────────────────────────────────────────────────────────────

export async function crearIniciativa(
  data: Omit<Iniciativa, 'id' | 'creadaEn' | 'actualizadaEn'>
): Promise<string> {
  const ref = doc(collection(db, COLECCION));
  await setDoc(ref, {
    ...data,
    creadaEn: serverTimestamp(),
    actualizadaEn: serverTimestamp(),
  });
  return ref.id;
}

export async function actualizarIniciativa(
  id: string,
  cambios: Partial<Iniciativa>
): Promise<void> {
  const ref = doc(db, COLECCION, id);
  await updateDoc(ref, { ...cambios, actualizadaEn: serverTimestamp() });
}

export async function eliminarIniciativa(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECCION, id));
}

export async function actualizarTarea(
  iniciativaId: string,
  tareaId: string,
  cambios: Partial<TareaEstrategia>
): Promise<void> {
  const iniciativa = await getIniciativa(iniciativaId);
  if (!iniciativa) throw new Error('Iniciativa no encontrada');
  const tareas = iniciativa.tareas.map(t =>
    t.id === tareaId ? { ...t, ...cambios } : t
  );
  await actualizarIniciativa(iniciativaId, { tareas });
}

// ─── Métricas para el Dashboard ─────────────────────────────────────────────

export interface MetricasEstrategia {
  totalTareas: number;
  completadas: number;
  enProgreso: number;
  bloqueadas: number;
  pendientes: number;
  criticasPendientes: number;
  porcentajeAvance: number;
  avancePorCentro: Record<number, { total: number; completadas: number; pct: number }>;
}

export function calcularMetricas(iniciativas: Iniciativa[]): MetricasEstrategia {
  const todas = iniciativas.flatMap(i =>
    i.tareas.map(t => ({ ...t, centro: i.centro }))
  );
  const total = todas.length;
  const completadas = todas.filter(t => t.estado === 'completado').length;
  const enProgreso  = todas.filter(t => t.estado === 'en_progreso').length;
  const bloqueadas  = todas.filter(t => t.estado === 'bloqueado').length;
  const pendientes  = todas.filter(t => t.estado === 'pendiente').length;
  const criticasPendientes = todas.filter(
    t => t.prioridad === 'critica' && t.estado !== 'completado'
  ).length;

  const avancePorCentro: MetricasEstrategia['avancePorCentro'] = {};
  for (let c = 1; c <= 5; c++) {
    const delCentro = todas.filter(t => t.centro === c);
    const comp = delCentro.filter(t => t.estado === 'completado').length;
    avancePorCentro[c] = {
      total: delCentro.length,
      completadas: comp,
      pct: delCentro.length ? Math.round((comp / delCentro.length) * 100) : 0,
    };
  }

  return {
    totalTareas: total,
    completadas, enProgreso, bloqueadas, pendientes,
    criticasPendientes,
    porcentajeAvance: total ? Math.round((completadas / total) * 100) : 0,
    avancePorCentro,
  };
}

// ─── Migración desde localStorage (ejecutar una sola vez) ───────────────────

export async function migrarDesdeLocalStorage(): Promise<number> {
  const raw = localStorage.getItem('guanago_torre_v3');
  if (!raw) return 0;
  const secciones: any[] = JSON.parse(raw);
  let migradas = 0;
  for (const s of secciones) {
    await crearIniciativa({
      titulo: s.titulo || 'Sin título',
      subtitulo: s.subtitulo || '',
      centro: 5,
      color: s.color || '#14b8a6',
      icono: s.icono || 'Layers',
      tareas: (s.tareas || []).map((t: any) => ({
        id: t.id || crypto.randomUUID(),
        titulo: t.titulo || '',
        descripcion: t.descripcion || '',
        prioridad: t.prioridad || 'media',
        estado: t.estado || 'pendiente',
        fechaVencimiento: t.fechaVencimiento,
        notas: t.notas || '',
      })),
    });
    migradas++;
  }
  return migradas;
}
