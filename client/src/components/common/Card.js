import React from 'react';
import './Card.css';

/**
 * Componente de tarjeta reutilizable
 * Contenedor básico con estilos consistentes
 * 
 * @param {string} title - Título de la tarjeta
 * @param {node} actions - Acciones en el header (botones, etc)
 * @param {node} children - Contenido de la tarjeta
 * @param {string} className - Clases CSS adicionales
 */
const Card = ({ title, actions, children, className = '' }) => {
  return (
    <div className={`custom-card ${className}`}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;