import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Páginas Públicas
import Home from '../pages/public/Home';
import ProductCatalog from '../pages/public/ProductCatalog';
import ProductDetail from '../pages/public/ProductDetail';

// Páginas de Autenticación
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Páginas de Cliente
import Cart from '../pages/client/Cart';
import Checkout from '../pages/client/Checkout';
import MyOrders from '../pages/client/MyOrders';
import OrderDetail from '../pages/client/OrderDetail';
import MyTickets from '../pages/client/MyTickets';
import SpinWheel from '../pages/client/SpinWheel';
import RequestRMA from '../pages/client/RequestRMA';
import ClientTicketDetail from '../pages/client/ClientTicketDetail';

// Páginas de Vendedor
import VendorDashboard from '../pages/vendor/VendorDashboard';
import VendorProducts from '../pages/vendor/VendorProducts';
import VendorOrders from '../pages/vendor/VendorOrders';
import VendorOrderDetail from '../pages/vendor/VendorOrderDetail';

// Páginas de Soporte
import SupportDashboard from '../pages/support/SupportDashboard';
import SupportTickets from '../pages/support/SupportTickets';
import SupportRMAs from '../pages/support/SupportRMAs';
import SupportTicketDetail from '../pages/support/SupportTicketDetail';
import SupportRMADetail from '../pages/support/SupportRMADetail';
// Páginas de Administrador
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminVendors from '../pages/admin/AdminVendors';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminAudit from '../pages/admin/AdminAudit';

// Página 404
import NotFound from '../pages/NotFound';

/**
 * Componente de rutas principales de la aplicación
 * Maneja toda la navegación y protección de rutas por rol
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas Públicas (sin autenticación) */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="productos" element={<ProductCatalog />} />
        <Route path="productos/:id" element={<ProductDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Register />} />
      </Route>

      {/* Rutas Protegidas - Cliente */}
      <Route path="/cliente" element={
        <ProtectedRoute roles={['client']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="carrito" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="ordenes" element={<MyOrders />} />
        <Route path="ordenes/:id" element={<OrderDetail />} />
        <Route path="tickets" element={<MyTickets />} />
        <Route path="ruleta" element={<SpinWheel />} />
        <Route path="devoluciones" element={<RequestRMA />} />
        <Route path="tickets/:id" element={<ClientTicketDetail />} />
      </Route>

      {/* Rutas Protegidas - Vendedor */}
      <Route path="/vendedor" element={
        <ProtectedRoute roles={['vendor']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<VendorDashboard />} />
        <Route path="productos" element={<VendorProducts />} />
        <Route path="ordenes" element={<VendorOrders />} />
        <Route path="ordenes/:id" element={<VendorOrderDetail />}  />
      </Route>

      {/* Rutas Protegidas - Soporte */}
      <Route path="/soporte" element={
        <ProtectedRoute roles={['support']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<SupportDashboard />} />
        <Route path="tickets" element={<SupportTickets />} />
        <Route path="tickets/:id" element={<SupportTicketDetail />} />
        <Route path="devoluciones" element={<SupportRMAs />} />
        <Route path="devoluciones/:id" element={<SupportRMADetail />} /> 
      </Route>

      {/* Rutas Protegidas - Administrador */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="usuarios" element={<AdminUsers />} />
        <Route path="vendedores" element={<AdminVendors />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="auditoria" element={<AdminAudit />} />
      </Route>

      {/* Ruta 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

/**
 * Componente para proteger rutas según roles
 * Verifica autenticación y permisos antes de renderizar
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si el usuario tiene el rol requerido
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AppRoutes;