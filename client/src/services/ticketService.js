import api from './api';

export const ticketService = {
  // Crear ticket
  createTicket: async (ticketData) => {
    const { data } = await api.post('/tickets', ticketData);
    return data;
  },

  // Mis tickets (cliente)
  getMyTickets: async () => {
    const { data } = await api.get('/tickets/my-tickets');
    return data;
  },

  // Todos los tickets (soporte/admin)
  getAllTickets: async (filters = {}) => {
    const { data } = await api.get('/tickets', { params: filters });
    return data;
  },

  // Detalle de ticket
  getTicketById: async (id) => {
    const { data } = await api.get(`/tickets/${id}`);
    return data;
  },

  // Agregar mensaje
  addMessage: async (id, message) => {
    const { data } = await api.post(`/tickets/${id}/messages`, { message });
    return data;
  },

  // Cambiar estado
  updateStatus: async (id, status, notes) => {
    const { data } = await api.put(`/tickets/${id}/status`, { status, notes });
    return data;
  },

  // Asignar ticket
  assignTicket: async (id) => {
    const { data } = await api.put(`/tickets/${id}/assign`);
    return data;
  },

  // Escalar ticket
  escalateTicket: async (id, escalateTo, reason) => {
    const { data } = await api.put(`/tickets/${id}/escalate`, { escalateTo, reason });
    return data;
  }
};