import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rmaService } from '../../services/rmaService';
import { formatPrice, formatDateTime } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FiArrowLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const STATUS_MAP = {
  requested: { label: 'Solicitada',  color: '#f59e0b' },
  approved:  { label: 'Aprobada',    color: '#3b82f6' },
  rejected:  { label: 'Rechazada',   color: '#ef4444' },
  received:  { label: 'Recibida',    color: '#8b5cf6' },
  refunded:  { label: 'Reembolsada', color: '#10b981' },
  cancelled: { label: 'Cancelada',   color: '#64748b' },
};

const REASON_MAP = {
  defective:        'Producto defectuoso',
  wrong_item:       'Producto equivocado',
  not_as_described: 'No es como se describe',
  changed_mind:     'Cambié de opinión',
  damaged:          'Llegó dañado',
  other:            'Otro motivo',
};

const SupportRMADetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [rma,        setRma]      = useState(null);
  const [loading,    setLoading]  = useState(true);
  const [updating,   setUpdating] = useState(false);
  const [notes,      setNotes]    = useState('');

  useEffect(() => { loadRMA(); }, [id]);

  const loadRMA = async () => {
    try {
      setLoading(true);
      const response = await rmaService.getRMAById(id);
      if (response.success) setRma(response.rma);
    } catch {
      toast.error('Error al cargar la devolución');
      navigate('/soporte/devoluciones');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!notes.trim() && newStatus === 'rejected') {
      toast.warning('Indicá el motivo del rechazo en las notas');
      return;
    }
    try {
      setUpdating(true);
      const response = await rmaService.updateStatus(id, newStatus, notes);
      if (response.success) {
        setRma(response.rma);
        setNotes('');
        toast.success(`RMA marcada como: ${STATUS_MAP[newStatus]?.label}`);
      }
    } catch {
      toast.error('Error al actualizar estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleEscalate = async () => {
    const reason = window.prompt('Motivo del escalamiento:');
    if (!reason?.trim()) return;
    try {
      const response = await rmaService.escalateRMA(id, 'admin', reason);
      if (response.success) {
        setRma(prev => ({ ...prev, escalated: true }));
        toast.success('RMA escalada al administrador');
      }
    } catch {
      toast.error('Error al escalar RMA');
    }
  };

  const handleAssign = async () => {
    try {
      const response = await rmaService.assignRMA(id);
      if (response.success) {
        await loadRMA();
        toast.success('RMA asignada a ti');
      }
    } catch {
      toast.error('Error al asignar RMA');
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!rma)    return <div>RMA no encontrada</div>;

  const cfg         = STATUS_MAP[rma.status] || STATUS_MAP.requested;
  const totalAmount = rma.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;
  const isFinal     = ['refunded', 'rejected', 'cancelled'].includes(rma.status);

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
        <Button variant="secondary" icon={<FiArrowLeft />}
          onClick={() => navigate('/soporte/devoluciones')}
        >
          Volver
        </Button>
        <h1 style={{ margin:0 }}>
          Devolución RMA #{rma._id?.slice(-6).toUpperCase()}
          {rma.escalated && (
            <span style={{
              marginLeft:10, background:'#fef3c7', color:'#d97706',
              fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:12
            }}>
              ⬆️ Escalada
            </span>
          )}
        </h1>
      </div>

      {/* ── Info general ── */}
      <Card title="Información General" style={{ marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
          <div><strong>Cliente</strong><p>{rma.customer?.name}</p></div>
          <div><strong>Email</strong><p>{rma.customer?.email}</p></div>
          <div>
            <strong>Estado</strong>
            <p>
              <span style={{
                background:`${cfg.color}15`, color:cfg.color,
                padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:700
              }}>
                {cfg.label}
              </span>
            </p>
          </div>
          <div><strong>Fecha solicitud</strong><p>{formatDateTime(rma.createdAt)}</p></div>
          <div><strong>Motivo</strong><p>{REASON_MAP[rma.reason] || rma.reason}</p></div>
          <div>
            <strong>Monto Total</strong>
            <p style={{ color:'var(--primary-color)', fontWeight:700 }}>
              {formatPrice(totalAmount)}
            </p>
          </div>
        </div>
        {rma.reasonDescription && (
          <div style={{ marginTop:16 }}>
            <strong>Descripción del cliente:</strong>
            <p style={{ marginTop:6, color:'var(--secondary-color)', lineHeight:1.6 }}>
              {rma.reasonDescription}
            </p>
          </div>
        )}
        <div style={{ marginTop:16 }}>
          <strong>Asignado a: </strong>
          {rma.assignedTo
            ? rma.assignedTo.name
            : <Button variant="secondary" size="small" onClick={handleAssign}>Asignarme</Button>
          }
        </div>
      </Card>

      {/* ── Productos ── */}
      <Card title="Productos a Devolver" style={{ marginBottom:20 }}>
        {rma.items?.map((item, i) => (
          <div key={i} style={{ display:'flex', gap:16, padding:'12px 0', borderBottom:'1px solid var(--border-color)' }}>
            <img
              src={item.product?.images?.[0] || 'https://via.placeholder.com/60'}
              alt={item.product?.name}
              style={{ width:60, height:60, objectFit:'cover', borderRadius:8 }}
            />
            <div>
              <strong>{item.product?.name || 'Producto'}</strong>
              <p style={{ margin:'4px 0', color:'var(--secondary-color)' }}>
                Cantidad: {item.quantity} · Precio unitario: {formatPrice(item.price)}
              </p>
              <p style={{ margin:0, fontWeight:700 }}>
                Subtotal: {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </Card>

      {/* ── Evidencia ── */}
      {rma.evidence?.length > 0 && (
        <Card title="Evidencia Adjunta" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {rma.evidence.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer"
                style={{ color:'var(--primary-color)' }}
              >
                📎 Evidencia {i + 1}
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* ── Historial ── */}
      {rma.statusHistory?.length > 0 && (
        <Card title="Historial de Estados" style={{ marginBottom:20 }}>
          {rma.statusHistory.map((h, i) => {
            const hCfg = STATUS_MAP[h.status] || STATUS_MAP.requested;
            return (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border-color)' }}>
                <span style={{ background:`${hCfg.color}15`, color:hCfg.color,
                  padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700, whiteSpace:'nowrap'
                }}>
                  {hCfg.label}
                </span>
                <span style={{ fontSize:12, color:'var(--secondary-color)' }}>
                  {formatDateTime(h.changedAt)}
                </span>
                {h.notes && <span style={{ fontSize:12, fontStyle:'italic' }}>{h.notes}</span>}
              </div>
            );
          })}
        </Card>
      )}

      {/* ── Acciones ── */}
      {!isFinal && (
        <Card title="Acciones">
          {['requested', 'received'].includes(rma.status) && (
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', marginBottom:6, fontWeight:600 }}>
                Notas / Motivo de decisión
              </label>
              <textarea
                rows="3"
                style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid var(--border-color)' }}
                placeholder="Requerido para rechazar..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          )}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {rma.status === 'requested' && (
              <>
                <Button variant="success" icon={<FiCheckCircle />} loading={updating}
                  onClick={() => handleUpdateStatus('approved')}
                >
                  Aprobar Devolución
                </Button>
                <Button variant="danger" icon={<FiXCircle />} loading={updating}
                  onClick={() => handleUpdateStatus('rejected')}
                >
                  Rechazar Devolución
                </Button>
              </>
            )}
            {rma.status === 'approved' && (
              <Button variant="primary" loading={updating}
                onClick={() => handleUpdateStatus('received')}
              >
                Marcar como Recibida
              </Button>
            )}
            {rma.status === 'received' && (
              <Button variant="success" icon={<FiCheckCircle />} loading={updating}
                onClick={() => handleUpdateStatus('refunded')}
              >
                Confirmar Reembolso
              </Button>
            )}
            {!rma.escalated && (
              <Button variant="warning" onClick={handleEscalate}>
                ⬆️ Escalar a Admin
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SupportRMADetail;