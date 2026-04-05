import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { FiHome } from 'react-icons/fi';
import './NotFound.css';

/**
 * Página 404 - No encontrada
 */
const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        <h2>Página no encontrada</h2>
        <p>
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <Link to="/">
          <Button variant="primary" size="large" icon={<FiHome />}>
            Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;