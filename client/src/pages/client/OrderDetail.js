import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { formatPrice, formatDateTime } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiMessageSquare,
  FiRefreshCw
} from 'react-icons/fi';
import './OrderDetail.css';
import { toast } from 'react-toastify';

/**
 * Detalle completo de una orden
 * Muestra items, estados por vendedor, historial y acciones
 */
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(id);
      if (response.success) {
        setOrder(response.order);
      }
    } catch (error) {
      console.error('Error al cargar orden:', error);
      toast.error('No se pudo cargar la orden');
    } finally {
      setLoading(false);
    }
  };

  // Iconos de estado
  const getStatusIcon = (status) => {
    const icons = {
      paid: <FiClock />,
      packed: <FiPackage />,
      shipped: <FiTruck />,
      delivered: <FiCheckCircle />,
      cancelled: <FiRefreshCw />
    };
    return icons[status] || <FiClock />;
  };

  // Labels de estado
  const getStatusLabel = (status) => {
    const labels = {
      paid: 'Pagado',
      packed: 'Empacado',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  // Colores de estado
  const getStatusColor = (status) => {
    const colors = {
      paid: '#f59e0b',
      packed: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  // Pasos del tracker de envío
  const shippingSteps = ['paid', 'packed', 'shipped', 'delivered'];

  const getStepIndex = (status) => shippingSteps.indexOf(status);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!order) {
    return (
      <div className="not-found">
        <h2>Orden no encontrada</h2>
        <Button variant="primary" onClick={() => navigate('/cliente/ordenes')}>
          Volver a mis órdenes
        </Button>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/cliente/ordenes')}>
          <FiArrowLeft /> Volver
        </button>
        <div className="detail-title">
          <h1>Orden #{order._id.slice(-8).toUpperCase()}</h1>
          <span className="order-date">{formatDateTime(order.createdAt)}</span>
        </div>
        <span
          className="status-badge-large"
          style={{
            background: `${getStatusColor(order.status)}20`,
            color: getStatusColor(order.status),
            borderColor: getStatusColor(order.status)
          }}
        >
          {getStatusIcon(order.status)}
          {getStatusLabel(order.status)}
        </span>
      </div>

      {/* Tracker de envío */}
      <Card className="shipping-tracker">
        <h2>Seguimiento del Pedido</h2>
        <div className="tracker-steps">
          {shippingSteps.map((step, index) => {
            const currentIndex = getStepIndex(order.status);
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <React.Fragment key={step}>
                <div className={`tracker-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="step-icon">
                    {getStatusIcon(step)}
                  </div>
                  <span className="step-label">{getStatusLabel(step)}</span>
                </div>
                {index < shippingSteps.length - 1 && (
                  <div className={`tracker-line ${index < currentIndex ? 'completed' : ''}`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      <div className="detail-grid">
        {/* Items de la orden */}
        <div className="detail-main">
          <Card title="Productos">
            {order.items.map((item) => (
              <div key={item._id} className="order-item-detail">
                <div className="item-detail-info">
                  <img
                    src={item.images?.[0] || item.product?.images?.[0] || 'https://via.placeholder.com/90'}
                    alt={item.name}
                  />
                  <div>
                    <h3>{item.name}</h3>
                    <p className="item-vendor">Vendedor: {item.vendor?.name}</p>
                    <p className="item-qty-price">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                </div>

                <div className="item-detail-right">
                  <strong className="item-subtotal">
                    {formatPrice(item.price * item.quantity)}
                  </strong>
                  <span
                    className="item-status-badge"
                    style={{
                      background: `${getStatusColor(item.status)}15`,
                      color: getStatusColor(item.status)
                    }}
                  >
                    {getStatusIcon(item.status)}
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                {/* Historial del item */}
                {item.statusHistory?.length > 0 && (
                  <div className="item-history">
                    <p className="history-title">Historial:</p>
                    <div className="history-steps">
                      {item.statusHistory.map((h, idx) => (
                        <div key={idx} className="history-step">
                          <div className="history-dot"></div>
                          <div className="history-info">
                            <span className="history-status">{getStatusLabel(h.status)}</span>
                            <span className="history-time">{formatDateTime(h.changedAt)}</span>
                            {h.notes && <span className="history-notes">{h.notes}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="detail-sidebar">
          {/* Resumen de pago */}
          <Card title="Resumen de Pago">
            <div className="payment-lines">
              <div className="payment-line">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="payment-line discount">
                  <span>Descuento</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="payment-line">
                <span>Envío</span>
                <span className="free-text">Gratis</span>
              </div>
              {order.coupon && (
                <div className="coupon-used">
                  <FiCheckCircle />
                  <span>Cupón: {order.coupon.code}</span>
                </div>
              )}
              <div className="payment-divider"></div>
              <div className="payment-total">
                <span>Total Pagado</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>
              <div className="payment-method">
                <FiClock />
                <span>
                  Pagado el {formatDateTime(order.paidAt)}
                </span>
              </div>
            </div>
          </Card>

          {/* Dirección de envío */}
          <Card title="Dirección de Envío">
            <div className="shipping-info">
              <FiMapPin className="shipping-icon" />
              <div>
                <strong>{order.shippingAddress.name}</strong>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>{order.shippingAddress.country}</p>
                <p>📞 {order.shippingAddress.phone}</p>
              </div>
            </div>
          </Card>

          {/* Notas */}
          {order.notes && (
            <Card title="Notas del Pedido">
              <p className="order-notes">{order.notes}</p>
            </Card>
          )}

          {/* Acciones */}
          <Card title="Acciones">
            <div className="detail-actions">
              <Link to="/cliente/tickets">
                <Button variant="primary" fullWidth icon={<FiMessageSquare />}>
                  Abrir Ticket de Soporte
                </Button>
              </Link>
              <Link to={`/cliente/tickets?orderId=${order._id}`}>
                <Button variant="secondary" fullWidth icon={<FiRefreshCw />}>
                  Solicitar Devolución
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;