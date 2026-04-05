import api from './api';

export const vendorService = {
  // Todos los vendedores (admin)
  getVendors: async (params = {}) => {
    const { data } = await api.get('/vendors', { params });
    return data;
  },

  getVendorById: async (id) => {
    const { data } = await api.get(`/vendors/${id}`);
    return data;
  },

  approveVendor: async (id) => {
    const { data } = await api.put(`/vendors/${id}/approve`);
    return data;
  },

  suspendVendor: async (id, reason) => {
    const { data } = await api.put(`/vendors/${id}/suspend`, { reason });
    return data;
  },

  getVendorStats: async (id) => {
    const { data } = await api.get(`/vendors/${id}/stats`);
    return data;
  },

  registerAsVendor: async (vendorData) => {
    const { data } = await api.post('/vendors/register', vendorData);
    return data;
  }
};