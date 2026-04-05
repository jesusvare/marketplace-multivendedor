const mongoose = require('mongoose');

/**
 * Schema de Log de Auditoría
 * Registra todas las acciones críticas del sistema
 */
const auditLogSchema = new mongoose.Schema({
  // Usuario que realizó la acción
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  userEmail: {
    type: String,
    required: true
  },
  
  userName: {
    type: String,
    required: true
  },
  
  userRole: {
    type: String,
    required: true
  },
  
  // Acción realizada
  action: {
    type: String,
    enum: [
      'create',
      'update',
      'delete',
      'approve',
      'reject',
      'suspend',
      'activate',
      'status_change',
      'use_coupon',
      'login',
      'logout',
      'password_change',
      'permission_change'
    ],
    required: true
  },
  
  // Entidad afectada
  entity: {
    type: String,
    enum: [
      'user',
      'vendor',
      'product',
      'category',
      'order',
      'ticket',
      'rma',
      'coupon',
      'cart'
    ],
    required: true
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // Descripción legible de la acción
  description: {
    type: String,
    required: true
  },
  
  // Detalles adicionales (datos antes/después, etc.)
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Información de la petición
  ipAddress: {
    type: String
  },
  
  userAgent: {
    type: String
  },
  
  // Severidad (para filtrado)
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Resultado de la acción
  success: {
    type: Boolean,
    default: true
  },
  
  errorMessage: {
    type: String
  }
  
}, {
  timestamps: true // Solo createdAt es relevante
});

/**
 * Método estático: Crear log de auditoría
 */
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error al crear log de auditoría:', error);
    // No lanzar error para no interrumpir la operación principal
  }
};

/**
 * Índices para búsquedas eficientes
 */
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;