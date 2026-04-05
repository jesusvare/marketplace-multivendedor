import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { formatPrice, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { toast } from 'react-toastify';
import { FiShoppingBag, FiEye, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import './MyOrders.css';

const STATUS_CONFIG = {
  created:    { label: 'Creada',     color: '#64748b' },
  paid:       { label: 'Pagada',     color: '#f59e0b' },
  processing: { label: 'Procesando', color: '#3b82f6' },
  completed:  { label: 'Completada', color: '#10b981' },
  cancelled:  { label: 'Cancelada',  color: '#ef4444' },
  shipped:    { label: 'Enviada',    color: '#8b5cf6' },
  delivered:  { label: 'Entregada',  color: '#10b981' }
};

const MyOrders = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getMyOrders();
      if (response.success) setOrders(response.orders);
    } catch (error) {
      toast.error('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const filterButtons = [
    { value: 'all',       label: 'Todas'      },
    { value: 'paid',      label: 'Pagadas'    },
    { value: 'shipped',   label: 'En camino'  },
    { value: 'delivered', label: 'Entregadas' },
    { value: 'cancelled', label: 'Canceladas' }
  ];

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter
        || o.items?.some(i => i.status === filter));

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="my-orders-page">
      <div className="page-header">
        <h1><FiShoppingBag /> Mis Órdenes</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="orders-count">{orders.length} órdenes</span>
          <button
            onClick={loadOrders}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
                     color: 'var(--secondary-color)', fontSize: 18 }}
            title="Actualizar"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <div className="orders-filters">
        {filterButtons.map(btn => (
          <button
            key={btn.value}
            className={`filter-btn ${filter === btn.value ? 'active' : ''}`}
            onClick={() => setFilter(btn.value)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <FiShoppingBag size={60} />
          <h3>{orders.length === 0 ? 'Aún no has realizado compras' : 'Sin órdenes con ese estado'}</h3>
          <p>Explora nuestro catálogo y realiza tu primera compra</p>
          <Link to="/productos">
            <Button variant="primary">Explorar Productos</Button>
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.created;
            const orderId = order._id?.slice(-8).toUpperCase() || 'N/A';
            return (
              <Card key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-id-section">
                    <h3>Orden #{orderId}</h3>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <span
                    className="status-badge"
                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>

                <div className="order-items">
                  {order.items?.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="order-item-preview">
                      <img
                        src={item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                        alt={item.name || item.product?.name}
                      />
                      <div>
                        <p>{item.name || item.product?.name}</p>
                        <span>Cant: {item.quantity} · {formatPrice(item.price)}</span>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 2 && (
                    <p className="more-items">+{order.items.length - 2} productos más</p>
                  )}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    Total: <strong>{formatPrice(order.total)}</strong>
                  </div>
                  <div className="order-actions">
                    <Link to={`/cliente/ordenes/${order._id}`}>
                      <Button variant="primary" size="small" icon={<FiEye />}>
                        Ver Detalle
                      </Button>
                    </Link>
                    <Link to="/cliente/tickets">
                      <Button variant="secondary" size="small" icon={<FiMessageSquare />}>
                        Soporte
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;