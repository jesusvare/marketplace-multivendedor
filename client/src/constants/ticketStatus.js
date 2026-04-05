/**
 * Estados de tickets de soporte
 */

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_CUSTOMER: 'waiting_customer',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

/**
 * Etiquetas de estados
 */
export const TICKET_STATUS_LABELS = {
  [TICKET_STATUS.OPEN]: 'Abierto',
  [TICKET_STATUS.IN_PROGRESS]: 'En Progreso',
  [TICKET_STATUS.WAITING_CUSTOMER]: 'Esperando Cliente',
  [TICKET_STATUS.RESOLVED]: 'Resuelto',
  [TICKET_STATUS.CLOSED]: 'Cerrado'
};

/**
 * Estados de RMA (devoluciones)
 */
export const RMA_STATUS = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RECEIVED: 'received',
  REFUNDED: 'refunded'
};

/**
 * Etiquetas de estados RMA
 */
export const RMA_STATUS_LABELS = {
  [RMA_STATUS.REQUESTED]: 'Solicitada',
  [RMA_STATUS.APPROVED]: 'Aprobada',
  [RMA_STATUS.REJECTED]: 'Rechazada',
  [RMA_STATUS.RECEIVED]: 'Recibida',
  [RMA_STATUS.REFUNDED]: 'Reembolsada'
};