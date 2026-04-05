/**
 * Funciones de validación
 */

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar contraseña
 * @param {string} password - Contraseña a validar
 * @returns {object} - { valid: boolean, errors: array }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validar número de teléfono (Costa Rica)
 * @param {string} phone - Teléfono a validar
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Validar que un campo no esté vacío
 * @param {string} value - Valor a validar
 * @returns {boolean}
 */
export const isRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};