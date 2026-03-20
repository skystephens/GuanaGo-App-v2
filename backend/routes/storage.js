/**
 * routes/storage.js — GuanaGO Firebase Storage
 *
 * POST /api/storage/servicios/:airtableId/principal  → sube imagen principal
 * POST /api/storage/servicios/:airtableId/galeria    → sube imagen a galería
 * DELETE /api/storage/servicios/:airtableId/:filename → elimina imagen
 *
 * El Admin SDK bypasea las Storage Rules, así que la autorización
 * la controla el middleware verifyFirebaseToken + check de rol.
 */
import express from 'express';
import multer from 'multer';
import admin, { firebaseInitialized } from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';

const router = express.Router();

// Multer en memoria (no escribe a disco, va directo a Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
});

// Helper para construir la URL pública de Firebase Storage
function buildPublicUrl(bucket, filePath) {
  const encoded = encodeURIComponent(filePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
}

// ─── Middleware de autorización ───────────────────────────────────────────────
// Solo admin y SuperAdmin pueden subir imágenes
function requireAdmin(req, res, next) {
  const role = req.firebaseUser?.token?.role || req.firebaseUser?.role;
  if (role !== 'admin' && role !== 'SuperAdmin') {
    return res.status(403).json({ success: false, error: 'Acceso denegado: se requiere rol admin' });
  }
  next();
}

// ─── POST /api/storage/servicios/:airtableId/principal ───────────────────────
router.post(
  '/servicios/:airtableId/principal',
  verifyFirebaseToken,
  requireAdmin,
  upload.single('image'),
  async (req, res) => {
    if (!firebaseInitialized) {
      return res.status(503).json({ success: false, error: 'Firebase Storage no configurado' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se proporcionó imagen' });
    }

    try {
      const { airtableId } = req.params;
      const ext = req.file.mimetype.split('/')[1] || 'jpg';
      const filePath = `servicios/${airtableId}/principal.${ext}`;

      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: { cacheControl: 'public, max-age=31536000' },
      });

      // Hacer pública la imagen
      await file.makePublic();

      const url = buildPublicUrl(bucket.name, filePath);
      res.json({ success: true, url, path: filePath });
    } catch (error) {
      console.error('Storage upload error:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ─── POST /api/storage/servicios/:airtableId/galeria ─────────────────────────
router.post(
  '/servicios/:airtableId/galeria',
  verifyFirebaseToken,
  requireAdmin,
  upload.single('image'),
  async (req, res) => {
    if (!firebaseInitialized) {
      return res.status(503).json({ success: false, error: 'Firebase Storage no configurado' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se proporcionó imagen' });
    }

    try {
      const { airtableId } = req.params;
      const timestamp = Date.now();
      const ext = req.file.mimetype.split('/')[1] || 'jpg';
      const filePath = `servicios/${airtableId}/galeria/${timestamp}.${ext}`;

      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: { cacheControl: 'public, max-age=31536000' },
      });

      await file.makePublic();

      const url = buildPublicUrl(bucket.name, filePath);
      res.json({ success: true, url, path: filePath });
    } catch (error) {
      console.error('Storage galeria upload error:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ─── DELETE /api/storage/servicios/:airtableId/:filename ─────────────────────
router.delete(
  '/servicios/:airtableId/:filename',
  verifyFirebaseToken,
  requireAdmin,
  async (req, res) => {
    if (!firebaseInitialized) {
      return res.status(503).json({ success: false, error: 'Firebase Storage no configurado' });
    }

    try {
      const { airtableId, filename } = req.params;
      const filePath = `servicios/${airtableId}/${filename}`;

      const bucket = admin.storage().bucket();
      await bucket.file(filePath).delete();

      res.json({ success: true, deleted: filePath });
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
