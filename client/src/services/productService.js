import api from './api';

/**
 * Servicio de productos
 * Maneja todas las operaciones relacionadas con productos
 */

export const productService = {
  /**
   * Obtener todos los productos (catálogo público)
   * @param {object} filters - Filtros de búsqueda
   * @returns {Promise} - Lista de productos
   */
  getProducts: async (filters = {}) => {
    // Eliminar campos vacíos, null, undefined y boolean false antes de serializar
    const clean = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false)
    );
    const response = await api.get('/products', { params: clean });
    return response.data;
  },
  /**
   * Obtener producto por ID
   * @param {string} id - ID del producto
   * @returns {Promise} - Datos del producto
   */
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Buscar productos
   * @param {string} query - Término de búsqueda
   * @returns {Promise} - Productos encontrados
   */
  searchProducts: async (query) => {
    const response = await api.get(`/products/search?q=${query}`);
    return response.data;
  },

  /**
   * Crear producto (solo vendedores)
   * @param {object} productData - Datos del producto
   * @returns {Promise} - Producto creado
   */
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  /**
   * Actualizar producto
   * @param {string} id - ID del producto
   * @param {object} productData - Datos actualizados
   * @returns {Promise} - Producto actualizado
   */
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  /**
   * Eliminar producto (soft delete)
   * @param {string} id - ID del producto
   * @returns {Promise}
   */
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Obtener productos del vendedor actual
   * @returns {Promise} - Productos del vendedor
   */
  getMyProducts: async () => {
    const response = await api.get('/products/vendor/my-products');
    return response.data;
  }
};