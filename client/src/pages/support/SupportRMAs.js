import React, { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { rmaService } from "../../services/rmaService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import {
  formatPrice,
  formatDate,
  formatDateTime,
} from "../../utils/formatters";
import { toast } from "react-toastify";
import {
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import "./SupportRMAs.css";

/**
 * Gestión de devoluciones (RMA) — conectado al backend real
 */
const SupportRMAs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rmas, setRmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRMA, setSelectedRMA] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadRMAs();
  }, [filterStatus]);

  /* ─── Carga de RMAs ─────────────────────────────────────────────── */
  const loadRMAs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;

      const response = await rmaService.getAllRMAs(params);
      if (response.success) setRmas(response.rmas);
    } catch (error) {
      toast.error("Error al cargar devoluciones");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Ver detalle ───────────────────────────────────────────────── */
  const handleViewRMA = async (rma) => {
    try {
      const response = await rmaService.getRMAById(rma._id);
      if (response.success) {
        setSelectedRMA(response.rma);
        setNotes("");
        setShowModal(true);
      }
    } catch {
      setSelectedRMA(rma);
      setShowModal(true);
    }
  };

  /* ─── Asignarme ─────────────────────────────────────────────────── */
  const handleAssignToMe = async (rmaId) => {
    try {
      const response = await rmaService.assignRMA(rmaId);
      if (response.success) {
        setRmas((prev) =>
          prev.map((r) =>
            r._id === rmaId ? { ...r, assignedTo: { name: user.name } } : r,
          ),
        );
        toast.success("RMA asignada a ti");
      }
    } catch {
      toast.error("Error al asignar RMA");
    }
  };

  /* ─── Cambiar estado ────────────────────────────────────────────── */
  const handleUpdateStatus = async (rmaId, newStatus) => {
    if (!notes.trim() && ["rejected"].includes(newStatus)) {
      toast.warning("Por favor indica el motivo del rechazo en las notas");
      return;
    }
    try {
      setUpdating(true);
      const response = await rmaService.updateStatus(rmaId, newStatus, notes);
      if (response.success) {
        setRmas((prev) =>
          prev.map((r) => (r._id === rmaId ? { ...r, status: newStatus } : r)),
        );
        setSelectedRMA((prev) =>
          prev ? { ...prev, status: newStatus } : prev,
        );
        toast.success(`RMA ${STATUS_MAP[newStatus]?.label || newStatus}`);
        if (["rejected", "refunded"].includes(newStatus)) setShowModal(false);
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
    } finally {
      setUpdating(false);
    }
  };

  /* ─── Escalar RMA ───────────────────────────────────────────────── */
  const handleEscalate = async (rmaId) => {
    const reason = window.prompt("Motivo del escalamiento:");
    if (!reason?.trim()) return;
    try {
      const response = await rmaService.escalateRMA(rmaId, "admin", reason);
      if (response.success) {
        setRmas((prev) =>
          prev.map((r) => (r._id === rmaId ? { ...r, escalated: true } : r)),
        );
        if (selectedRMA?._id === rmaId) {
          setSelectedRMA((prev) => ({ ...prev, escalated: true }));
        }
        toast.success("RMA escalada al administrador");
      }
    } catch {
      toast.error("Error al escalar RMA");
    }
  };

  /* ─── Helpers ───────────────────────────────────────────────────── */
  const STATUS_MAP = {
    requested: { label: "Solicitada", color: "#f59e0b" },
    approved: { label: "Aprobada", color: "#3b82f6" },
    rejected: { label: "Rechazada", color: "#ef4444" },
    received: { label: "Recibida", color: "#8b5cf6" },
    refunded: { label: "Reembolsada", color: "#10b981" },
    cancelled: { label: "Cancelada", color: "#64748b" },
  };

  const REASON_MAP = {
    defective: "Producto defectuoso",
    wrong_item: "Producto equivocado",
    not_as_described: "No es como se describe",
    changed_mind: "Cambié de opinión",
    damaged: "Llegó dañado",
    other: "Otro motivo",
  };

  // Contadores por estado
  const counts = rmas.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const statusFilters = [
    { value: "all", label: "Todas", count: rmas.length },
    { value: "requested", label: "Solicitadas", count: counts.requested || 0 },
    { value: "approved", label: "Aprobadas", count: counts.approved || 0 },
    { value: "received", label: "Recibidas", count: counts.received || 0 },
    { value: "refunded", label: "Reembolsadas", count: counts.refunded || 0 },
    { value: "rejected", label: "Rechazadas", count: counts.rejected || 0 },
  ];

  return (
    <div className="support-rmas">
      <Card
        title={`Devoluciones RMA (${rmas.length})`}
        actions={
          <button
            onClick={loadRMAs}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "var(--secondary-color)",
            }}
          >
            <FiRefreshCw />
          </button>
        }
      >
        {/* ── Filtros ── */}
        <div className="rma-filters">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              className={`filter-btn ${filterStatus === f.value ? "active" : ""}`}
              onClick={() => setFilterStatus(f.value)}
            >
              {f.label}
              <span className="filter-count">{f.count}</span>
            </button>
          ))}
        </div>

        {/* ── Lista de RMAs ── */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : rmas.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--secondary-color)",
            }}
          >
            <FiPackage size={50} style={{ marginBottom: 15 }} />
            <p>No hay devoluciones con este estado</p>
          </div>
        ) : (
          <div className="rmas-list">
            {rmas.map((rma) => {
              const cfg = STATUS_MAP[rma.status] || STATUS_MAP.requested;
              // Calcular total del RMA
              const totalAmount =
                rma.items?.reduce(
                  (s, item) => s + item.price * item.quantity,
                  0,
                ) || 0;

              return (
                <div key={rma._id} className="rma-card">
                  <div className="rma-header">
                    <div>
                      <h3>RMA #{rma._id?.slice(-6).toUpperCase()}</h3>
                      <p className="rma-order">
                        Orden: #
                        {rma.order?._id?.slice(-8).toUpperCase() ||
                          rma.order?.slice(-8).toUpperCase() ||
                          "—"}
                      </p>
                      <p className="rma-date">{formatDate(rma.createdAt)}</p>
                    </div>
                    <span
                      className="status-badge"
                      style={{ background: `${cfg.color}15`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>

                    {rma.escalated && (
                      <span className="escalated-badge">⬆️ Escalada</span>
                    )}
                  </div>

                  <div className="rma-details">
                    <div className="rma-detail-row">
                      <FiUser size={14} />
                      <span>
                        <strong>Cliente:</strong> {rma.customer?.name || "—"} (
                        {rma.customer?.email})
                      </span>
                    </div>
                    <div className="rma-detail-row">
                      <FiPackage size={14} />
                      <span>
                        <strong>Productos:</strong> {rma.items?.length || 0}{" "}
                        ítem(s)
                        {rma.items?.map((item) => (
                          <span key={item._id} className="rma-product-tag">
                            {item.product?.name || "Producto"} x{item.quantity}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="rma-detail-row">
                      <span>
                        <strong>Motivo:</strong>{" "}
                        {REASON_MAP[rma.reason] || rma.reason}
                      </span>
                    </div>
                    <div className="rma-detail-row">
                      <span>
                        <strong>Monto Total:</strong>
                      </span>
                      <span className="rma-amount">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>

                  <p className="rma-description">{rma.reasonDescription}</p>

                  <div className="rma-footer">
                    <div className="rma-assigned">
                      {rma.assignedTo ? (
                        <span>
                          Asignado a: <strong>{rma.assignedTo.name}</strong>
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleAssignToMe(rma._id)}
                        >
                          Asignarme
                        </Button>
                      )}
                    </div>
                    <div className="rma-actions">
                      {/* Botón escalar — solo si no está en estado final y no fue escalada ya */}
                      {!rma.escalated &&
                        !["refunded", "rejected", "cancelled"].includes(
                          rma.status,
                        ) && (
                          <Button
                            variant="warning"
                            size="small"
                            onClick={() => handleEscalate(rma._id)}
                          >
                            ⬆️ Escalar
                          </Button>
                        )}
                      {rma.status === "requested" && (
                        <>
                          <Button
                            variant="success"
                            size="small"
                            icon={<FiCheckCircle />}
                            loading={updating}
                            onClick={() =>
                              handleUpdateStatus(rma._id, "approved")
                            }
                          >
                            Aprobar
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            icon={<FiXCircle />}
                            onClick={() => navigate(`/soporte/devoluciones/${rma._id}`)}
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                      {rma.status === "approved" && (
                        <Button
                          variant="primary"
                          size="small"
                          loading={updating}
                          onClick={() =>
                            handleUpdateStatus(rma._id, "received")
                          }
                        >
                          Marcar Recibida
                        </Button>
                      )}
                      {rma.status === "received" && (
                        <Button
                          variant="success"
                          size="small"
                          icon={<FiCheckCircle />}
                          onClick={() => handleViewRMA(rma)}
                        >
                          Procesar Reembolso
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleViewRMA(rma)}
                      >
                        Ver Detalle
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL: Detalle completo + acciones          */}
      {/* ═══════════════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedRMA(null);
          setNotes("");
        }}
        title={
          selectedRMA
            ? `Devolución RMA #${selectedRMA._id?.slice(-6).toUpperCase()}`
            : ""
        }
        size="large"
      >
        {selectedRMA &&
          (() => {
            const cfg = STATUS_MAP[selectedRMA.status] || STATUS_MAP.requested;
            const totalAmount =
              selectedRMA.items?.reduce(
                (s, i) => s + i.price * i.quantity,
                0,
              ) || 0;
            return (
              <div className="rma-detail-modal">
                {/* Info general */}
                <div className="detail-section">
                  <h4>Información General</h4>
                  <div className="detail-grid">
                    <div>
                      <strong>Cliente</strong>
                      <p>{selectedRMA.customer?.name}</p>
                    </div>
                    <div>
                      <strong>Email</strong>
                      <p>{selectedRMA.customer?.email}</p>
                    </div>
                    <div>
                      <strong>Estado</strong>
                      <p>
                        <span
                          style={{
                            background: `${cfg.color}15`,
                            color: cfg.color,
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </p>
                    </div>
                    <div>
                      <strong>Fecha solicitud</strong>
                      <p>{formatDateTime(selectedRMA.createdAt)}</p>
                    </div>
                    <div>
                      <strong>Motivo</strong>
                      <p>
                        {REASON_MAP[selectedRMA.reason] || selectedRMA.reason}
                      </p>
                    </div>
                    <div>
                      <strong>Monto Total</strong>
                      <p
                        style={{
                          color: "var(--primary-color)",
                          fontWeight: 700,
                        }}
                      >
                        {formatPrice(totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginTop: 15 }}>
                    <strong>Descripción:</strong>
                    <p
                      style={{
                        marginTop: 6,
                        color: "var(--secondary-color)",
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedRMA.reasonDescription}
                    </p>
                  </div>
                </div>

                {/* Productos */}
                <div className="detail-section">
                  <h4>Productos a Devolver</h4>
                  {selectedRMA.items?.map((item, i) => (
                    <div key={i} className="rma-item-row">
                      <img
                        src={
                          item.product?.images?.[0] ||
                          "https://via.placeholder.com/55"
                        }
                        alt={item.product?.name}
                      />
                      <div>
                        <strong>{item.product?.name || "Producto"}</strong>
                        <p>
                          Cantidad: {item.quantity} · Precio:{" "}
                          {formatPrice(item.price)}
                        </p>
                        <p>
                          Subtotal:{" "}
                          <strong>
                            {formatPrice(item.price * item.quantity)}
                          </strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Evidencia */}
                {selectedRMA.evidence?.length > 0 && (
                  <div className="detail-section">
                    <h4>Evidencia Adjunta</h4>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {selectedRMA.evidence.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--primary-color)" }}
                        >
                          📎 Evidencia {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas para la decisión */}
                {["requested", "received"].includes(selectedRMA.status) && (
                  <div className="detail-section">
                    <h4>Notas / Motivo de decisión</h4>
                    <textarea
                      className="custom-input"
                      rows="3"
                      placeholder="Agrega notas sobre tu decisión (requerido para rechazar)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                )}

                {/* Historial de estados */}
                {selectedRMA.statusHistory?.length > 0 && (
                  <div className="detail-section">
                    <h4>Historial de Estados</h4>
                    {selectedRMA.statusHistory.map((h, i) => (
                      <div key={i} className="history-row">
                        <span
                          style={{
                            background: `${(STATUS_MAP[h.status] || STATUS_MAP.requested).color}15`,
                            color: (
                              STATUS_MAP[h.status] || STATUS_MAP.requested
                            ).color,
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {(STATUS_MAP[h.status] || { label: h.status }).label}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--secondary-color)",
                          }}
                        >
                          {formatDateTime(h.changedAt)}
                        </span>
                        {h.notes && (
                          <span style={{ fontSize: 12, fontStyle: "italic" }}>
                            {h.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Acciones del modal */}
                <div className="modal-actions">
                  {selectedRMA.status === "requested" && (
                    <>
                      <Button
                        variant="success"
                        icon={<FiCheckCircle />}
                        loading={updating}
                        onClick={() =>
                          handleUpdateStatus(selectedRMA._id, "approved")
                        }
                      >
                        Aprobar Devolución
                      </Button>
                      <Button
                        variant="danger"
                        icon={<FiXCircle />}
                        loading={updating}
                        onClick={() =>
                          handleUpdateStatus(selectedRMA._id, "rejected")
                        }
                      >
                        Rechazar Devolución
                      </Button>
                    </>
                  )}
                  {selectedRMA.status === "approved" && (
                    <Button
                      variant="primary"
                      loading={updating}
                      onClick={() =>
                        handleUpdateStatus(selectedRMA._id, "received")
                      }
                    >
                      Marcar como Recibida
                    </Button>
                  )}
                  {selectedRMA.status === "received" && (
                    <Button
                      variant="success"
                      icon={<FiCheckCircle />}
                      loading={updating}
                      onClick={() =>
                        handleUpdateStatus(selectedRMA._id, "refunded")
                      }
                    >
                      Confirmar Reembolso
                    </Button>
                  )}

                  {/*— aparece siempre que no esté en estado final */}
                  {!selectedRMA.escalated &&
                    !["refunded", "rejected", "cancelled"].includes(
                      selectedRMA.status,
                    ) && (
                      <Button
                        variant="warning"
                        onClick={() => handleEscalate(selectedRMA._id)}
                      >
                        ⬆️ Escalar a Admin
                      </Button>
                    )}
                </div>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
};

const REASON_MAP = {
  defective: "Producto defectuoso",
  wrong_item: "Producto equivocado",
  not_as_described: "No es como se describe",
  changed_mind: "Cambié de opinión",
  damaged: "Llegó dañado",
  other: "Otro motivo",
};

export default SupportRMAs;
