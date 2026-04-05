import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Punto de entrada principal de la aplicación React
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  // StrictMode ayuda a detectar problemas potenciales en el código
  <React.StrictMode>
    <App />
  </React.StrictMode>
);