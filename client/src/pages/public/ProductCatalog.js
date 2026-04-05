import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { formatPrice } from '../../utils/formatters';
import { FiSearch, FiShoppingCart, FiSliders, FiX } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './ProductCatalog.css';

const ProductCatalog = () => { 
  const { addToCart }        = useCart();
  const { isAuthenticated }  = useAuth();

  const [products,    setProducts]   = useState([]);
  const [categories,  setCategories] = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [searchQuery, setSearch]     = useState('');
  const [showFilters, setShowFilters]= useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock:  false,
    vendor:   ''
  });

  // Cargar categorías una sola vez
  useEffect(() => {
    categoryService.getCategories({ status: 'active' })
      .then(res => { if (res.success) setCategories(res.categories); })
      .catch(() => {});
  }, []);

  // Recargar productos cuando cambian filtros
  useEffect(() => { loadProducts(); }, [filters]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice  = filters.minPrice;
      if (filters.maxPrice) params.maxPrice  = filters.maxPrice;
      if (filters.inStock)  params.inStock   = 'true';
      if (filters.vendor)   params.vendor    = filters.vendor;
      if (searchQuery.trim()) params.search  = searchQuery.trim();

      const data = await productService.getProducts(params);
      if (data.success) setProducts(data.products || []);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.warning('Debes iniciar sesión para agregar al carrito');
      return;
    }
    await addToCart(product._id, 1);
  };

  const clearFilters = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '', inStock: false, vendor: '' });
    setSearch('');
  };

  const hasActiveFilters = filters.category || filters.minPrice ||
    filters.maxPrice || filters.inStock || filters.vendor;

  return (
    <div className="catalog-page">
      <div className="container">
        {/* Header */}
        <div className="catalog-header">
          <h1>Catálogo de Productos</h1>
          <p>Descubre productos de vendedores verificados</p>
        </div>

        {/* Barra de búsqueda */}
        <div className="catalog-toolbar">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="primary" icon={<FiSearch />}>
              Buscar
            </Button>
          </form>

          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiSliders />
            Filtros
            {hasActiveFilters && <span className="filter-dot" />}
          </button>

          {hasActiveFilters && (
            <button className="clear-filters" onClick={clearFilters}>
              <FiX /> Limpiar
            </button>
          )}
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="filters-panel">
            {/* Categoría */}
            <div className="filter-group">
              <label>Categoría</label>
              <select
                value={filters.category}
                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">Todas</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div className="filter-group">
              <label>Precio mínimo</label>
              <input
                type="number" min="0" placeholder="$0"
                value={filters.minPrice}
                onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
              />
            </div>
            <div className="filter-group">
              <label>Precio máximo</label>
              <input
                type="number" min="0" placeholder="Sin límite"
                value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
              />
            </div>

            {/* Vendedor */}
            <div className="filter-group">
              <label>Vendedor / Tienda</label>
              <input
                type="text" placeholder="Nombre del vendedor..."
                value={filters.vendor}
                onChange={e => setFilters(f => ({ ...f, vendor: e.target.value }))}
              />
            </div>

            {/* Stock */}
            <div className="filter-group filter-check">
              <label>
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={e => setFilters(f => ({ ...f, inStock: e.target.checked }))}
                />
                Solo con stock disponible
              </label>
            </div>
          </div>
        )}

        {/* Grid de productos */}
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <p>Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron productos</p>
            {hasActiveFilters && (
              <Button variant="secondary" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <Card key={product._id} className="product-card">
                <Link to={`/productos/${product._id}`} className="product-image">
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/400'}
                    alt={product.name}
                  />
                  {product.stock < 10 && product.stock > 0 && (
                    <span className="stock-badge">¡Últimas unidades!</span>
                  )}
                  {product.stock === 0 && (
                    <span className="stock-badge out-of-stock">Agotado</span>
                  )}
                </Link>

                <div className="product-info">
                  <div className="product-vendor">
                    {product.vendor?.vendorInfo?.businessName || product.vendor?.name || 'Vendedor'}
                  </div>
                  <Link to={`/productos/${product._id}`}>
                    <h3 className="product-name">{product.name}</h3>
                  </Link>
                  <p className="product-description">
                    {product.description?.substring(0, 80)}...
                  </p>
                  <div className="product-footer">
                    <div className="product-price">{formatPrice(product.price)}</div>
                    <Button
                      variant="primary" size="small"
                      icon={<FiShoppingCart />}
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCatalog;