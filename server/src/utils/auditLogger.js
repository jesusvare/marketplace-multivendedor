const AuditLog = require('../models/AuditLog');

/**
 * Registrar acción en el log de auditoría
 * @param {Object} logData - Datos del log
 */
const logAudit = async (logData) => {
  try {
    await AuditLog.createLog(logData);
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};

/**
 * Helper para crear logs desde controladores
 */
const createAuditLog = (user, action, entity, entityId, description, details = {}) => {
  return {
    user: user._id,
    userEmail: user.email,
    userName: user.name,
    userRole: user.role,
    action,
    entity,
    entityId,
    description,
    details
  };
};

module.exports = {
  logAudit,
  createAuditLog
};