import { useState, useEffect } from 'react';

/**
 * Hook personalizado para hacer fetch de datos
 * Maneja estados de loading, error y data automáticamente
 * 
 * @param {function} fetchFunction - Función que retorna una promesa
 * @param {array} dependencies - Dependencias para re-fetch (opcional)
 * @returns {object} - { data, loading, error, refetch }
 */
export const useFetch = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Ejecutar fetch
   */
  const executeFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar datos');
      console.error('Error en fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar al montar y cuando cambien las dependencias
  useEffect(() => {
    executeFetch();
  }, dependencies);

  /**
   * Función para refrescar datos manualmente
   */
  const refetch = () => {
    executeFetch();
  };

  return { data, loading, error, refetch };
};