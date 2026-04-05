import api from './api';

export const auditService = {
  getLogs: async (params = {}) => {
    const { data } = await api.get('/audit', { params });
    return data;
  },

  getLogById: async (id) => {
    const { data } = await api.get(`/audit/${id}`);
    return data;
  },

  exportLogs: async () => {
    const response = await api.get('/audit/export', {
      responseType: 'blob'
    });
    // Descargar el CSV
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'audit-logs.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};