import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiMail } from 'react-icons/fi';
import './Footer.css';

/**
 * Footer de la aplicación
 * Muestra información, enlaces y redes sociales
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Columna 1: Sobre nosotros */}
        <div className="footer-column">
          <h3>Marketplace</h3>
          <p>
            Tu plataforma de comercio electrónico con múltiples vendedores.
            Encuentra todo lo que necesitas en un solo lugar.
          </p>
          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FiFacebook />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FiTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FiInstagram />
            </a>
            <a href="mailto:info@marketplace.com" aria-label="Email">
              <FiMail />
            </a>
          </div>
        </div>

        {/* Columna 2: Enlaces rápidos */}
        <div className="footer-column">
          <h4>Enlaces Rápidos</h4>
          <ul>
            <li><Link to="/productos">Productos</Link></li>
            <li><Link to="/sobre-nosotros">Sobre Nosotros</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
            <li><Link to="/ayuda">Centro de Ayuda</Link></li>
          </ul>
        </div>

        {/* Columna 3: Para vendedores */}
        <div className="footer-column">
          <h4>Vendedores</h4>
          <ul>
            <li><Link to="/vender">Vender en Marketplace</Link></li>
            <li><Link to="/vendedor/registro">Registrarse como Vendedor</Link></li>
            <li><Link to="/politicas-vendedor">Políticas de Vendedor</Link></li>
          </ul>
        </div>

        {/* Columna 4: Legal */}
        <div className="footer-column">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/terminos">Términos y Condiciones</Link></li>
            <li><Link to="/privacidad">Política de Privacidad</Link></li>
            <li><Link to="/cookies">Política de Cookies</Link></li>
            <li><Link to="/devoluciones">Devoluciones</Link></li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} Marketplace. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;