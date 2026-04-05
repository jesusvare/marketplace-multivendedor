const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getAuditLogById,
  exportLogs
} = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Rutas de Auditoría
 * Base: /api/audit
 */
//EN ESTOS ARCHIVOS ROUTES SE CREA EL ENDOPOINT O DEFINEN QUE URL EXISTEN EJE: '/export' Y ADEMAS A QUE FUNCION DIRIGEN LA PETICION, 
// EN ESTE CASO LAS FUNCIONES SON getAudiLogs..... y las otras 
router.use(protect);
router.use(authorize('admin'));

// GET /api/audit - Obtener logs con filtros
router.get('/', getAuditLogs);

// GET /api/audit/export - Exportar logs
router.get('/export', exportLogs);

// GET /api/audit/:id - Detalle de log
router.get('/:id', getAuditLogById);

module.exports = router;