import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './MainLayout.css';

/**
 * Layout principal para páginas públicas
 * Incluye Navbar, contenido y Footer
 */
const MainLayout = () => {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="main-content">
        {/* Outlet renderiza las rutas hijas */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;