import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ticketService } from '../../services/ticketService';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { toast } from 'react-toastify';
import {
  FiPlus,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiSend
} from 'react-icons/fi';
import './MyTickets.css';

/**
 * Mis Tickets de Soporte
 * El cliente puede ver sus tickets, abrir nuevos y responder
 */
const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Formulario nuevo ticket
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getMyTickets();
      if (response.success) setTickets(response.tickets);
    } catch (error) {
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.warning('Completa todos los campos requeridos');
      return;
    }
    try {
      const response = await ticketService.createTicket(newTicket);
      if (response.success) {
        setTickets(prev => [response.ticket, ...prev]);
        setNewTicket({ subject: '', description: '', category: 'other', priority: 'medium' });
        setShowNewModal(false);
        toast.success('Ticket creado exitosamente');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear el ticket');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      setSendingMessage(true);
      const response = await ticketService.addMessage(selectedTicket._id, newMessage);
      if (response.success) {
        setSelectedTicket(response.ticket);
        setTickets(prev =>
          prev.map(t => t._id === selectedTicket._id ? response.ticket : t)
        );
        setNewMessage('');
      }
    } catch (error) {
      toast.error('Error al enviar mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  // Helpers de estado y prioridad
  const getStatusConfig = (status) => ({
    open:             { label: 'Abierto',           color: '#ef4444', icon: <FiAlertCircle /> },
    in_progress:      { label: 'En Progreso',        color: '#3b82f6', icon: <FiClock />       },
    waiting_customer: { label: 'Esperando respuesta',color: '#f59e0b', icon: <FiClock />       },
    resolved:         { label: 'Resuelto',           color: '#10b981', icon: <FiCheckCircle /> },
    closed:           { label: 'Cerrado',            color: '#64748b', icon: <FiCheckCircle /> }
  }[status] || { label: status, color: '#64748b', icon: <FiClock /> });

  const getPriorityLabel = (p) =>
    ({ high: '🔴 Alta', medium: '🟡 Media', low: '🟢 Baja' }[p] || p);

  const getCategoryLabel = (c) => ({
    order_issue:     'Problema con orden',
    product_inquiry: 'Consulta de producto',
    refund:          'Devolución',
    technical:       'Técnico',
    other:           'Otro'
  }[c] || c);

  const filteredTickets = filterStatus === 'all'
    ? tickets
    : tickets.filter(t => t.status === filterStatus);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="my-tickets-page">
      {/* Header */}
      <div className="tickets-page-header">
        <div>
          <h1><FiMessageSquare /> Mis Tickets de Soporte</h1>
          <p>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} en total</p>
        </div>
        <Button
          variant="primary"
          icon={<FiPlus />}
          onClick={() => setShowNewModal(true)}
        >
          Nuevo Ticket
        </Button>
      </div>

      {/* Filtros */}
      <div className="tickets-filters">
        {[
          { value: 'all',         label: 'Todos'     },
          { value: 'open',        label: 'Abiertos'  },
          { value: 'in_progress', label: 'En Progreso'},
          { value: 'resolved',    label: 'Resueltos' },
          { value: 'closed',      label: 'Cerrados'  }
        ].map(f => (
          <button
            key={f.value}
            className={`filter-btn ${filterStatus === f.value ? 'active' : ''}`}
            onClick={() => setFilterStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de tickets */}
      {filteredTickets.length === 0 ? (
        <div className="empty-tickets">
          <FiMessageSquare size={60} />
          <h3>No tienes tickets</h3>
          <p>¿Tienes algún problema? Abre un ticket y te ayudamos</p>
          <Button variant="primary" icon={<FiPlus />} onClick={() => setShowNewModal(true)}>
            Crear Ticket
          </Button>
        </div>
      ) : (
        <div className="tickets-grid">
          {filteredTickets.map(ticket => {
            const statusCfg = getStatusConfig(ticket.status);
            return (
              <Card key={ticket._id} className="ticket-card-client">
                <div className="ticket-card-header">
                  <div className="ticket-subject-row">
                    <h3>{ticket.subject}</h3>
                    <span
                      className="ticket-status-pill"
                      style={{ background: `${statusCfg.color}15`, color: statusCfg.color }}
                    >
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="ticket-meta-row">
                    <span className="ticket-category">{getCategoryLabel(ticket.category)}</span>
                    <span className="ticket-priority">{getPriorityLabel(ticket.priority)}</span>
                    <span className="ticket-date">{formatDateTime(ticket.createdAt)}</span>
                  </div>
                </div>

                <p className="ticket-preview">{ticket.description}</p>

                <div className="ticket-card-footer">
                  <div className="ticket-messages-count">
                    <FiMessageSquare size={14} />
                    <span>{ticket.messages?.length || 0} mensajes</span>
                    {ticket.assignedTo && (
                      <span className="assigned-agent">
                        · Atendido por: {ticket.assignedTo.name}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => { setSelectedTicket(ticket); setShowDetailModal(true); }}
                  >
                    Ver Conversación
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ======================== */}
      {/* MODAL: Nuevo Ticket      */}
      {/* ======================== */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nuevo Ticket de Soporte"
        size="medium"
      >
        <div className="new-ticket-form">
          <Input
            label="Asunto"
            required
            placeholder="Describe brevemente tu problema"
            value={newTicket.subject}
            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
          />

          <div className="form-row-2">
            <div className="input-group">
              <label className="input-label">Categoría</label>
              <select
                className="custom-input"
                value={newTicket.category}
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
              >
                <option value="order_issue">Problema con orden</option>
                <option value="product_inquiry">Consulta de producto</option>
                <option value="refund">Devolución</option>
                <option value="technical">Técnico</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Prioridad</label>
              <select
                className="custom-input"
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              >
                <option value="low">🟢 Baja</option>
                <option value="medium">🟡 Media</option>
                <option value="high">🔴 Alta</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">
              Descripción detallada <span className="required">*</span>
            </label>
            <textarea
              className="custom-input"
              rows="5"
              placeholder="Describe tu problema con el mayor detalle posible..."
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" icon={<FiSend />} onClick={handleCreateTicket}>
              Enviar Ticket
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================== */}
      {/* MODAL: Detalle y Respuesta */}
      {/* ========================== */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedTicket(null); }}
        title={selectedTicket ? `Ticket: ${selectedTicket.subject}` : ''}
        size="large"
      >
        {selectedTicket && (
          <div className="ticket-conversation-view">
            {/* Info del ticket */}
            <div className="ticket-info-bar">
              <span
                className="ticket-status-pill"
                style={{
                  background: `${getStatusConfig(selectedTicket.status).color}15`,
                  color: getStatusConfig(selectedTicket.status).color
                }}
              >
                {getStatusConfig(selectedTicket.status).icon}
                {getStatusConfig(selectedTicket.status).label}
              </span>
              <span className="ticket-category">
                {getCategoryLabel(selectedTicket.category)}
              </span>
              <span className="ticket-priority">
                {getPriorityLabel(selectedTicket.priority)}
              </span>
              {selectedTicket.assignedTo && (
                <span className="ticket-agent">
                  Agente: {selectedTicket.assignedTo.name}
                </span>
              )}
            </div>

            {/* Mensajes */}
            <div className="conversation-messages">
              {selectedTicket.messages.map((msg) => {
                const isClient = msg.senderRole === 'client';
                return (
                  <div
                    key={msg._id}
                    className={`message-bubble ${isClient ? 'client-msg' : 'agent-msg'}`}
                  >
                    <div className="bubble-header">
                      <strong>{msg.sender?.name}</strong>
                      <span>{formatDateTime(msg.timestamp)}</span>
                    </div>
                    <p>{msg.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Responder (solo si no está cerrado/resuelto) */}
            {!['closed', 'resolved'].includes(selectedTicket.status) && (
              <div className="reply-area">
                <textarea
                  className="custom-input reply-input"
                  rows="3"
                  placeholder="Escribe tu respuesta..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) handleSendMessage();
                  }}
                />
                <div className="reply-footer">
                  <span className="reply-hint">Ctrl + Enter para enviar</span>
                  <Button
                    variant="primary"
                    icon={<FiSend />}
                    loading={sendingMessage}
                    onClick={handleSendMessage}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            )}

            {['closed', 'resolved'].includes(selectedTicket.status) && (
              <div className="ticket-closed-notice">
                <FiCheckCircle />
                <span>Este ticket está {getStatusConfig(selectedTicket.status).label.toLowerCase()}.</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyTickets;