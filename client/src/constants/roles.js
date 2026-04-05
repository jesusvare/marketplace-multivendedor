/**
 * Roles de usuario en el sistema
 * Utilizados para control de acceso y permisos
 */

export const ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  SUPPORT: 'support',
  CLIENT: 'client'
};

/**
 * Verificar si un usuario tiene un rol específico
 * @param {object} user - Usuario a verificar
 * @param {string} role - Rol requerido
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
  return user?.role === role;
};

/**
 * Verificar si un usuario tiene uno de varios roles
 * @param {object} user - Usuario a verificar
 * @param {array} roles - Array de roles permitidos
 * @returns {boolean}
 */
export const hasAnyRole = (user, roles) => {
  return roles.includes(user?.role);
};