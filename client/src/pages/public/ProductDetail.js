import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatters';
import { FiShoppingCart, FiMinus, FiPlus, FiPackage, FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id }               = useParams();
  const navigate             = useNavigate();
  const { addToCart }        = useCart();
  const { isAuthenticated }  = useAuth();

  const [product,       setProduct]  = useState(null);
  const [loading,       setLoading]  = useState(true);
  const [error,         setError]    = useState(null);
  const [quantity,      setQuantity] = useState(1);
  const [selectedImage, setImage]    = useState(0);
  const [adding,        setAdding]   = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProductById(id);
      if (data.success) {
        setProduct(data.product);
        setQuantity(1);
        setImage(0);
      } else {
        setError('Producto no encontrado');
      }
    } catch (err) {
      setError('Click en ver catalogo para ver todos los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.warning('Debes iniciar sesión para agregar al carrito');
      return;
    }
    setAdding(true);
    await addToCart(product._id, quantity);
    setAdding(false);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="loading"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="empty-state">
            <p>{error || 'Producto no encontrado'}</p>
            <Button variant="secondary" icon={<FiArrowLeft />} onClick={() => navigate('/productos')}>
              Volver al catálogo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to="/productos">Productos</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="product-detail-grid">
          {/* Galería */}
          <div className="product-gallery">
            <div className="main-image">
              <img
                src={product.images?.[selectedImage] || 'https://via.placeholder.com/800'}
                alt={product.name}
              />
            </div>
            {product.images?.length > 1 && (
              <div className="image-thumbnails">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    className={`thumbnail ${selectedImage === i ? 'active' : ''}`}
                    onClick={() => setImage(i)}
                  >
                    <img src={img} alt={`Vista ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Información */}
          <div className="product-details">
            <div className="vendor-info">
              <span>Vendido por:</span>
              <strong>
                {product.vendor?.vendorInfo?.businessName || product.vendor?.name}
              </strong>
              {product.vendor?.vendorInfo?.rating > 0 && (
                <span className="vendor-rating">
                  ⭐ {product.vendor.vendorInfo.rating.toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="product-title">{product.name}</h1>

            {product.category && (
              <span className="product-category-badge">
                {product.category.icon} {product.category.name}
              </span>
            )}

            <div className="product-price-section">
              <div className="price">{formatPrice(product.price)}</div>
              <div className="stock-info">
                <FiPackage />
                <span>
                  {product.stock > 0
                    ? `${product.stock} unidades disponibles`
                    : 'Agotado'}
                </span>
              </div>
            </div>

            <p className="product-description">{product.description}</p>

            {/* Especificaciones */}
            {product.specifications?.length > 0 && (
              <div className="specifications">
                <h3>Especificaciones</h3>
                <div className="specs-list">
                  {product.specifications.map((spec, i) => (
                    <div key={i} className="spec-item">
                      <span className="spec-label">{spec.label}:</span>
                      <span className="spec-value">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cantidad */}
            {product.stock > 0 && (
              <div className="quantity-selector">
                <label>Cantidad:</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>
            )}

            <div className="actions">
              <Button
                variant="primary" size="large" fullWidth
                icon={<FiShoppingCart />}
                onClick={handleAddToCart}
                loading={adding}
                disabled={product.stock === 0 || adding}
              >
                {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;