import { makeRequest, registrarLogTrazabilidad } from '../utils/helpers.js';
import { config } from '../config.js';
import { generateToken } from '../middleware/auth.js';

/**
 * Login de usuario
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    const result = await makeRequest(
      config.makeWebhooks.users,
      {
        action: 'login',
        email,
        password
      },
      'USER_LOGIN'
    );

    if (!result.user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const token = generateToken(result.user);

    res.json({
      success: true,
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registro de nuevo usuario
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name, phone, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, contraseña y nombre son requeridos'
      });
    }

    const result = await makeRequest(
      config.makeWebhooks.users,
      {
        action: 'register',
        email,
        password,
        name,
        phone,
        role: role || 'tourist'
      },
      'USER_REGISTER'
    );

    const token = generateToken(result.user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener perfil del usuario autenticado
 */
export const getProfile = async (req, res, next) => {
  try {
    const result = await makeRequest(
      config.makeWebhooks.users,
      {
        action: 'login',
        email,
        password
      },
      'USER_LOGIN'
    );

    if (!result.user) {
      // Registrar intento fallido
      await registrarLogTrazabilidad({
        tipo: 'login_fallido',
        usuarioId: email,
        descripcion: 'Intento de login fallido',
        extra: { email }
      });
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const token = generateToken(result.user);

    // Registrar login exitoso
    await registrarLogTrazabilidad({
      tipo: 'login_exitoso',
      usuarioId: result.user.id || email,
      descripcion: 'Login exitoso',
      extra: { user: result.user }
    });

    res.json({
      success: true,
      token,
      user: result.user
    });
    
    const result = await makeRequest(
      config.makeWebhooks.users,
      {
        action: 'updateProfile',
        userId: req.user.id,
        updates
      },
      'UPDATE_USER_PROFILE'
    );

    res.json({
      success: true,
      data: result.user,
      message: 'Perfil actualizado'
    });
  } catch (error) {
    next(error);
  }
};
