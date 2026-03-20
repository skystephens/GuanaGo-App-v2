import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '..', 'guanago2026-firebase-adminsdk-fbsvc-f8628722a1.json');

let initialized = false;

try {
  if (!admin.apps.length) {
    let serviceAccount;

    // Opción 1: JSON completo en variable de entorno (producción/Render)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log('✅ Firebase Admin: usando FIREBASE_SERVICE_ACCOUNT_JSON (env var)');
    } else {
      // Opción 2: archivo local (desarrollo)
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      console.log('✅ Firebase Admin: usando archivo local');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`,
    });
    initialized = true;
    console.log('✅ Firebase Admin initialized');
  }
} catch (e) {
  console.warn('⚠️ Firebase Admin no inicializado:', e.message);
  console.warn('   Configura FIREBASE_SERVICE_ACCOUNT_JSON en Render o el archivo JSON local.');
}

export const firebaseInitialized = initialized || admin.apps.length > 0;
export default admin;
