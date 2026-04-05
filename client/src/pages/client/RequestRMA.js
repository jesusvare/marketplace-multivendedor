import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { rmaService }   from '../../services/rmaService';
import { formatPrice, formatDate } from '../../utils/formatters';
import { FiPackage, FiSend, FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Card   from '../../components/common/Card';
import { toast } from 'react-toastify';
import './RequestRMA.css';

const REASONS = [
  { value: 'defective',        label: 'Producto defectuoso'      },
  { value: 'wrong_item',       label: 'Producto equivocado'       },
  { value: 'not_as_described', label: 'No coincide con la imagen' },
  { value: 'damaged',          label: 'Llegó dañado'              },
  { value: 'changed_mind',     label: 'Cambié de opinión'         },
  { value: 'other',            label: 'Otro motivo'               }
];

const RequestRMA = () => {
  const navigate = useNavigate();

  const [orders,       setOrders]       = useState([]);
  const [loadingOrders,setLoadingOrders]= useState(true);
  const [selectedOrder,setSelectedOrder]= useState(null);
  const [selectedItems,setSelectedItems]= useState({});  // { itemId: quantity }
  const [form, setForm] = useState({
    reason:            '',
    reasonDescription: '',
    evidence:          ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEligibleOrders();
  }, []);

  // Solo órdenes donde al menos un ítem fue entregado
  const loadEligibleOrders = async () => {
    try {
      const res = await orderService.getMyOrders();
      if (res.success) {
        const eligible = (res.orders || []).filter(o =>
          o.items?.some(i => i.status === 'delivered')
        );
        setOrders(eligible);
      }
    } catch {
      toast.error('Error al cargar órdenes');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setSelectedItems({});
  };

  const toggleItem = (itemId) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      if (updated[itemId]) {
        delete updated[itemId];
      } else {
        const item = selectedOrder.items.find(i => i._id === itemId);
        updated[itemId] = item?.quantity || 1;
      }
      return updated;
    });
  };

  const updateItemQty = (itemId, qty) => {
    const item    = selectedOrder.items.find(i => i._id === itemId);
    const maxQty  = item?.quantity || 1;
    const clamped = Math.max(1, Math.min(maxQty, Number(qty)));
    setSelectedItems(prev => ({ ...prev, [itemId]: clamped }));
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!selectedOrder) {
      toast.warning('Selecciona una orden'); return;
    }
    const itemsSelected = Object.keys(selectedItems);
    if (itemsSelected.length === 0) {
      toast.warning('Selecciona al menos un producto'); return;
    }
    if (!form.reason) {
      toast.warning('Indica el motivo de la devolución'); return;
    }
    if (!form.reasonDescription.trim()) {
      toast.warning('Describe el problema con más detalle'); return;
    }

    try {
      setSubmitting(true);

      // Construir items para el payload
      const rmaItems = itemsSelected.map(itemId => {
        const item = selectedOrder.items.find(i => i._id === itemId);
        return {
          orderItem: itemId,
          product:   item.product?._id || item.product,
          quantity:  selectedItems[itemId]
        };
      });

      const payload = {
        orderId:           selectedOrder._id,
        items:             rmaItems,
        reason:            form.reason,
        reasonDescription: form.reasonDescription,
        evidence:          form.evidence ? [form.evidence] : []
      };

      const res = await rmaService.createRMA(payload);
      if (res.success) {
        toast.success('Solicitud de devolución enviada correctamente');
        navigate('/cliente/ordenes');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Paso 1: elegir orden ──
  if (!selectedOrder) {
    return (
      <div className="request-rma-page">
        <div className="rma-header">
          <button className="back-btn" onClick={() => navigate('/cliente/ordenes')}>
            <FiArrowLeft /> Volver a mis órdenes
          </button>
          <h1>Solicitar Devolución</h1>
          <p>Selecciona la orden que contiene el producto a devolver</p>
        </div>

        {loadingOrders ? (
          <div className="loading"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-color)' }}>
              <FiPackage size={50} style={{ marginBottom: 15 }} />
              <p>No tienes órdenes con productos entregados disponibles para devolución.</p>
              <Button variant="secondary" onClick={() => navigate('/cliente/ordenes')}>
                Ver mis órdenes
              </Button>
            </div>
          </Card>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <Card
                key={order._id}
                className="order-card-selectable"
                onClick={() => handleSelectOrder(order)}
              >
                <div className="order-select-header">
                  <div>
                    <strong>Orden #{order._id.slice(-8).toUpperCase()}</strong>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className="order-total">{formatPrice(order.total)}</span>
                </div>
                <div className="order-items-preview">
                  {order.items?.filter(i => i.status === 'delivered').map(item => (
                    <span key={item._id} className="item-chip">
                      {item.name} ×{item.quantity}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Pasos 2 y 3: seleccionar ítems + motivo ──
  const deliveredItems = selectedOrder.items?.filter(i => i.status === 'delivered') || [];

  return (
    <div className="request-rma-page">
      <div className="rma-header">
        <button className="back-btn" onClick={() => setSelectedOrder(null)}>
          <FiArrowLeft /> Cambiar orden
        </button>
        <h1>Solicitar Devolución</h1>
        <p>Orden #{selectedOrder._id.slice(-8).toUpperCase()} — {formatDate(selectedOrder.createdAt)}</p>
      </div>

      <div className="rma-form">
        {/* Selección de ítems */}
        <Card title="Paso 1 — ¿Qué productos quieres devolver?">
          <div className="items-list">
            {deliveredItems.map(item => {
              const isSelected = !!selectedItems[item._id];
              return (
                <div
                  key={item._id}
                  className={`item-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleItem(item._id)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItem(item._id)}
                    onClick={e => e.stopPropagation()}
                  />
                  <img
                    src={item.product?.images?.[0] || 'https://via.placeholder.com/55'}
                    alt={item.name}
                  />
                  <div className="item-info">
                    <strong>{item.name}</strong>
                    <span>{formatPrice(item.price)} × {item.quantity}</span>
                  </div>
                  {isSelected && (
                    <div className="qty-selector" onClick={e => e.stopPropagation()}>
                      <label>Cantidad a devolver:</label>
                      <input
                        type="number"
                        min={1} max={item.quantity}
                        value={selectedItems[item._id]}
                        onChange={e => updateItemQty(item._id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Motivo */}
        <Card title="Paso 2 — Motivo de devolución">
          <div className="form-group">
            <label>Motivo *</label>
            <select
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            >
              <option value="">Selecciona un motivo...</option>
              {REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Descripción detallada *</label>
            <textarea
              rows={4}
              className="custom-input"
              placeholder="Describe el problema con el mayor detalle posible..."
              value={form.reasonDescription}
              onChange={e => setForm(f => ({ ...f, reasonDescription: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Evidencia — URL de imagen (opcional)</label>
            <input
              type="url"
              className="custom-input"
              placeholder="https://..."
              value={form.evidence}
              onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            />
            <small>Puedes subir la foto a Imgur, Google Fotos o cualquier servicio y pegar el enlace.</small>
          </div>
        </Card>

        {/* Resumen y enviar */}
        <Card title="Resumen">
          <div className="summary-row">
            <span>Productos seleccionados:</span>
            <strong>{Object.keys(selectedItems).length}</strong>
          </div>
          <div className="summary-row">
            <span>Monto estimado:</span>
            <strong>
              {formatPrice(
                Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
                  const item = selectedOrder.items.find(i => i._id === itemId);
                  return sum + (item?.price || 0) * qty;
                }, 0)
              )}
            </strong>
          </div>
          <p style={{ fontSize: 13, color: 'var(--secondary-color)', marginTop: 10 }}>
            Un agente de soporte revisará tu solicitud y te notificará la decisión.
          </p>
          <Button
            variant="primary" fullWidth
            icon={<FiSend />}
            loading={submitting}
            onClick={handleSubmit}
          >
            Enviar Solicitud de Devolución
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default RequestRMA;