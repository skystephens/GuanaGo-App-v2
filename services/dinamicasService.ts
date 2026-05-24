/**
 * GuanaGO — Servicio de Dinámicas B2C
 * Concursos, Embajadores y GuanaPoints
 * Conecta con /api/dinamicas (backend Express)
 */

const BASE = '/api/dinamicas';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Concurso {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  fechaFin: string;
  estado: string;
  imagen: string;
}

export interface Participante {
  id: string;
  nombre: string;
  votos: number;
  imagen: string;
  descripcion: string;
  categoria: string;
}

export interface Embajador {
  id: string;
  nombre: string;
  codigoReferido: string;
  totalReferidos: number;
  referidosActivos: number;
  nivel: string;
  puntos: number;
}

export interface PerfilPuntos {
  id?: string;
  nombre?: string;
  puntos: number;
  ganados: number;
  canjeados: number;
  nivel: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/** Devuelve concursos activos */
export async function getConcursos(): Promise<Concurso[]> {
  try {
    const res = await fetch(`${BASE}/concursos`);
    const data = await res.json();
    return data.concursos ?? [];
  } catch (err) {
    console.error('[dinamicasService] getConcursos:', err);
    return [];
  }
}

/** Devuelve los participantes de un concurso, ordenados por votos */
export async function getParticipantes(concursoId: string): Promise<Participante[]> {
  try {
    const res = await fetch(`${BASE}/concursos/${concursoId}/participantes`);
    const data = await res.json();
    return data.participantes ?? [];
  } catch (err) {
    console.error('[dinamicasService] getParticipantes:', err);
    return [];
  }
}

/** Registra el voto de un usuario. Devuelve { success, error? } */
export async function votar(
  concursoId: string,
  participanteId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}/votar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concursoId, participanteId, userId }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Obtiene el perfil de embajador de un usuario */
export async function getEmbajador(uid: string): Promise<Embajador | null> {
  try {
    const res = await fetch(`${BASE}/embajador/${uid}`);
    const data = await res.json();
    return data.embajador ?? null;
  } catch (err) {
    console.error('[dinamicasService] getEmbajador:', err);
    return null;
  }
}

/** Obtiene el perfil de puntos (GuanaPoints) de un usuario */
export async function getPerfilPuntos(uid: string): Promise<PerfilPuntos> {
  try {
    const res = await fetch(`${BASE}/perfil/${uid}`);
    const data = await res.json();
    return data.perfil ?? { puntos: 0, ganados: 0, canjeados: 0, nivel: 'Bronce' };
  } catch (err) {
    console.error('[dinamicasService] getPerfilPuntos:', err);
    return { puntos: 0, ganados: 0, canjeados: 0, nivel: 'Bronce' };
  }
}
