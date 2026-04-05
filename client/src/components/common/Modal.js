import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import './Modal.css';

/**
 * Componente de modal reutilizable
 * Incluye overlay, animaciones y manejo de ESC
 * 
 * @param {boolean} isOpen - Estado del modal
 * @param {function} onClose - Función para cerrar
 * @param {string} title - Título del modal
 * @param {string} size - small | medium | large
 * @param {node} children - Contenido del modal
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  size = 'medium',
  children 
}) => {
  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevenir scroll cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-container modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button 
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;