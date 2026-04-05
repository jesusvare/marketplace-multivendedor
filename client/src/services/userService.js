import api from './api';

export const userService = {
  getUsers: async (params = {}) => {
    const { data } = await api.get('/users', { params });
    return data;
  },

  getUserById: async (id) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  updateUser: async (id, userData) => {
    const { data } = await api.put(`/users/${id}`, userData);
    return data;
  },

  deleteUser: async (id) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  updateRole: async (id, role) => {
    const { data } = await api.put(`/users/${id}/role`, { role });
    return data;
  }
};