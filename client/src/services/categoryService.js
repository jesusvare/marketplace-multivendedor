import api from './api';

export const categoryService = {
  getCategories: async (params = {}) => {
    const { data } = await api.get('/categories', { params });
    return data;
  },

  getCategoryById: async (id) => {
    const { data } = await api.get(`/categories/${id}`);
    return data;
  },

  createCategory: async (categoryData) => {
    const { data } = await api.post('/categories', categoryData);
    return data;
  },

  updateCategory: async (id, categoryData) => {
    const { data } = await api.put(`/categories/${id}`, categoryData);
    return data;
  },

  deleteCategory: async (id) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  }
};