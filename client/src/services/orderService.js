import api from "./api";

/**
 * Servicio de órdenes
 * Maneja todas las operaciones relacionadas con órdenes de compra
 */

export const orderService = {
  /**
   * Crear nueva orden (checkout)
   * @param {object} orderData - Datos de la orden
   * @returns {Promise} - Orden creada
   */
  createOrder: async (orderData) => {
    const response = await api.post("/orders", orderData);
    return response.data;
  },

  /**
   * Obtener órdenes del cliente actual
   * @returns {Promise} - Lista de órdenes
   */
  getMyOrders: async () => {
    const response = await api.get("/orders/my-orders");
    return response.data;
  },

  /**
   * Obtener detalle de una orden
   * @param {string} orderId - ID de la orden
   * @returns {Promise} - Detalle de la orden
   */
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Obtener órdenes del vendedor (solo items propios)
   * @returns {Promise} - Órdenes del vendedor
   */
  getVendorOrders: async () => {
    const response = await api.get("/orders/vendor/orders");
    return response.data;
  },

  /**
   * Actualizar estado de items de una orden (vendedor)
   * @param {string} orderId - ID de la orden
   * @param {string} itemId - ID del item
   * @param {string} status - Nuevo estado
   * @returns {Promise} - Orden actualizada
   */
  updateItemStatus: async (orderId, itemId, status) => {
    const response = await api.put(
      `/orders/${orderId}/items/${itemId}/status`,
      { status },
    );
    return response.data;
  },

  getAllOrders: async (params = {}) => {
  const response = await api.get('/orders/all', { params });
  return response.data;
},

  /**
   * Aplicar cupón a una orden
   * @param {string} couponCode - Código del cupón
   * @returns {Promise} - Descuento aplicado
   */
  applyCoupon: async (couponCode, subtotal) => {
    const response = await api.post("/orders/apply-coupon", {
      couponCode,
      subtotal,
    });
    return response.data;
  },
};


