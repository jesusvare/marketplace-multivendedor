const express = require('express');
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  addMessage,
  updateStatus,
  assignTicket,
  escalateTicket
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Rutas de Tickets de Soporte
 * Base: /api/tickets
 */

//EN ESTOS ARCHIVOS ROUTES SE CREA EL ENDOPOINT O DEFINEN QUE URL EXISTEN EJE: '/export' Y ADEMAS A QUE FUNCION DIRIGEN LA PETICION, 
// EN ESTE CASO LAS FUNCIONES SON creteMyTickets..... y las otras 


router.use(protect);

// POST /api/tickets - Crear ticket (cliente)
router.post('/', authorize('client'), createTicket);

// GET /api/tickets/my-tickets - Mis tickets (cliente)
router.get('/my-tickets', authorize('client'), getMyTickets);

// GET /api/tickets - Todos los tickets (soporte/admin)
router.get('/', authorize('support', 'admin'), getAllTickets);

// GET /api/tickets/:id - Detalle del ticket
router.get('/:id', authorize('client', 'support', 'admin'), getTicketById);

// POST /api/tickets/:id/messages - Agregar mensaje
router.post('/:id/messages', authorize('client', 'support', 'admin'), addMessage);

// PUT /api/tickets/:id/status - Cambiar estado (soporte/admin)
router.put('/:id/status', authorize('support', 'admin'), updateStatus);

// PUT /api/tickets/:id/assign - Asignarse ticket (soporte/admin)
router.put('/:id/assign', authorize('support', 'admin'), assignTicket);

// PUT /api/tickets/:id/escalate - Escalar ticket (soporte/admin)
router.put('/:id/escalate', authorize('support', 'admin'), escalateTicket);

module.exports = router;