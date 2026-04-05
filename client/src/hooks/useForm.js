import { useState } from 'react';

/**
 * Hook personalizado para manejar formularios
 * Simplifica el manejo de estado y validación de forms
 * 
 * @param {object} initialValues - Valores iniciales del formulario
 * @param {function} onSubmit - Función a ejecutar al enviar
 * @param {function} validate - Función de validación (opcional)
 * @returns {object} - Estado y funciones del formulario
 */
export const useForm = (initialValues = {}, onSubmit, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Manejar cambio en inputs
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpiar error del campo al modificarlo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar si existe función de validación
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      
      // Si hay errores, no enviar
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    // Ejecutar función de submit
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Error en submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Resetear formulario a valores iniciales
   */
  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  };

  /**
   * Setear valores manualmente
   */
  const setFieldValue = (name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setFieldValue,
    setErrors
  };
};