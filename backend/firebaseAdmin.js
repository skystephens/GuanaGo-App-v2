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
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log('✅ Firebase Admin initialized');
  }
} catch (e) {
  console.warn('⚠️ Firebase service account not found at:', serviceAccountPath);
  console.warn('   Firebase auth verification will be disabled.');
}

export const firebaseInitialized = initialized || admin.apps.length > 0;
export default admin;
