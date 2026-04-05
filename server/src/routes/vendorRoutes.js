const express = require('express');
const router = express.Router();
const {
  getVendors,
  getVendorById,
  approveVendor,
  suspendVendor,
  getVendorStats,
  registerAsVendor
} = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Rutas de Vendedores
 * Base: /api/vendors
 */
//EN ESTOS ARCHIVOS ROUTES SE CREA EL ENDOPOINT O DEFINEN QUE URL EXISTEN EJE: '/export' Y ADEMAS A QUE FUNCION DIRIGEN LA PETICION, 
// EN ESTE CASO LAS FUNCIONES SON getVendors..... y las otras 
router.use(protect);
 
// POST /api/vendors/register - Registrarse como vendedor
router.post('/register', authorize('client'), registerAsVendor);

// GET /api/vendors - Todos los vendedores (admin)
router.get('/', authorize('admin'), getVendors);

// GET /api/vendors/:id - Detalle del vendedor (admin)
router.get('/:id', authorize('admin'), getVendorById);

// PUT /api/vendors/:id/approve - Aprobar vendedor (admin)
router.put('/:id/approve', authorize('admin'), approveVendor);

// PUT /api/vendors/:id/suspend - Suspender vendedor (admin)
router.put('/:id/suspend', authorize('admin'), suspendVendor);
 
// GET /api/vendors/:id/stats - Estadísticas del vendedor (admin/vendedor)
router.get('/:id/stats', authorize('admin', 'vendor'), getVendorStats);

module.exports = router;