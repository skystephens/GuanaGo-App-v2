import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// Roles con acceso al panel de administración
const ADMIN_ROLES = ['Super_Admin', 'Admin', 'Junior', 'Asesor', 'Socio operador'];

/**
 * Middleware: verifica JWT (sistema legado — usar verifyFirebaseToken para nuevas rutas).
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware: verifica que req.user tenga uno de los roles requeridos.
 * Compatible con verifyFirebaseToken (usa req.user.role).
 *
 * Uso: router.get('/ruta', verifyFirebaseToken, authorizeRole('Super_Admin', 'Admin'), handler)
 */
export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tienes permisos para acceder a este recurso',
        requiredRole: roles,
        yourRole: req.user.role
      });
    }
    next();
  };
};

/**
 * Middleware: verifica que req.user tenga rol de administrador (cualquier nivel).
 * Requiere verifyFirebaseToken antes en la cadena.
 *
 * Uso: router.use(verifyFirebaseToken, requireAdmin)
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Acceso denegado: se requiere rol de administrador',
      yourRole: req.user.role
    });
  }
  next();
};

/**
 * Middleware: verifica acceso a un módulo específico del admin panel.
 * - Super_Admin tiene acceso total sin revisar Accesos_Modulos.
 * - Otros roles admin deben tener el módulo en req.user.accesos.
 * Requiere verifyFirebaseToken antes en la cadena.
 *
 * Uso: router.get('/reservas', verifyFirebaseToken, authorizeModule('Reservas'), handler)
 */
export const authorizeModule = (moduleName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { role, accesos = [] } = req.user;

    // Super_Admin no necesita verificar módulos
    if (role === 'Super_Admin') return next();

    if (!ADMIN_ROLES.includes(role)) {
      return res.status(403).json({
        error: 'Acceso denegado: se requiere rol de administrador',
        yourRole: role
      });
    }

    if (!accesos.includes(moduleName)) {
      return res.status(403).json({
        error: `Sin acceso al módulo: ${moduleName}`,
        yourAccesos: accesos
      });
    }

    next();
  };
};

/**
 * Generar un token JWT (sistema legado).
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};
