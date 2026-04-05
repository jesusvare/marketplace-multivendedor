import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

// Crear contexto de autenticación
const AuthContext = createContext();

/**
 * Hook personalizado para usar el contexto de autenticación
 * Permite acceder al estado y funciones de autenticación desde cualquier componente
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}; 

/**
 * Provider de autenticación
 * Maneja el estado global de autenticación del usuario
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay un usuario autenticado al cargar la app
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Verifica si hay un token guardado y valida la sesión
   */
  const checkAuth = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const response = await authService.validateToken();
     // extraer el user del wrapper de respuesta
      const userData = response.user || response;
      setUser(userData);
      setIsAuthenticated(true);
    }
  } catch (error) {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  } finally {
    setLoading(false);
  }
};

  /**
   * Función de login
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   */
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { token, user: userData } = response;
      
      // Guardar token en localStorage
      localStorage.setItem('token', token);
      
      // Actualizar estado
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al iniciar sesión' 
      };
    }
  };

  /**
   * Función de registro
   * @param {object} userData - Datos del nuevo usuario
   */
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { token, user: newUser } = response;
      
      // Guardar token
      localStorage.setItem('token', token);
      
      // Actualizar estado
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true, user: newUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al registrarse' 
      };
    }
  };

  /**
   * Función de logout
   * Limpia el estado y el token guardado
   */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Actualizar datos del usuario
   * @param {object} updatedData - Datos actualizados del usuario
   */
  const updateUser = (updatedData) => {
    setUser(prevUser => ({ ...prevUser, ...updatedData }));
  };

  // Valor que se compartirá con todos los componentes
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};