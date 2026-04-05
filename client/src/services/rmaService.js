import api from './api';

export const rmaService = {
  // Crear solicitud de devolución
  createRMA: async (rmaData) => {
    const { data } = await api.post('/rmas', rmaData);
    return data;
  },
 
  // Mis RMAs (cliente)
  getMyRMAs: async () => {
    const { data } = await api.get('/rmas/my-rmas');
    return data;
  },

  // Todos los RMAs (soporte/admin)
  getAllRMAs: async (filters = {}) => {
    const { data } = await api.get('/rmas', { params: filters });
    return data;
  },

  // Detalle de RMA
  getRMAById: async (id) => {
    const { data } = await api.get(`/rmas/${id}`);
    return data;
  },

  // Actualizar estado
  updateStatus: async (id, status, notes) => {
    const { data } = await api.put(`/rmas/${id}/status`, { status, notes });
    return data;
  },

  // Asignar RMA
  assignRMA: async (id) => {
    const { data } = await api.put(`/rmas/${id}/assign`);
    return data;
  },

  // Escalar RMA
escalateRMA: async (id, escalateTo, reason) => {
  const { data } = await api.put(`/rmas/${id}/escalate`, { escalateTo, reason });
  return data;
},
};