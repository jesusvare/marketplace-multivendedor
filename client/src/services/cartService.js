import api from './api';

/**
 * Servicio del carrito de compras
 * Maneja todas las operaciones del carrito
 */

export const cartService = {
  /**
   * Obtener carrito del usuario actual
   * @returns {Promise} - Carrito con items
   */
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  /**
   * Agregar item al carrito
   * @param {string} productId - ID del producto
   * @param {number} quantity - Cantidad a agregar
   * @returns {Promise} - Carrito actualizado
   */
  addItem: async (productId, quantity) => {
    const response = await api.post('/cart/add', { productId, quantity });
    return response.data;
  },

  /**
   * Actualizar cantidad de un item
   * @param {string} productId - ID del producto
   * @param {number} quantity - Nueva cantidad
   * @returns {Promise} - Carrito actualizado
   */
  updateQuantity: async (productId, quantity) => {
    const response = await api.put('/cart/update', { productId, quantity });
    return response.data;
  },

  /**
   * Eliminar item del carrito
   * @param {string} productId - ID del producto
   * @returns {Promise} - Carrito actualizado
   */
  removeItem: async (productId) => {
    const response = await api.delete(`/cart/remove/${productId}`);
    return response.data;
  },

  /**
   * Vaciar carrito completamente
   * @returns {Promise}
   */
  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  }
};