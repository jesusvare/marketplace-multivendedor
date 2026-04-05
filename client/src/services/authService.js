import api from './api';

/**
 * Servicio de autenticación
 * Maneja todas las operaciones relacionadas con autenticación de usuarios
 */

export const authService = {
  /**
   * Iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @returns {Promise} - Datos del usuario y token
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Registrar nuevo usuario
   * @param {object} userData - Datos del usuario (name, email, password, role)
   * @returns {Promise} - Datos del usuario creado y token
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Validar token actual
   * @returns {Promise} - Datos del usuario autenticado
   */
  validateToken: async () => {
    const response = await api.get('/auth/validate');
    return response.data;
  },

  /**
   * Cerrar sesión
   * @returns {Promise}
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Solicitar recuperación de contraseña
   * @param {string} email - Email del usuario
   * @returns {Promise}
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Restablecer contraseña
   * @param {string} token - Token de recuperación
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise}
   */
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }
};