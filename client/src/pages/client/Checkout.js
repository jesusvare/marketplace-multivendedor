import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatters';
import { useForm } from '../../hooks/useForm';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import {
  FiCreditCard,
  FiMapPin,
  FiTag,
  FiCheckCircle,
  FiShoppingBag
} from 'react-icons/fi';
import './Checkout.css';

/**
 * Página de checkout
 * Confirma datos, aplica cupones y crea la orden
 */
const Checkout = () => {
  const { cart, getCartTotals, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const { subtotal, itemCount } = getCartTotals();
  const total = subtotal - couponDiscount;

  /**
   * Validar formulario de envío
   */
  const validateShipping = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'El nombre es requerido';
    if (!values.street) errors.street = 'La dirección es requerida';
    if (!values.city) errors.city = 'La ciudad es requerida';
    if (!values.phone) errors.phone = 'El teléfono es requerido';
    return errors;
  };

  /**
   * Procesar la compra
   */
  const handleCheckout = async (formValues) => {
    try {
      const orderData = {
        shippingAddress: {
          name: formValues.name,
          street: formValues.street,
          city: formValues.city,
          state: formValues.state,
          country: formValues.country || 'Costa Rica',
          zipCode: formValues.zipCode,
          phone: formValues.phone
        },
        couponCode: couponApplied ? couponCode : undefined,
        notes: formValues.notes,
        paymentMethod: 'credit_card'
      };

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        setCompletedOrder(response.order);
        setOrderCompleted(true);
        clearCart();
        toast.success('¡Orden creada exitosamente!');

        // Si es primera compra, mostrar ruleta
        if (response.isFirstOrder) {
          toast.info('🎉 ¡Primera compra! Tienes una ruleta de descuento esperándote', {
            autoClose: 5000
          });
          setTimeout(() => navigate('/cliente/ruleta'), 3000);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar la orden');
    }
  };

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit
  } = useForm(
    {
      name: user?.name || '',
      street: '',
      city: '',
      state: '',
      country: 'Costa Rica',
      zipCode: '',
      phone: user?.phone || '',
      notes: ''
    },
    handleCheckout,
    validateShipping
  );

  /**
   * Aplicar cupón de descuento
   */
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.warning('Ingresa un código de cupón');
      return;
    }

    try {
      setApplyingCoupon(true);
      const response = await orderService.applyCoupon(couponCode, subtotal);

      if (response.success) {
        setCouponDiscount(response.coupon.discount);
        setCouponApplied(response.coupon);
        toast.success(`Cupón aplicado: -${formatPrice(response.coupon.discount)}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cupón inválido');
    } finally {
      setApplyingCoupon(false);
    }
  };

  /**
   * Pantalla de orden completada
   */
  if (orderCompleted && completedOrder) {
    return (
      <div className="order-success">
        <div className="success-card">
          <div className="success-icon">
            <FiCheckCircle />
          </div>
          <h1>¡Orden Completada!</h1>
          <p>Tu orden ha sido procesada exitosamente</p>
          <div className="order-id">
            <span>ID de Orden:</span>
            <strong>{completedOrder._id}</strong>
          </div>
          <div className="order-total">
            <span>Total pagado:</span>
            <strong>{formatPrice(completedOrder.total)}</strong>
          </div>
          <div className="success-actions">
            <Button
              variant="primary"
              icon={<FiShoppingBag />}
              onClick={() => navigate('/cliente/ordenes')}
            >
              Ver Mis Órdenes
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/productos')}
            >
              Seguir Comprando
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-title">
          <FiCreditCard />
          Finalizar Compra
        </h1>

        <div className="checkout-layout">
          {/* Formulario */}
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit}>
              {/* Información de envío */}
              <div className="form-section">
                <h2>
                  <FiMapPin />
                  Dirección de Envío
                </h2>

                <div className="form-grid">
                  <Input
                    label="Nombre completo"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="Tu nombre completo"
                    required
                  />

                  <Input
                    label="Teléfono"
                    name="phone"
                    value={values.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    placeholder="8888-8888"
                    required
                  />
                </div>

                <Input
                  label="Dirección"
                  name="street"
                  value={values.street}
                  onChange={handleChange}
                  error={errors.street}
                  placeholder="Calle, número, referencias"
                  required
                />

                <div className="form-grid">
                  <Input
                    label="Ciudad"
                    name="city"
                    value={values.city}
                    onChange={handleChange}
                    error={errors.city}
                    placeholder="San José"
                    required
                  />

                  <Input
                    label="Provincia"
                    name="state"
                    value={values.state}
                    onChange={handleChange}
                    placeholder="San José"
                  />
                </div>

                <div className="form-grid">
                  <Input
                    label="País"
                    name="country"
                    value={values.country}
                    onChange={handleChange}
                    placeholder="Costa Rica"
                  />

                  <Input
                    label="Código Postal"
                    name="zipCode"
                    value={values.zipCode}
                    onChange={handleChange}
                    placeholder="10101"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Notas del pedido</label>
                  <textarea
                    name="notes"
                    value={values.notes}
                    onChange={handleChange}
                    className="custom-input"
                    rows="3"
                    placeholder="Instrucciones especiales para el envío..."
                  />
                </div>
              </div>

              {/* Cupón */}
              <div className="form-section coupon-section">
                <h2>
                  <FiTag />
                  Cupón de Descuento
                </h2>
                <div className="coupon-input">
                  <input
                    type="text"
                    className="custom-input"
                    placeholder="Ingresa tu código de cupón"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!couponApplied}
                  />
                  <Button
                    variant={couponApplied ? 'success' : 'primary'}
                    onClick={handleApplyCoupon}
                    loading={applyingCoupon}
                    disabled={!!couponApplied}
                  >
                    {couponApplied ? '✓ Aplicado' : 'Aplicar'}
                  </Button>
                </div>
                {couponApplied && (
                  <div className="coupon-applied">
                    <FiCheckCircle />
                    <span>
                      Cupón <strong>{couponApplied.code}</strong> aplicado.
                      Ahorro: {formatPrice(couponDiscount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Botón de pago */}
              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={isSubmitting}
                icon={<FiCreditCard />}
              >
                Confirmar y Pagar {formatPrice(total)}
              </Button>
            </form>
          </div>

          {/* Resumen del pedido */}
          <div className="checkout-summary">
            <div className="summary-card">
              <h2>Resumen del Pedido</h2>
              <div className="summary-items">
                {cart.map((item) => (
                  <div key={item.product?._id} className="summary-item">
                    <img
                      src={item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                      alt={item.product?.name}
                    />
                    <div className="summary-item-info">
                      <p>{item.product?.name}</p>
                      <span>x{item.quantity}</span>
                    </div>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>

              <div className="summary-line">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="summary-line discount">
                  <span>Descuento</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="summary-line">
                <span>Envío</span>
                <span className="free">Gratis</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;