import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { formatPrice, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import { FiPackage, FiTruck, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import './VendorOrders.css';
import { Link } from 'react-router-dom';

const STATUS_STEPS = {
  paid:      { label: 'Pagado',    next: 'packed',    nextLabel: 'Marcar Empacado', icon: <FiPackage />     },
  packed:    { label: 'Empacado',  next: 'shipped',   nextLabel: 'Marcar Enviado',  icon: <FiTruck />       },
  shipped:   { label: 'Enviado',   next: 'delivered', nextLabel: 'Marcar Entregado',icon: <FiCheckCircle /> },
  delivered: { label: 'Entregado', next: null,        nextLabel: null,              icon: <FiCheckCircle /> }
};

const VendorOrders = () => {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [updatingItem,  setUpdatingItem]  = useState(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getVendorOrders();
      if (response.success) setOrders(response.orders);
    } catch (error) {
      toast.error('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, itemId, newStatus) => {
    try {
      setUpdatingItem(itemId);
      const response = await orderService.updateItemStatus(orderId, itemId, newStatus);
      if (response.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? response.order : o));
        toast.success(`Estado actualizado: ${STATUS_STEPS[newStatus]?.label}`);
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    } finally {
      setUpdatingItem(null);
    }
  };

  const filterButtons = [
    { value: 'all',       label: 'Todas'     },
    { value: 'paid',      label: 'Pagadas'   },
    { value: 'packed',    label: 'Empacadas' },
    { value: 'shipped',   label: 'Enviadas'  },
    { value: 'delivered', label: 'Entregadas'}
  ];

  // Filtrar items del vendedor actual
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.items?.some(item => item.status === filterStatus);
  });

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="vendor-orders">
      <Card
        title="Gestión de Órdenes"
        actions={
          <button onClick={loadOrders} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--secondary-color)' }}>
            <FiRefreshCw />
          </button>
        }
      >
        {/* Filtros */}
        <div className="orders-filter-bar">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              className={`filter-btn ${filterStatus === btn.value ? 'active' : ''}`}
              onClick={() => setFilterStatus(btn.value)}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Lista de órdenes */}
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--secondary-color)' }}>
            <FiPackage size={50} style={{ marginBottom:15 }} />
            <p>No hay órdenes con este estado</p>
          </div>
        ) : (
          <div className="vendor-orders-list">
            {filteredOrders.map(order => (
              <div key={order._id} className="vendor-order-card">
                {/* Header de la orden */}
                <div className="vorder-header">
                  <div>
                    <h3>Orden #{order._id?.slice(-8).toUpperCase()}</h3>
                    <span className="vorder-customer">
                      Cliente: {order.customer?.name || '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="vorder-date">{formatDate(order.createdAt)}</span>
                    <Link
                      to={`/vendedor/ordenes/${order._id}`}
                      style={{ fontSize: 13, color: 'var(--primary-color)', textDecoration: 'none' }}
                    >
                      Ver detalle →
                    </Link>
                  </div>
                </div>
                {/* Items del vendedor */}
                <div className="vorder-items">
                  {order.items?.map(item => {
                    const stepCfg = STATUS_STEPS[item.status] || STATUS_STEPS.paid;
                    return (
                      <div key={item._id} className="vorder-item">
                        <img
                          src={item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                          alt={item.name}
                        />
                        <div className="vorder-item-info">
                          <strong>{item.name}</strong>
                          <span>Cantidad: {item.quantity}</span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                        <div className="vorder-item-status">
                          <span className={`item-status-tag status-${item.status}`}>
                            {stepCfg.icon}
                            {stepCfg.label}
                          </span>
                          {stepCfg.next && (
                            <Button
                              variant="primary"
                              size="small"
                              loading={updatingItem === item._id}
                              onClick={() => handleUpdateStatus(order._id, item._id, stepCfg.next)}
                            >
                              {stepCfg.nextLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="vorder-footer">
                  <span>Total orden: <strong>{formatPrice(order.total)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default VendorOrders;