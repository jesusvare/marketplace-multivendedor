import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Providers de contexto global
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Rutas principales
import AppRoutes from './routes/AppRoutes';

/**
 * Componente principal de la aplicación
 * Configura los providers globales y el sistema de rutas
 */
function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider maneja el estado de autenticación global */}
      <AuthProvider>
        {/* CartProvider maneja el estado del carrito de compras */}
        <CartProvider>
          <div className="App">
            {/* Sistema de rutas principal */}
            <AppRoutes />
            
            {/* Toast notifications para mensajes al usuario */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;