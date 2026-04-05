const express = require('express');
const router = express.Router();
const {
  createRMA,
  getMyRMAs,
  getAllRMAs,
  getRMAById,
  updateRMAStatus,
  assignRMA,
  escalateRMA
} = require('../controllers/rmaController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Rutas de Devoluciones (RMA)
 * Base: /api/rmas
 */


//EN ESTOS ARCHIVOS ROUTES SE CREA EL ENDOPOINT O DEFINEN QUE URL EXISTEN EJE: '/export' Y ADEMAS A QUE FUNCION DIRIGEN LA PETICION, 
// EN ESTE CASO LAS FUNCIONES SON getAllRMAs..... y las otras 

router.use(protect);

// POST /api/rmas - Crear solicitud (cliente)
router.post('/', authorize('client'), createRMA);

// GET /api/rmas/my-rmas - Mis devoluciones (cliente)
router.get('/my-rmas', authorize('client'), getMyRMAs);

// GET /api/rmas - Todas las devoluciones (soporte/admin)
router.get('/', authorize('support', 'admin'), getAllRMAs);

// GET /api/rmas/:id - Detalle de devolución
router.get('/:id', authorize('client', 'support', 'admin'), getRMAById);

// PUT /api/rmas/:id/status - Cambiar estado (soporte/admin)
router.put('/:id/status', authorize('support', 'admin'), updateRMAStatus);

// PUT /api/rmas/:id/assign - Asignar RMA (soporte/admin)
router.put('/:id/assign', authorize('support', 'admin'), assignRMA);


// PUT /api/rmas/:id/escalate - Escalar RMA (soporte/admin)
router.put('/:id/escalate', authorize('support', 'admin'), escalateRMA);

module.exports = router;