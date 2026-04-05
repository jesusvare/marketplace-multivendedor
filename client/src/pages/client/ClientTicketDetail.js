import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/ticketService';
import { formatDateTime } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import {
  FiArrowLeft,
  FiSend,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiHeadphones
} from 'react-icons/fi';
import './ClientTicketDetail.css';

/**
 * Detalle de Ticket para el Cliente
 * Muestra la conversación completa y permite responder mensajes
 */
const ClientTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [id]);

  // Scroll al último mensaje cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getTicketById(id);
      if (response.success) {
        setTicket(response.ticket);
      }
    } catch (error) {
      toast.error('Error al cargar el ticket');
      navigate('/cliente/tickets');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      setSendingMessage(true);
      const response = await ticketService.addMessage(id, newMessage);
      if (response.success) {
        // Recargar ticket completo para tener datos populados
        await loadTicket();
        setNewMessage('');
        toast.success('Mensaje enviado');
      }
    } catch (error) {
      toast.error('Error al enviar mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
  };

  // ─── Helpers ─────────────────────────────────────────
  const getStatusConfig = (status) => ({
    open:             { label: 'Abierto',            color: '#ef4444', icon: <FiAlertCircle /> },
    in_progress:      { label: 'En Progreso',        color: '#3b82f6', icon: <FiClock /> },
    waiting_customer: { label: 'Esperando respuesta', color: '#f59e0b', icon: <FiClock /> },
    resolved:         { label: 'Resuelto',           color: '#10b981', icon: <FiCheckCircle /> },
    closed:           { label: 'Cerrado',            color: '#64748b', icon: <FiCheckCircle /> }
  }[status] || { label: status, color: '#64748b', icon: <FiClock /> });

  const getCategoryLabel = (c) => ({
    order_issue:     'Problema con orden',
    product_inquiry: 'Consulta de producto',
    refund:          'Devolución',
    technical:       'Técnico',
    other:           'Otro'
  }[c] || c);

  const getPriorityConfig = (p) => ({
    high:   { label: 'Alta',  color: '#ef4444', emoji: '🔴' },
    medium: { label: 'Media', color: '#f59e0b', emoji: '🟡' },
    low:    { label: 'Baja',  color: '#10b981', emoji: '🟢' },
    urgent: { label: 'Urgente', color: '#7c2d12', emoji: '🔥' }
  }[p] || { label: p, color: '#64748b', emoji: '⚪' });

  // ─── Loading ─────────────────────────────────────────
  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!ticket) {
    return (
      <div className="ticket-not-found">
        <h2>Ticket no encontrado</h2>
        <Button variant="primary" onClick={() => navigate('/cliente/tickets')}>
          Volver a mis tickets
        </Button>
      </div>
    );
  }

  const statusCfg   = getStatusConfig(ticket.status);
  const priorityCfg = getPriorityConfig(ticket.priority);
  const isClosed    = ['closed', 'resolved'].includes(ticket.status);

  return (
    <div className="client-ticket-detail">
      {/* ── Header ── */}
      <div className="ticket-detail-header">
        <Button
          variant="secondary"
          size="small"
          icon={<FiArrowLeft />}
          onClick={() => navigate('/cliente/tickets')}
        >
          Volver
        </Button>
        <div className="ticket-detail-title">
          <h1>{ticket.subject}</h1>
          <span className="ticket-id">
            #{ticket._id?.slice(-6).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="ticket-detail-layout">
        {/* ── Panel izquierdo: Conversación ── */}
        <div className="ticket-conversation-panel">
          <Card className="conversation-card">
            {/* Info bar */}
            <div className="conversation-info-bar">
              <span
                className="status-pill"
                style={{
                  background: `${statusCfg.color}15`,
                  color: statusCfg.color
                }}
              >
                {statusCfg.icon}
                {statusCfg.label}
              </span>
              <span className="messages-count">
                <FiMessageSquare size={14} />
                {ticket.messages?.length || 0} mensajes
              </span>
            </div>

            {/* Mensajes */}
            <div className="conversation-messages-list">
              {ticket.messages?.map((msg, index) => {
                const isClient = msg.senderRole === 'client';
                const senderName = msg.sender?.name || (isClient ? user?.name : 'Soporte');

                return (
                  <div
                    key={msg._id || index}
                    className={`message-item ${isClient ? 'message-own' : 'message-agent'}`}
                  >
                    <div className="message-avatar">
                      {isClient ? <FiUser /> : <FiHeadphones />}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <strong className="message-sender">{senderName}</strong>
                        <span className="message-role-badge">
                          {isClient ? 'Tú' : msg.senderRole === 'admin' ? 'Admin' : 'Soporte'}
                        </span>
                        <span className="message-time">
                          {formatDateTime(msg.timestamp)}
                        </span>
                      </div>
                      <div className="message-body">
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Área de respuesta */}
            {!isClosed ? (
              <div className="conversation-reply">
                <textarea
                  className="reply-textarea"
                  rows="3"
                  placeholder="Escribe tu respuesta..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="reply-actions">
                  <span className="reply-hint">Ctrl + Enter para enviar</span>
                  <Button
                    variant="primary"
                    icon={<FiSend />}
                    loading={sendingMessage}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="ticket-closed-banner">
                <FiCheckCircle />
                <span>
                  Este ticket está {statusCfg.label.toLowerCase()}.
                  Si necesitas ayuda adicional, crea un nuevo ticket.
                </span>
              </div>
            )}
          </Card>
        </div>

        {/* ── Panel derecho: Info del ticket ── */}
        <div className="ticket-info-panel">
          <Card title="Información del Ticket">
            <div className="info-items">
              <div className="info-item">
                <span className="info-label">Estado</span>
                <span
                  className="status-pill"
                  style={{
                    background: `${statusCfg.color}15`,
                    color: statusCfg.color
                  }}
                >
                  {statusCfg.icon}
                  {statusCfg.label}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Prioridad</span>
                <span>{priorityCfg.emoji} {priorityCfg.label}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Categoría</span>
                <span>{getCategoryLabel(ticket.category)}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Fecha de creación</span>
                <span>{formatDateTime(ticket.createdAt)}</span>
              </div>

              {ticket.assignedTo && (
                <div className="info-item">
                  <span className="info-label">Agente asignado</span>
                  <span className="agent-name">
                    <FiHeadphones size={14} />
                    {ticket.assignedTo.name || ticket.assignedTo.role}
                  </span>
                </div>
              )}

              {ticket.order && (
                <div className="info-item">
                  <span className="info-label">Orden relacionada</span>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => navigate(`/cliente/ordenes/${ticket.order._id || ticket.order}`)}
                  >
                    Ver Orden
                  </Button>
                </div>
              )}

              {ticket.resolvedAt && (
                <div className="info-item">
                  <span className="info-label">Resuelto el</span>
                  <span>{formatDateTime(ticket.resolvedAt)}</span>
                </div>
              )}

              {ticket.closedAt && (
                <div className="info-item">
                  <span className="info-label">Cerrado el</span>
                  <span>{formatDateTime(ticket.closedAt)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Descripción original */}
          <Card title="Descripción Original" style={{ marginTop: 16 }}>
            <p className="original-description">{ticket.description}</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientTicketDetail;