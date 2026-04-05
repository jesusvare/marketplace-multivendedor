import React from 'react';
import './Button.css';

/**
 * Componente de botón reutilizable
 * Soporta diferentes variantes, tamaños y estados
 * 
 * @param {string} variant - primary | secondary | danger | success
 * @param {string} size - small | medium | large
 * @param {boolean} loading - Mostrar spinner de carga
 * @param {boolean} disabled - Deshabilitar botón
 * @param {boolean} fullWidth - Ocupar todo el ancho disponible
 * @param {node} icon - Icono a mostrar
 * @param {node} children - Contenido del botón
 */
const Button = ({ 
  variant = 'primary', 
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`
        custom-btn 
        btn-${variant} 
        btn-${size} 
        ${fullWidth ? 'btn-full-width' : ''}
        ${loading ? 'btn-loading' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      {!loading && icon && <span className="btn-icon">{icon}</span>}
      {!loading && <span>{children}</span>}
    </button>
  );
};

export default Button;