import admin, { firebaseInitialized } from '../firebaseAdmin.js';

/**
 * Middleware: Verifica Firebase ID token y construye req.user desde los Custom Claims.
 *
 * El rol y los accesos viven en los Custom Claims del token (seteados en /api/firebase-auth/verify).
 * Esto evita una llamada a Airtable en cada request protegido.
 *
 * req.user = { firebaseUid, email, nombre, role, accesos }
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
    const decoded = await admin.auth().verifyIdToken(token);

    req.firebaseUser = decoded;

    // Custom Claims seteados en /api/firebase-auth/verify
    req.user = {
      firebaseUid: decoded.uid,
      email: decoded.email || '',
      nombre: decoded.name || decoded.email?.split('@')[0] || '',
      role: decoded.role || 'Turista',       // claim: 'Super_Admin' | 'Aliado' | 'Turista' | ...
      accesos: decoded.accesos || []         // claim: ['Reservas', 'Cotizaciones', ...]
    };

    next();
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error.message);
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
};

/**
 * Middleware opcional: no rechaza si no hay token, pero carga req.user si lo hay.
 * Útil para rutas públicas que también sirven contenido personalizado a usuarios autenticados.
 */
export const optionalFirebaseToken = async (req, res, next) => {
  req.user = null;

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || !firebaseInitialized) return next();

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decoded;
    req.user = {
      firebaseUid: decoded.uid,
      email: decoded.email || '',
      nombre: decoded.name || '',
      role: decoded.role || 'Turista',
      accesos: decoded.accesos || []
    };
  } catch {
    // Token inválido o expirado — continuar como anónimo
  }

  next();
};
