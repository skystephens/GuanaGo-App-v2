/**
 * firestoreService.js — GuanaGO
 * CRUD centralizado para Firebase Firestore.
 * Si Firebase no está inicializado, falla silenciosamente.
 */
import admin, { firebaseInitialized } from '../firebaseAdmin.js';

const db = () => (firebaseInitialized ? admin.firestore() : null);
const ts = () => admin.firestore.FieldValue.serverTimestamp();

// ─── Conversaciones del Agente IA ────────────────────────────────────────────

export async function saveMessage(userId, conversationId, message) {
  const firestore = db();
  if (!firestore) return;
  try {
    await firestore
      .collection('conversations')
      .doc(userId || 'anonymous')
      .collection('sessions')
      .doc(conversationId)
      .collection('messages')
      .add({ ...message, timestamp: ts() });
  } catch (e) {
    console.warn('Firestore saveMessage:', e.message);
  }
}

export async function getConversation(userId, conversationId) {
  const firestore = db();
  if (!firestore) return [];
  try {
    const snap = await firestore
      .collection('conversations')
      .doc(userId || 'anonymous')
      .collection('sessions')
      .doc(conversationId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(50)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

// ─── Cotizaciones ─────────────────────────────────────────────────────────────

export async function saveCotizacion(cotizacion) {
  const firestore = db();
  if (!firestore) return null;
  try {
    const id = cotizacion.id || `QT-${Date.now()}`;
    await firestore.collection('cotizaciones').doc(id).set({
      ...cotizacion,
      createdAt: ts(),
      updatedAt: ts(),
      status: cotizacion.status || 'draft',
    });
    return id;
  } catch (e) {
    console.warn('Firestore saveCotizacion:', e.message);
    return null;
  }
}

export async function updateCotizacionStatus(id, status, notes = '') {
  const firestore = db();
  if (!firestore) return;
  try {
    await firestore.collection('cotizaciones').doc(id).update({ status, notes, updatedAt: ts() });
  } catch (e) {
    console.warn('Firestore updateCotizacion:', e.message);
  }
}

export async function getCotizaciones(userId) {
  const firestore = db();
  if (!firestore) return [];
  try {
    let q = firestore.collection('cotizaciones').orderBy('createdAt', 'desc').limit(30);
    if (userId) q = q.where('userId', '==', userId);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

// ─── Reservas ─────────────────────────────────────────────────────────────────

export async function saveReservation(reservation) {
  const firestore = db();
  if (!firestore) return null;
  try {
    const id = reservation.id || `RES-${Date.now()}`;
    await firestore.collection('reservas').doc(id).set({
      ...reservation,
      createdAt: ts(),
      status: reservation.status || 'pending',
    });
    return id;
  } catch (e) {
    console.warn('Firestore saveReservation:', e.message);
    return null;
  }
}

export async function updateReservationStatus(id, status) {
  const firestore = db();
  if (!firestore) return;
  try {
    await firestore.collection('reservas').doc(id).update({ status, updatedAt: ts() });
  } catch (e) {
    console.warn('Firestore updateReservation:', e.message);
  }
}

export async function getReservations(userId) {
  const firestore = db();
  if (!firestore) return [];
  try {
    let q = firestore.collection('reservas').orderBy('createdAt', 'desc').limit(30);
    if (userId) q = q.where('userId', '==', userId);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

// ─── Catálogo (sync desde Airtable) ──────────────────────────────────────────

export async function upsertCatalogItem(collection, id, data) {
  const firestore = db();
  if (!firestore) return;
  try {
    await firestore
      .collection('catalogo')
      .doc(collection)
      .collection('items')
      .doc(id)
      .set({ ...data, syncedAt: ts() }, { merge: true });
  } catch (e) {
    console.warn('Firestore upsertCatalog:', e.message);
  }
}

export async function getCatalogItems(collection, limit = 50) {
  const firestore = db();
  if (!firestore) return [];
  try {
    const snap = await firestore
      .collection('catalogo')
      .doc(collection)
      .collection('items')
      .limit(limit)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

// ─── Torre de Control (tareas sync) ──────────────────────────────────────────

export async function saveTorreTask(task) {
  const firestore = db();
  if (!firestore) return null;
  try {
    const id = task.id || `task-${Date.now()}`;
    await firestore.collection('torre_control').doc(id).set(
      { ...task, updatedAt: ts() },
      { merge: true }
    );
    return id;
  } catch (e) {
    console.warn('Firestore saveTorreTask:', e.message);
    return null;
  }
}

export async function getTorreTasks(filter = {}) {
  const firestore = db();
  if (!firestore) return [];
  try {
    let q = firestore.collection('torre_control').limit(100);
    if (filter.estado) q = q.where('estado', '==', filter.estado);
    if (filter.prioridad) q = q.where('prioridad', '==', filter.prioridad);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function logEvent(eventName, data = {}) {
  const firestore = db();
  if (!firestore) return;
  const dateStr = new Date().toISOString().slice(0, 10);
  try {
    await firestore
      .collection('analytics')
      .doc(dateStr)
      .collection('events')
      .add({ event: eventName, ...data, timestamp: ts() });
  } catch { /* silent */ }
}

export async function getAnalyticsSummary(dateStr) {
  const firestore = db();
  if (!firestore) return { total: 0, byEvent: {}, events: [] };
  try {
    const snap = await firestore
      .collection('analytics')
      .doc(dateStr || new Date().toISOString().slice(0, 10))
      .collection('events')
      .orderBy('timestamp', 'desc')
      .limit(200)
      .get();
    const events = snap.docs.map(d => d.data());
    const byEvent = events.reduce((acc, e) => {
      acc[e.event] = (acc[e.event] || 0) + 1;
      return acc;
    }, {});
    return { total: events.length, byEvent, events };
  } catch (e) {
    return { total: 0, byEvent: {}, events: [] };
  }
}
