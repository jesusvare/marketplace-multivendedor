import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiClock, FiUser, FiSend, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { ticketService } from '../../services/ticketService';
import { useAuth }        from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';
import { toast }          from 'react-toastify';
import './SupportTickets.css';

/**
 * Gestión de tickets — conectado al backend real
 * Agente de soporte puede: ver, asignar, responder, cambiar estado, escalar
 */
const SupportTickets = () => {
  const { user }                                    = useAuth();
  const [tickets,        setTickets]                = useState([]);
  const [loading,        setLoading]                = useState(true);
  const [selectedTicket, setSelectedTicket]         = useState(null);
  const [showModal,      setShowModal]              = useState(false);
  const [filterStatus,   setFilterStatus]           = useState('all');
  const [filterPriority, setFilterPriority]         = useState('all');
  const [newMessage,     setNewMessage]             = useState('');
  const [sending,        setSending]                = useState(false);
  const [updatingStatus, setUpdatingStatus]         = useState(false);

  useEffect(() => { loadTickets(); }, [filterStatus, filterPriority]);

  /* ─── Carga de tickets ───────────────────────────────────────────── */
  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus   !== 'all') params.status   = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;

      const response = await ticketService.getAllTickets(params);
      if (response.success) setTickets(response.tickets);
    } catch (error) {
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Ver conversación ───────────────────────────────────────────── */
  const handleViewTicket = async (ticket) => {
    try {
      const response = await ticketService.getTicketById(ticket._id);
      if (response.success) {
        setSelectedTicket(response.ticket);
        setShowModal(true);
      }
    } catch (error) {
      // Si falla, usar el ticket de la lista
      setSelectedTicket(ticket);
      setShowModal(true);
    }
  };

  /* ─── Asignarme el ticket ───────────────────────────────────────── */
  const handleAssignToMe = async (ticketId) => {
    try {
      const response = await ticketService.assignTicket(ticketId);
      if (response.success) {
        setTickets(prev => prev.map(t =>
          t._id === ticketId
            ? { ...t, assignedTo: { _id: user._id, name: user.name }, status: 'in_progress' }
            : t
        ));
        toast.success('Ticket asignado a ti');
      }
    } catch (error) {
      toast.error('Error al asignar ticket');
    }
  };

  /* ─── Cambiar estado ────────────────────────────────────────────── */
  const handleStatusChange = async (ticketId, newStatus, notes = '') => {
    try {
      setUpdatingStatus(true);
      const response = await ticketService.updateStatus(ticketId, newStatus, notes);
      if (response.success) {
        setTickets(prev => prev.map(t =>
          t._id === ticketId ? { ...t, status: newStatus } : t
        ));
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(prev => ({ ...prev, status: newStatus }));
        }
        toast.success(`Estado cambiado a: ${STATUS_MAP[newStatus]?.label}`);
      }
    } catch (error) {
      toast.error('Error al cambiar estado');
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* ─── Enviar mensaje ────────────────────────────────────────────── */
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      setSending(true);
      const response = await ticketService.addMessage(selectedTicket._id, newMessage);
      if (response.success) {
        setSelectedTicket(response.ticket);
        setTickets(prev => prev.map(t =>
          t._id === selectedTicket._id ? { ...t, status: response.ticket.status } : t
        ));
        setNewMessage('');
        toast.success('Respuesta enviada');
      }
    } catch (error) {
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  /* ─── Escalar a admin ───────────────────────────────────────────── */
  const handleEscalate = async (ticketId) => {
    const reason = window.prompt('Motivo del escalamiento al administrador:');
    if (!reason) return;
    try {
      const response = await ticketService.escalateTicket(ticketId, null, reason);
      if (response.success) {
        setTickets(prev => prev.map(t =>
          t._id === ticketId ? { ...t, escalated: true } : t
        ));
        toast.success('Ticket escalado al administrador');
        setShowModal(false);
      }
    } catch (error) {
      toast.error('Error al escalar ticket');
    }
  };

  /* ─── Helpers de estado ─────────────────────────────────────────── */
  const STATUS_MAP = {
    open:             { label: 'Abierto',            color: '#ef4444', next: 'in_progress',      nextLabel: 'Tomar ticket'    },
    in_progress:      { label: 'En Progreso',         color: '#3b82f6', next: 'waiting_customer', nextLabel: 'Esperar cliente' },
    waiting_customer: { label: 'Esperando cliente',   color: '#f59e0b', next: 'resolved',         nextLabel: 'Marcar resuelto' },
    resolved:         { label: 'Resuelto',            color: '#10b981', next: 'closed',           nextLabel: 'Cerrar ticket'   },
    closed:           { label: 'Cerrado',             color: '#64748b', next: null,               nextLabel: null              }
  };

  const PRIORITY_MAP = {
    urgent: { label: '🔴 Urgente', color: '#ef4444' },
    high:   { label: '🟠 Alta',    color: '#f97316' },
    medium: { label: '🟡 Media',   color: '#f59e0b' },
    low:    { label: '🟢 Baja',    color: '#10b981' }
  };

  const CATEGORY_MAP = {
    order_issue:     'Problema con orden',
    product_inquiry: 'Consulta de producto',
    refund:          'Devolución',
    technical:       'Técnico',
    other:           'Otro'
  };

  // Contadores por estado
  const counts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const statusFilters = [
    { value: 'all',             label: 'Todos',    count: tickets.length          },
    { value: 'open',            label: 'Abiertos', count: counts.open || 0        },
    { value: 'in_progress',     label: 'En curso', count: counts.in_progress || 0 },
    { value: 'waiting_customer',label: 'Esperando',count: counts.waiting_customer || 0 },
    { value: 'resolved',        label: 'Resueltos',count: counts.resolved || 0    }
  ];

  return (
    <div className="support-tickets">
      <Card
        title={`Tickets de Soporte (${tickets.length})`}
        actions={
          <button onClick={loadTickets}
            style={{ background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--secondary-color)' }}
            title="Actualizar"
          >
            <FiRefreshCw />
          </button>
        }
      >
        {/* ── Filtros ── */}
        <div className="tickets-filter-bar">
          <div className="tickets-filters">
            {statusFilters.map(f => (
              <button
                key={f.value}
                className={`filter-btn ${filterStatus === f.value ? 'active' : ''}`}
                onClick={() => setFilterStatus(f.value)}
              >
                {f.label}
                <span className="filter-count">{f.count}</span>
              </button>
            ))}
          </div>
          <select
            className="priority-filter"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="all">Todas las prioridades</option>
            <option value="urgent">🔴 Urgente</option>
            <option value="high">🟠 Alta</option>
            <option value="medium">🟡 Media</option>
            <option value="low">🟢 Baja</option>
          </select>
        </div>

        {/* ── Lista de tickets ── */}
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'var(--secondary-color)' }}>
            <FiMessageSquare size={50} style={{ marginBottom: 15 }} />
            <p>No hay tickets con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="tickets-list">
            {tickets.map(ticket => {
              const statusCfg   = STATUS_MAP[ticket.status]   || STATUS_MAP.open;
              const priorityCfg = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium;
              return (
                <div
                  key={ticket._id}
                  className={`ticket-card ${ticket.escalated ? 'escalated' : ''}`}
                >
                  <div className="ticket-header">
                    <div className="ticket-info">
                      <div className="ticket-id-priority">
                        <h3>#{ticket._id?.slice(-6).toUpperCase()}</h3>
                        <span style={{ color: priorityCfg.color, fontSize: 12, fontWeight: 700 }}>
                          {priorityCfg.label}
                        </span>
                        {ticket.escalated && (
                          <span className="escalated-badge">⬆️ Escalado</span>
                        )}
                      </div>
                      <p className="ticket-subject">{ticket.subject}</p>
                      <div className="ticket-meta">
                        <span><FiUser size={13} /> {ticket.customer?.name || '—'}</span>
                        <span><FiClock size={13} /> {formatDateTime(ticket.createdAt)}</span>
                        <span>{CATEGORY_MAP[ticket.category] || ticket.category}</span>
                        <span>{ticket.messages?.length || 0} mensajes</span>
                      </div>
                    </div>
                    <span
                      className="status-badge"
                      style={{ background:`${statusCfg.color}15`, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="ticket-footer">
                    <div className="ticket-assignment">
                      {ticket.assignedTo ? (
                        <span>
                          Asignado a: <strong>{ticket.assignedTo.name}</strong>
                          {ticket.assignedTo._id === user?._id && ' (tú)'}
                        </span>
                      ) : (
                        <Button variant="secondary" size="small"
                          onClick={() => handleAssignToMe(ticket._id)}
                        >
                          Asignarme
                        </Button>
                      )}
                    </div>
                    <div className="ticket-actions">
                      {statusCfg.next && (
                        <Button
                          variant="primary" size="small"
                          loading={updatingStatus}
                          onClick={() => handleStatusChange(ticket._id, statusCfg.next)}
                        >
                          {statusCfg.nextLabel}
                        </Button>
                      )}
                      <Button
                        variant="secondary" size="small"
                        icon={<FiMessageSquare />}
                        onClick={() => handleViewTicket(ticket)}
                      >
                        Conversación
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ══════════════════════════════════════ */}
      {/* MODAL: Conversación completa           */}
      {/* ══════════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedTicket(null); setNewMessage(''); }}
        title={selectedTicket ? `Ticket #${selectedTicket._id?.slice(-6).toUpperCase()} — ${selectedTicket.subject}` : ''}
        size="large"
      >
        {selectedTicket && (
          <div className="ticket-conversation">
            {/* Info del ticket */}
            <div className="conversation-header">
              <div className="conv-info">
                <p>
                  <strong>Cliente:</strong> {selectedTicket.customer?.name}
                  ({selectedTicket.customer?.email})
                </p>
                {selectedTicket.order && (
                  <p><strong>Orden:</strong> #{selectedTicket.order._id?.slice(-8).toUpperCase()}</p>
                )}
                <p><strong>Categoría:</strong> {CATEGORY_MAP[selectedTicket.category]}</p>
              </div>
              <div className="conv-actions-top">
                <span
                  className="status-badge"
                  style={{
                    background: `${STATUS_MAP[selectedTicket.status]?.color}15`,
                    color:       STATUS_MAP[selectedTicket.status]?.color
                  }}
                >
                  {STATUS_MAP[selectedTicket.status]?.label}
                </span>
                {!selectedTicket.escalated && selectedTicket.status !== 'closed' && (
                  <Button
                    variant="danger" size="small"
                    icon={<FiAlertCircle />}
                    onClick={() => handleEscalate(selectedTicket._id)}
                  >
                    Escalar a Admin
                  </Button>
                )}
              </div>
            </div>

            {/* Mensajes */}
            <div className="messages-list">
              {selectedTicket.messages?.map((msg, i) => {
                const isClient = msg.senderRole === 'client';
                return (
                  <div key={i} className={`message ${isClient ? 'customer' : 'agent'}`}>
                    <div className="message-header">
                      <strong>{msg.sender?.name || (isClient ? 'Cliente' : 'Agente')}</strong>
                      <span className="message-time">{formatDateTime(msg.timestamp)}</span>
                    </div>
                    <p>{msg.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Responder */}
            {selectedTicket.status !== 'closed' && (
              <div className="reply-form">
                <textarea
                  className="custom-input reply-textarea"
                  rows="3"
                  placeholder="Escribe tu respuesta al cliente..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSendMessage(); }}
                />
                <div className="reply-actions">
                  <span style={{ fontSize: 12, color: 'var(--secondary-color)' }}>Ctrl+Enter para enviar</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {/* Acciones de estado */}
                    {STATUS_MAP[selectedTicket.status]?.next && (
                      <Button
                        variant="secondary" size="small"
                        loading={updatingStatus}
                        onClick={() => handleStatusChange(
                          selectedTicket._id,
                          STATUS_MAP[selectedTicket.status].next
                        )}
                      >
                        {STATUS_MAP[selectedTicket.status].nextLabel}
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      icon={<FiSend />}
                      loading={sending}
                      onClick={handleSendMessage}
                    >
                      Enviar Respuesta
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedTicket.status === 'closed' && (
              <div className="closed-notice">
                <FiMessageSquare />
                <span>Este ticket está cerrado.</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupportTickets;