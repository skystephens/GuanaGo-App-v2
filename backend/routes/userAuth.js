import express from 'express';
import { registerUser, loginUser } from '../services/userAuthService.js';

const router = express.Router();

/**
 * POST /api/user-auth/register
 * Registrar nuevo usuario (Turista, Local, Socio)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        error: 'Email, contraseña y tipo de usuario son requeridos'
      });
    }

    const result = await registerUser({ email, password, userType, nombre });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error en /register:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/user-auth/login
 * Iniciar sesión
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    const result = await loginUser({ email, password });
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error en /login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
