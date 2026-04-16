/**
 * GuiaSAI - Firebase Configuration
 *
 * Inicializa Firebase y exporta la instancia de Firestore.
 * Las credenciales se leen desde variables de entorno VITE_FIREBASE_*.
 *
 * Si las variables no están configuradas, Firebase queda deshabilitado
 * y el sistema opera 100% en localStorage (modo offline).
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            (import.meta as any).env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         (import.meta as any).env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             (import.meta as any).env.VITE_FIREBASE_APP_ID             || '',
}

export const isFirebaseConfigured = (): boolean =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let app: FirebaseApp | null = null
let db: Firestore | null = null

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    db = getFirestore(app)
    console.log('🔥 Firebase conectado al proyecto:', firebaseConfig.projectId)
  } catch (error) {
    console.warn('⚠️ Firebase no pudo inicializarse:', error)
    app = null
    db = null
  }
} else {
  console.log('ℹ️ Firebase no configurado — operando en modo offline (localStorage)')
}

export { db }
