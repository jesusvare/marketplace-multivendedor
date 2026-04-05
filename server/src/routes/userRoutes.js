const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateRole
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Rutas de Usuarios
 * Base: /api/users
 */

//EN ESTOS ARCHIVOS ROUTES SE CREA EL ENDOPOINT O DEFINEN QUE URL EXISTEN EJE: '/export' Y ADEMAS A QUE FUNCION DIRIGEN LA PETICION, 
// EN ESTE CASO LAS FUNCIONES SON getUsers..... y las otras 

// GET /api/users - Obtener todos los usuarios (solo admin)
router.get('/', protect, authorize('admin'), getUsers);

// GET /api/users/:id - Obtener usuario por ID (admin)
router.get('/:id', protect, authorize('admin'), getUserById);

// PUT /api/users/:id - Actualizar usuario (admin)
router.put('/:id', protect, authorize('admin'), updateUser);

// DELETE /api/users/:id - Desactivar usuario (admin)
router.delete('/:id', protect, authorize('admin'), deleteUser);

// PUT /api/users/:id/role - Cambiar rol (solo admin)
router.put('/:id/role', protect, authorize('admin'), updateRole);

module.exports = router;