import admin, { firebaseInitialized } from '../firebaseAdmin.js';

/**
 * Middleware: Verify Firebase ID token
 * Attaches decoded user info to req.firebaseUser
 */
export const verifyFirebaseToken = async (req, res, next) => {
  if (!firebaseInitialized) {
    return res.status(503).json({ success: false, error: 'Firebase no configurado en el servidor' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token no proporcionado' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error.message);
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
};
