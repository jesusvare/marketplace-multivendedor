const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Rutas de Categorías
 * Base: /api/categories
 */



//EN ESTOS ARCHIVOS ROUTES SE CREA EL ENDOPOINT O DEFINEN QUE URL EXISTEN EJE: '/export' Y ADEMAS A QUE FUNCION DIRIGEN LA PETICION, 
// EN ESTE CASO LAS FUNCIONES SON createCategory..... y las otras 


// GET /api/categories - Obtener todas (público)
router.get('/', getCategories);

// GET /api/categories/:id - Obtener una (público)
router.get('/:id', getCategoryById);

// POST /api/categories - Crear categoría (solo admin)
router.post('/', protect, authorize('admin'), createCategory);

// PUT /api/categories/:id - Actualizar categoría (solo admin)
router.put('/:id', protect, authorize('admin'), updateCategory);

// DELETE /api/categories/:id - Eliminar categoría (solo admin)
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;