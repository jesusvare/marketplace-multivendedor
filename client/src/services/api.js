import axios from 'axios';

/**
 * Configuración base de Axios para todas las peticiones API
 * Intercepta requests y responses para manejar tokens y errores
 */

// URL base del backend (desde variable de entorno)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios con configuración personalizada
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});
 
/**
 * Interceptor de Request
 * Agrega automáticamente el token de autenticación a cada petición
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de Response
 * Maneja errores globales (como token expirado)
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token expiró, redirigir al login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;