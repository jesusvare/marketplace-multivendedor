import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  FiShoppingCart, FiUser, FiMenu, FiX,
  FiLogOut, FiSearch, FiGrid, FiChevronDown,
} from 'react-icons/fi';
import './Navbar.css';

/**
 * Barra de navegación principal — Premium Light
 * Mantiene toda la lógica original: auth, cart, search, roles, logout
 */
const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartTotals } = useCart();
  const navigate = useNavigate();

  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  const { itemCount } = getCartTotals();
  const searchRef  = useRef(null);
  const dropdownRef = useRef(null);

  /* ── Scroll state ───────────────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 55);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Focus search input when bar opens ─────────────────────────────── */
  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  /* ── Close dropdown on outside click ───────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setDropdownOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/productos?search=${searchQuery}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const getDashboardRoute = () => {
    switch (user?.role) {
      case 'admin':   return '/admin';
      case 'vendor':  return '/vendedor';
      case 'support': return '/soporte';
      case 'client':  return '/cliente/ordenes';
      default:        return '/';
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  /* ── Role label ─────────────────────────────────────────────────────── */
  const roleLabels = {
    admin:   'Administrador',
    vendor:  'Vendedor',
    support: 'Soporte',
    client:  'Cliente',
  };

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}${isMenuOpen ? ' navbar--open' : ''}`}>

      {/* ── Main bar ──────────────────────────────────────────────────── */}
      <div className="navbar__inner">

        {/* Logo */}
        <Link to="/" className="navbar__logo" onClick={closeMenu}>
          <span className="logo-icon">
            <img src="/logo192.png" alt="Logo" />
          </span>
          <span className="logo-text">Market<span className="logo-accent">place</span></span>
        </Link>

        {/* Desktop nav links */}
        <nav className="navbar__links">
          <NavLink
            to="/productos"
            className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
          >
            Productos
          </NavLink>
          {isAuthenticated && user?.role === 'client' && (
            <NavLink
              to="/cliente/carrito"
              className={({ isActive }) => `nav-link nav-link--cart${isActive ? ' nav-link--active' : ''}`}
            >
              <FiShoppingCart />
              <span>Carrito</span>
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </NavLink>
          )}
        </nav>

        {/* Actions */}
        <div className="navbar__actions">

          {/* Search toggle */}
          <button
            className="nav-icon-btn"
            aria-label="Buscar"
            onClick={() => setSearchOpen(v => !v)}
          >
            {searchOpen ? <FiX /> : <FiSearch />}
          </button>

          {isAuthenticated ? (
            /* ── User dropdown ─────────────────────────────────────── */
            <div className="nav-user" ref={dropdownRef}>
              <button
                className={`nav-user__btn${dropdownOpen ? ' nav-user__btn--open' : ''}`}
                onClick={() => setDropdownOpen(v => !v)}
                aria-expanded={dropdownOpen}
              >
                <span className="nav-user__avatar">
                  {user?.name?.[0]?.toUpperCase() ?? <FiUser />}
                </span>
                <span className="nav-user__name">{user?.name}</span>
                <FiChevronDown className="nav-user__chevron" />
              </button>

              <div className={`nav-dropdown${dropdownOpen ? ' nav-dropdown--open' : ''}`}>
                {/* User info header */}
                <div className="dropdown-header">
                  <span className="dropdown-name">{user?.name}</span>
                  <span className="dropdown-role">{roleLabels[user?.role] ?? user?.role}</span>
                </div>
                <div className="dropdown-divider" />
                <Link
                  to={getDashboardRoute()}
                  className="dropdown-item"
                  onClick={() => { setDropdownOpen(false); closeMenu(); }}
                >
                  <FiGrid /> Mi Cuenta
                </Link>
                <div className="dropdown-divider" />
                <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                  <FiLogOut /> Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            /* ── Auth links ─────────────────────────────────────────── */
            <>
              <Link to="/login" className="nav-link nav-link--ghost" onClick={closeMenu}>
                Iniciar Sesión
              </Link>
              <Link to="/registro" className="nav-cta" onClick={closeMenu}>
                Registrarse
              </Link>
            </>
          )}

          {/* Hamburger */}
          <button
            className="nav-icon-btn nav-hamburger"
            aria-label="Menú"
            onClick={() => setIsMenuOpen(v => !v)}
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <div className={`navbar__search${searchOpen ? ' navbar__search--open' : ''}`}>
        <form className="search-bar" onSubmit={handleSearch}>
          <FiSearch className="search-icon" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar productos, marcas, categorías…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-submit">Buscar</button>
        </form>
      </div>

      {/* ── Mobile menu ───────────────────────────────────────────────── */}
      <nav className={`navbar__mobile${isMenuOpen ? ' navbar__mobile--open' : ''}`}>
        <Link to="/productos" className="mobile-link" onClick={closeMenu}>
          Productos
        </Link>

        {isAuthenticated && user?.role === 'client' && (
          <Link to="/cliente/carrito" className="mobile-link" onClick={closeMenu}>
            <FiShoppingCart />
            Carrito
            {itemCount > 0 && <span className="cart-badge cart-badge--mobile">{itemCount}</span>}
          </Link>
        )}

        {isAuthenticated ? (
          <>
            <div className="mobile-divider" />
            <div className="mobile-user-info">
              <span className="mobile-user-avatar">
                {user?.name?.[0]?.toUpperCase() ?? <FiUser />}
              </span>
              <div>
                <strong>{user?.name}</strong>
                <small>{roleLabels[user?.role] ?? user?.role}</small>
              </div>
            </div>
            <Link to={getDashboardRoute()} className="mobile-link" onClick={closeMenu}>
              <FiGrid /> Mi Cuenta
            </Link>
            <button className="mobile-link mobile-link--danger" onClick={handleLogout}>
              <FiLogOut /> Cerrar Sesión
            </button>
          </>
        ) : (
          <>
            <div className="mobile-divider" />
            <Link to="/login"    className="mobile-link"      onClick={closeMenu}>Iniciar Sesión</Link>
            <Link to="/registro" className="mobile-link mobile-link--cta" onClick={closeMenu}>
              Registrarse gratis
            </Link>
          </>
        )}
      </nav>

    </header>
  );
};

export default Navbar;