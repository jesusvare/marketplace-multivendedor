import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, FiShoppingBag, FiShoppingCart, FiPackage, FiUsers,
  FiMessageSquare, FiLogOut, FiMenu, FiX, FiBarChart,
  FiClipboard, FiTag, FiRotateCcw, FiGift
} from 'react-icons/fi';
import './DashboardLayout.css';

/**
 * Layout para el dashboard (backoffice)
 * Incluye sidebar con navegación según rol del usuario
 */
const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * Obtener menú según el rol del usuario
   */
  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { path: '/admin', icon: <FiHome />, label: 'Dashboard' },
          { path: '/admin/usuarios', icon: <FiUsers />, label: 'Usuarios' },
          { path: '/admin/vendedores', icon: <FiShoppingBag />, label: 'Vendedores' },
          { path: '/admin/categorias', icon: <FiTag />, label: 'Categorías' },
          { path: '/admin/auditoria', icon: <FiClipboard />, label: 'Auditoría' }
        ];
      
      case 'vendor':
        return [
          { path: '/vendedor', icon: <FiBarChart />, label: 'Dashboard' },
          { path: '/vendedor/productos', icon: <FiPackage />, label: 'Productos' },
          { path: '/vendedor/ordenes', icon: <FiShoppingCart />, label: 'Órdenes' }
        ];
      
      case 'support':
        return [
          { path: '/soporte', icon: <FiHome />, label: 'Dashboard' },
          { path: '/soporte/tickets', icon: <FiMessageSquare />, label: 'Tickets' },
          { path: '/soporte/devoluciones', icon: <FiClipboard />, label: 'Devoluciones' }
        ];
      
      case 'client':
        const clientMenu = [
          { path: '/cliente/ordenes',     icon: <FiShoppingCart />,  label: 'Mis Órdenes'   },
          { path: '/cliente/tickets',     icon: <FiMessageSquare />, label: 'Mis Tickets'   },
          { path: '/cliente/devoluciones',icon: <FiRotateCcw />,     label: 'Devoluciones'  },
          { path: '/cliente/carrito',     icon: <FiShoppingBag />,   label: 'Carrito'       },
        ];
        // La ruleta solo aparece si no la ha usado todavía
        if (!user?.hasUsedSpinWheel) {
          clientMenu.splice(3, 0, {
            path:  '/cliente/ruleta',
            icon:  <FiGift />,
            label: '🎰 Ruleta de descuento'
          });
        }
        return clientMenu;
            
            default:
              return [];
          }
        };

  /**
   * Manejar logout
   */
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  /**
   * Verificar si una ruta está activa
   */
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const menuItems = getMenuItems();

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Header del sidebar */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <img src="/logo192.png" alt="Logo" />
            <span>Marketplace</span>
          </Link>
          <button 
            className="sidebar-close"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiX />
          </button>
        </div>

        {/* Información del usuario */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h3>{user?.name}</h3>
            <span className="user-role">{getRoleLabel(user?.role)}</span>
          </div>
        </div>

        {/* Navegación */}
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Botones del footer */}
        <div className="sidebar-footer">
          <Link to="/" className="footer-btn">
            <FiHome />
            <span>Ir a la tienda</span>
          </Link>
          <button className="footer-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className="dashboard-main">
        {/* Header del dashboard */}
        <header className="dashboard-header">
          <button 
            className="menu-toggle"
            onClick={() => setIsSidebarOpen(true)}
          >
            <FiMenu />
          </button>
          <h1 className="page-title">
            {getPageTitle(location.pathname, user?.role)}
          </h1>
        </header>

        {/* Contenido */}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

/**
 * Obtener etiqueta del rol
 */
const getRoleLabel = (role) => {
  const labels = {
    admin: 'Administrador',
    vendor: 'Vendedor',
    support: 'Soporte',
    client: 'Cliente'
  };
  return labels[role] || 'Usuario';
};

/**
 * Obtener título de la página según la ruta
 */
const getPageTitle = (pathname, role) => {
  const titles = {
    // Admin
    '/admin': 'Dashboard',
    '/admin/usuarios': 'Gestión de Usuarios',
    '/admin/vendedores': 'Gestión de Vendedores',
    '/admin/categorias': 'Categorías',
    '/admin/auditoria': 'Auditoría',
    
    // Vendor
    '/vendedor': 'Dashboard',
    '/vendedor/productos': 'Mis Productos',
    '/vendedor/ordenes': 'Órdenes',
    
    // Support
    '/soporte': 'Dashboard',
    '/soporte/tickets': 'Tickets de Soporte',
    '/soporte/devoluciones': 'Devoluciones',
    
    // Client
    '/cliente/ordenes': 'Mis Órdenes',
    '/cliente/tickets': 'Mis Tickets',
    '/cliente/carrito': 'Carrito de Compras',
    '/cliente/ruleta':       'Ruleta de Descuento',
    '/cliente/devoluciones': 'Solicitar Devolución'
  };
  
  return titles[pathname] || 'Dashboard';
};

export default DashboardLayout;