import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth }       from '../../context/AuthContext';
import { formatPrice, formatDate, formatDateTime } from '../../utils/formatters';
import { FiArrowLeft, FiPackage, FiTruck, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Card   from '../../components/common/Card';
import { toast } from 'react-toastify';
import './VendorOrders.css';

const STATUS_STEPS = {
  paid:      { label: 'Pagado',    next: 'packed',    nextLabel: 'Marcar Empacado',  icon: '💳', color: '#3b82f6' },
  packed:    { label: 'Empacado',  next: 'shipped',   nextLabel: 'Marcar Enviado',   icon: '📦', color: '#f59e0b' },
  shipped:   { label: 'Enviado',   next: 'delivered', nextLabel: 'Marcar Entregado', icon: '🚚', color: '#8b5cf6' },
  delivered: { label: 'Entregado', next: null,        nextLabel: null,               icon: '✅', color: '#10b981' }
};

const VendorOrderDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [order,        setOrder]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);

  useEffect(() => { loadOrder(); }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrderById(id);
      if (res.success) setOrder(res.order);
    } catch {
      toast.error('Error al cargar la orden');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (itemId, newStatus) => {
    try {
      setUpdatingItem(itemId);
      const res = await orderService.updateItemStatus(id, itemId, newStatus);
      if (res.success) {
        setOrder(res.order);
        toast.success(`Estado actualizado: ${STATUS_STEPS[newStatus]?.label}`);
      }
    } catch {
      toast.error('Error al actualizar estado');
    } finally {
      setUpdatingItem(null);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  if (!order) {
    return (
      <div style={{ padding: 24 }}>
        <Button variant="secondary" icon={<FiArrowLeft />} onClick={() => navigate('/vendedor/ordenes')}>
          Volver
        </Button>
        <p style={{ marginTop: 20 }}>Orden no encontrada</p>
      </div>
    );
  }

  // Filtrar solo los ítems de este vendedor
  const myItems = order.items?.filter(
    item => item.vendor === user?._id ||
            item.vendor?._id === user?._id ||
            String(item.vendor) === String(user?._id)
  ) || [];

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/vendedor/ordenes')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
                   color: 'var(--primary-color)', display: 'flex',
                   alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 12 }}
        >
          <FiArrowLeft /> Volver a mis órdenes
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
              Orden #{order._id?.slice(-8).toUpperCase()}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--secondary-color)', fontSize: 14 }}>
              Cliente: <strong>{order.customer?.name}</strong> · {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={loadOrder}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--secondary-color)' }}
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Mis Productos en esta orden */}
      <Card title={`Mis Productos (${myItems.length})`}>
        {myItems.length === 0 ? (
          <p style={{ color: 'var(--secondary-color)', textAlign: 'center', padding: 20 }}>
            No tienes productos en esta orden
          </p>
        ) : (
          <div className="vorder-items">
            {myItems.map(item => {
              const step = STATUS_STEPS[item.status] || STATUS_STEPS.paid;
              return (
                <div key={item._id} className="vorder-item">
                  <img
                    src={item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                    alt={item.name}
                  />
                  <div className="vorder-item-info">
                    <strong>{item.name}</strong>
                    <span>Cantidad: {item.quantity}</span>
                    <span>{formatPrice(item.price)} c/u · Total: {formatPrice(item.price * item.quantity)}</span>
                  </div>
                  <div className="vorder-item-status">
                    <span
                      className={`item-status-tag status-${item.status}`}
                      style={{ borderLeft: `4px solid ${step.color}` }}
                    >
                      {step.icon} {step.label}
                    </span>
                    {step.next && (
                      <Button
                        variant="primary" size="small"
                        loading={updatingItem === item._id}
                        onClick={() => handleUpdateStatus(item._id, step.next)}
                      >
                        {step.nextLabel}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Historial de estados */}
      {myItems.map(item => (
        item.statusHistory?.length > 0 && (
          <Card key={item._id + '_hist'} title={`Historial — ${item.name}`} style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...item.statusHistory].reverse().map((h, i) => {
                const s = STATUS_STEPS[h.status] || {};
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20 }}>{s.icon || '📋'}</span>
                    <div>
                      <strong style={{ color: s.color || 'var(--text-color)' }}>{s.label || h.status}</strong>
                      <p style={{ margin: '2px 0', fontSize: 13, color: 'var(--secondary-color)' }}>
                        {formatDateTime(h.changedAt)}
                        {h.notes && ` · ${h.notes}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )
      ))}

      {/* Dirección de envío */}
      {order.shippingAddress && (
        <Card title="Dirección de envío" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14 }}>
            {[
              ['Destinatario', order.shippingAddress.fullName],
              ['Dirección',    order.shippingAddress.address],
              ['Ciudad',       order.shippingAddress.city],
              ['País',         order.shippingAddress.country],
              ['Teléfono',     order.shippingAddress.phone],
              ['Código postal',order.shippingAddress.zipCode]
            ].map(([label, value]) => value ? (
              <div key={label}>
                <span style={{ color: 'var(--secondary-color)' }}>{label}:</span>
                <strong style={{ display: 'block' }}>{value}</strong>
              </div>
            ) : null)}
          </div>
        </Card>
      )}
    </div>
  );
};

export default VendorOrderDetail;