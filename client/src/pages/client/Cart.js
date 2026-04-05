import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatters';
import Button from '../../components/common/Button';
import {
  FiShoppingCart,
  FiTrash2,
  FiMinus,
  FiPlus,
  FiArrowLeft,
  FiArrowRight
} from 'react-icons/fi';
import './Cart.css';

/**
 * Página del carrito de compras
 * Muestra items, permite modificar cantidades y proceder al checkout
 */
const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotals } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { subtotal, itemCount } = getCartTotals();

  // Si el carrito está vacío
  if (!cart || cart.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-icon">
          <FiShoppingCart />
        </div>
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos desde el catálogo para comenzar</p>
        <Link to="/productos">
          <Button variant="primary" size="large" icon={<FiArrowLeft />}>
            Ir al Catálogo
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        {/* Header */}
        <div className="cart-header">
          <h1>
            <FiShoppingCart />
            Carrito de Compras
          </h1>
          <span className="item-count">{itemCount} productos</span>
        </div>

        <div className="cart-layout">
          {/* Lista de productos */}
          <div className="cart-items">
            {/* Botón vaciar carrito */}
            <div className="cart-toolbar">
              <Button
                variant="danger"
                size="small"
                icon={<FiTrash2 />}
                onClick={clearCart}
              >
                Vaciar carrito
              </Button>
            </div>

            {/* Items */}
            {cart.map((item) => (
              <div key={item.product?._id || item._id} className="cart-item">
                {/* Imagen del producto */}
                <Link to={`/productos/${item.product?._id}`} className="item-image">
                  <img
                    src={item.product?.images?.[0] || 'https://via.placeholder.com/120'}
                    alt={item.product?.name}
                  />
                </Link>

                {/* Información del producto */}
                <div className="item-info">
                  <Link to={`/productos/${item.product?._id}`}>
                    <h3 className="item-name">{item.product?.name}</h3>
                  </Link>
                  <p className="item-vendor">
                    {item.product?.vendor?.name || 'Vendedor'}
                  </p>

                  {/* Stock disponible */}
                  {item.product?.stock < 10 && item.product?.stock > 0 && (
                    <span className="low-stock-warning">
                      ⚠️ Solo {item.product?.stock} disponibles
                    </span>
                  )}
                </div>

                {/* Controles de cantidad */}
                <div className="item-quantity">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.product?._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.product?._id, item.quantity + 1)}
                    disabled={item.quantity >= item.product?.stock}
                  >
                    <FiPlus />
                  </button>
                </div>

                {/* Precio */}
                <div className="item-price">
                  <span className="price-unit">
                    {formatPrice(item.price)}
                  </span>
                  <span className="price-total">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>

                {/* Botón eliminar */}
                <button
                  className="item-remove"
                  onClick={() => removeFromCart(item.product?._id)}
                  title="Eliminar"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>

          {/* Resumen del pedido */}
          <div className="cart-summary">
            <div className="summary-card">
              <h2>Resumen del Pedido</h2>

              <div className="summary-line">
                <span>Subtotal ({itemCount} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-line">
                <span>Envío</span>
                <span className="free-shipping">Gratis</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <Button
                variant="primary"
                size="large"
                fullWidth
                icon={<FiArrowRight />}
                onClick={() => navigate('/cliente/checkout')}
              >
                Proceder al Pago
              </Button>

              <Link to="/productos" className="continue-shopping">
                <FiArrowLeft />
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;