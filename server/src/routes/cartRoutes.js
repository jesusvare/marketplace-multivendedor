const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Rutas del Carrito
 * Base: /api/cart
 */


//EN ESTOS ARCHIVOS ROUTES SE CREA EL ENDOPOINT O DEFINEN QUE URL EXISTEN EJE: '/export' Y ADEMAS A QUE FUNCION DIRIGEN LA PETICION, 
// EN ESTE CASO LAS FUNCIONES SON addCart..... y las otras 


// Todas las rutas del carrito requieren autenticación de cliente
router.use(protect);
router.use(authorize('client'));

// GET /api/cart - Obtener carrito
router.get('/', getCart);

// POST /api/cart/add - Agregar item
router.post('/add', addToCart);

// PUT /api/cart/update - Actualizar cantidad
router.put('/update', updateCartItem);

// DELETE /api/cart/remove/:productId - Eliminar item
router.delete('/remove/:productId', removeFromCart);

// DELETE /api/cart/clear - Vaciar carrito
router.delete('/clear', clearCart);

module.exports = router;