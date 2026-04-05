/**
 * Funciones de formateo comunes
 */

/**
 * Formatear precio en formato de moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (default: USD)
 * @returns {string} - Precio formateado
 */
export const formatPrice = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Formatear fecha
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatear fecha y hora
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha y hora formateadas
 */
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatear número con separadores de miles
 * @param {number} num - Número a formatear
 * @returns {string}
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('es-CR').format(num);
};

/**
 * Truncar texto
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string}
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};