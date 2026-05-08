import express from 'express';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';
import { findOrCreateLeadUser } from '../services/firebaseUserService.js';
import { loginUser } from '../services/userAuthService.js';
import admin, { firebaseInitialized } from '../firebaseAdmin.js';

const router = express.Router();

/**
 * POST /api/firebase-auth/verify
 *
 * Llamado despues de que Firebase autentica al usuario en el frontend.
 * Verifica el token, busca/crea usuario en Airtable, retorna perfil.
 *
 * Header: Authorization: Bearer <firebase-id-token>
 * Body: { userType?: 'turista' | 'local' | 'socio' }
 */
router.post('/verify', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.firebaseUser;
    const { userType } = req.body;

    console.log(`🔥 Firebase verify: ${email} (${uid}) tipo: ${userType || 'turista'}`);

    const result = await findOrCreateLeadUser({
      firebaseUid: uid,
      email,
      nombre: name || email.split('@')[0],
      photoUrl: picture,
      userType: userType || 'turista',
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Setear Custom Claims: role + accesos quedan embebidos en el ID token.
    // verifyFirebaseToken los leerá en requests futuros sin consultar Airtable.
    if (firebaseInitialized && result.user?.role) {
      try {
        await admin.auth().setCustomUserClaims(uid, {
          role: result.user.role,
          accesos: result.user.accesos || []
        });
        console.log(`✅ Custom claims seteados [role=${result.user.role}, accesos=${result.user.accesos?.length || 0}] → ${email}`);
      } catch (claimErr) {
        console.warn('⚠️ No se pudo setear custom claims:', claimErr.message);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error en /firebase-auth/verify:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/firebase-auth/profile
 *
 * Obtener perfil Airtable del usuario autenticado con Firebase
 */
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name } = req.firebaseUser;

    const result = await findOrCreateLeadUser({
      firebaseUid: uid,
      email,
      nombre: name || email.split('@')[0],
      userType: 'turista',
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Error en /firebase-auth/profile:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

/**
 * POST /api/firebase-auth/migrate-login
 *
 * Migracion lazy: usuarios existentes en Airtable que aun no estan en Firebase.
 * 1. Valida credenciales vs Airtable (loginUser existente)
 * 2. Crea usuario en Firebase si no existe
 * 3. Retorna customToken para signInWithCustomToken en frontend
 *
 * Body: { email, password }
 */
router.post('/migrate-login', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(503).json({ success: false, error: 'Firebase no configurado' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
    }

    // 1. Validar contra Airtable/LOCAL_USERS
    const airtableResult = await loginUser({ email, password });
    if (!airtableResult.success) {
      return res.status(401).json(airtableResult);
    }

    // 2. Buscar o crear usuario en Firebase
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
      console.log('✅ Usuario Firebase existente:', firebaseUser.uid);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        firebaseUser = await admin.auth().createUser({
          email,
          password,
          displayName: airtableResult.user.nombre || email.split('@')[0],
        });
        console.log('✅ Usuario Firebase creado:', firebaseUser.uid);
      } else {
        throw err;
      }
    }

    // 3. Asignar Custom Claims según rol Airtable
    if (airtableResult.user?.role) {
      try {
        await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: airtableResult.user.role });
        console.log(`✅ Custom claim [role=${airtableResult.user.role}] asignado en migrate-login`);
      } catch (claimErr) {
        console.warn('⚠️ Custom claim migrate error:', claimErr.message);
      }
    }

    // 4. Crear custom token para que el frontend establezca sesion Firebase
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

    res.json({
      success: true,
      customToken,
      user: airtableResult.user,
    });
  } catch (error) {
    console.error('❌ Error en /firebase-auth/migrate-login:', error);
    res.status(500).json({ success: false, error: 'Error al migrar usuario' });
  }
});

export default router;
