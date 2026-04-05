const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
} = require('../controllers/productController');
const {
  protect,
  authorize,
  requireApprovedVendor
} = require('../middleware/authMiddleware');

/**
 * Rutas de Productos
 * Base: /api/products
 */

//EN ESTOS ARCHIVOS ROUTES SE CREA EL ENDOPOINT O DEFINEN QUE URL EXISTEN EJE: '/export' Y ADEMAS A QUE FUNCION DIRIGEN LA PETICION, 
// EN ESTE CASO LAS FUNCIONES SON getProducts..... y las otras 

// GET /api/products - Catálogo público (sin auth)
router.get('/', getProducts);

// GET /api/products/vendor/my-products - Productos del vendedor (auth)
router.get('/vendor/my-products', protect, authorize('vendor'), getMyProducts);

// GET /api/products/:id - Detalle de producto (sin auth)
router.get('/:id', getProductById);

// POST /api/products - Crear producto (solo vendedor aprobado)
router.post('/', protect, authorize('vendor'), requireApprovedVendor, createProduct);

// PUT /api/products/:id - Actualizar producto (vendedor o admin)
router.put('/:id', protect, authorize('vendor', 'admin'), updateProduct);

// DELETE /api/products/:id - Eliminar producto (soft delete)
router.delete('/:id', protect, authorize('vendor', 'admin'), deleteProduct);

module.exports = router;