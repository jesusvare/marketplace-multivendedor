const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Proteger rutas (requiere autenticación)
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Verificar si el token está en los headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar si existe el token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token no proporcionado'
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token (sin incluir password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar si el usuario está activo
      if (req.user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo o suspendido'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

/**
 * Middleware: Autorización por roles
 * @param  {...string} roles - Roles permitidos
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `El rol '${req.user.role}' no tiene permiso para acceder a este recurso`
      });
    }

    next();
  };
};

/**
 * Middleware: Verificar que el vendedor esté aprobado
 */
const requireApprovedVendor = (req, res, next) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Solo vendedores pueden acceder a este recurso'
    });
  }

  if (req.user.vendorInfo.vendorStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Tu cuenta de vendedor debe estar aprobada para realizar esta acción'
    });
  }

  next();
};

module.exports = {
  protect,
  authorize,
  requireApprovedVendor
};