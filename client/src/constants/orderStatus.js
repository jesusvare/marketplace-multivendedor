/**
 * Estados posibles de una orden
 */

export const ORDER_STATUS = {
  CREATED: 'created',
  PAID: 'paid',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

/**
 * Estados con sus etiquetas para mostrar en UI
 */
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.CREATED]: 'Creada',
  [ORDER_STATUS.PAID]: 'Pagada',
  [ORDER_STATUS.PACKED]: 'Empacada',
  [ORDER_STATUS.SHIPPED]: 'Enviada',
  [ORDER_STATUS.DELIVERED]: 'Entregada',
  [ORDER_STATUS.CANCELLED]: 'Cancelada'
};

/**
 * Colores para cada estado (para badges)
 */
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.CREATED]: '#94a3b8',
  [ORDER_STATUS.PAID]: '#3b82f6',
  [ORDER_STATUS.PACKED]: '#f59e0b',
  [ORDER_STATUS.SHIPPED]: '#8b5cf6',
  [ORDER_STATUS.DELIVERED]: '#10b981',
  [ORDER_STATUS.CANCELLED]: '#ef4444'
};