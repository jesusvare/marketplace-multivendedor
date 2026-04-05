const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getVendorOrders,
  updateItemStatus,
  getAllOrders,
  applyCoupon
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Rutas de Órdenes
 * Base: /api/orders
 */

//EN ESTOS ARCHIVOS ROUTES SE CREA EL ENDOPOINT O DEFINEN QUE URL EXISTEN EJE: '/export' Y ADEMAS A QUE FUNCION DIRIGEN LA PETICION, 
// EN ESTE CASO LAS FUNCIONES SON createOrder..... y las otras 


// Todas requieren autenticación
router.use(protect);

// POST /api/orders - Crear orden (cliente)
router.post('/', authorize('client'), createOrder);

// POST /api/orders/apply-coupon - Aplicar cupón (cliente)
router.post('/apply-coupon', authorize('client'), applyCoupon);

// GET /api/orders/my-orders - Órdenes del cliente
router.get('/my-orders', authorize('client'), getMyOrders);

// GET /api/orders/vendor/orders - Órdenes del vendedor
router.get('/vendor/orders', authorize('vendor'), getVendorOrders);

// GET /api/orders/all - Todas las órdenes (admin)
router.get('/all', authorize('admin'), getAllOrders);

// GET /api/orders/:id - Detalle de orden
router.get('/:id', authorize('client', 'vendor', 'admin', 'support'), getOrderById);

// PUT /api/orders/:orderId/items/:itemId/status - Actualizar estado item (vendedor)
router.put(
  '/:orderId/items/:itemId/status',
  authorize('vendor', 'admin'),
  updateItemStatus
);

module.exports = router;