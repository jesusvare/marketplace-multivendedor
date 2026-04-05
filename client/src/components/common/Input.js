import React from 'react';
import './Input.css';

/**
 * Componente de input reutilizable
 * Incluye label, error y diferentes tipos
 * 
 * @param {string} label - Etiqueta del input
 * @param {string} error - Mensaje de error
 * @param {string} type - Tipo de input
 * @param {node} icon - Icono a mostrar
 * @param {boolean} required - Campo requerido
 */
const Input = ({ 
  label, 
  error, 
  type = 'text',
  icon,
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`input-group ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          className={`custom-input ${icon ? 'has-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;