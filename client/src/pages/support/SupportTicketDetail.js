import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketService } from "../../services/ticketService";
import { formatDateTime } from "../../utils/formatters";
import Button from "../../components/common/Button";
import { FiArrowLeft, FiSend, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import "./SupportTicketDetail.css";

const SupportTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getTicketById(id);
      if (response.success) {
        setTicket(response.ticket);
        setNewStatus(response.ticket.status);
      }
    } catch (error) {
      toast.error("Error al cargar ticket");
      navigate("/soporte/tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSending(true);
      await ticketService.addMessage(id, message);
      setMessage("");
      await loadTicket();
      toast.success("Mensaje enviado");
    } catch (error) {
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      await ticketService.updateStatus(id, newStatus);
      await loadTicket();
      toast.success("Estado actualizado");
    } catch (error) {
      toast.error("Error al actualizar estado");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async () => {
    try {
      await ticketService.assignTicket(id);
      await loadTicket();
      toast.success("Ticket asignado exitosamente");
    } catch (error) {
      toast.error("Error al asignar ticket");
    }
  };

  const STATUS_OPTIONS = [
    { value: "open", label: "Abierto" },
    { value: "in_progress", label: "En Progreso" },
    { value: "waiting_customer", label: "Esperando Cliente" },
    { value: "resolved", label: "Resuelto" },
    { value: "closed", label: "Cerrado" },
  ];

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  if (!ticket) return <div>Ticket no encontrado</div>;

  return (
    <div className="ticket-detail-page">
      <div className="detail-header">
        <Button
          variant="secondary"
          icon={<FiArrowLeft />}
          onClick={() => navigate("/soporte/tickets")}
        >
          Volver
        </Button>
        <h1>Ticket #{ticket._id.slice(-8).toUpperCase()}</h1>
      </div>

      <div className="detail-content">
        <div className="ticket-info-card">
          <h2>{ticket.subject}</h2>
          <div className="info-grid">
            <div>
              <strong>Cliente:</strong> {ticket.customer?.name}
            </div>
            <div>
              <strong>Email:</strong> {ticket.customer?.email}
            </div>
            <div>
              <strong>Categoría:</strong> {ticket.category}
            </div>
            <div>
              <strong>Prioridad:</strong> {ticket.priority}
            </div>
            <div>
              <strong>Creado:</strong> {formatDateTime(ticket.createdAt)}
            </div>
            <div>
              <strong>Estado:</strong>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Button
                size="small"
                onClick={handleUpdateStatus}
                loading={updating}
              >
                Actualizar
              </Button>
            </div>
          </div>
          {!ticket.assignedTo && (
            <Button variant="primary" onClick={handleAssign}>
              <FiAlertCircle /> Asignarme este ticket
            </Button>
          )}
        </div>

        <div className="messages-section">
          <h3>Conversación</h3>
          <div className="messages-list">
            {ticket.messages?.map((msg, i) => (
              <div key={i} className={`message ${msg.senderRole}`}>
                <div className="message-header">
                  <strong>{msg.sender?.name || "Usuario"}</strong>
                  <span>{formatDateTime(msg.timestamp)}</span>
                </div>
                <p>{msg.message}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="reply-form">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu respuesta..."
              rows="4"
            />
            <Button type="submit" icon={<FiSend />} loading={sending}>
              Enviar Mensaje
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketDetail;
