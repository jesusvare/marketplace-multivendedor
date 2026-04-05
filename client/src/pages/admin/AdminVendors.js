import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiEye, FiRefreshCw } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { vendorService } from '../../services/vendorService';
import { formatPrice, formatNumber, formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';
import './AdminVendors.css';

/**
 * Gestión de vendedores con API real
 */
const AdminVendors = () => {
  const [vendors,         setVendors]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedVendor,  setSelectedVendor]  = useState(null);
  const [vendorStats,     setVendorStats]     = useState(null);
  const [showModal,       setShowModal]       = useState(false);
  const [loadingStats,    setLoadingStats]    = useState(false);
  const [filterStatus,    setFilterStatus]    = useState('all');

  useEffect(() => {
    loadVendors();
  }, [filterStatus]);

  // ─── Carga de vendedores ─────────────────────────────────────────────────────
  const loadVendors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const response = await vendorService.getVendors(params);
      if (response.success) setVendors(response.vendors);
    } catch (error) {
      toast.error('Error al cargar vendedores');
    } finally {
      setLoading(false);
    }
  };

  // ─── Ver detalles + stats ────────────────────────────────────────────────────
  const handleViewDetails = async (vendor) => {
    setSelectedVendor(vendor);
    setVendorStats(null);
    setShowModal(true);
    try {
      setLoadingStats(true);
      const response = await vendorService.getVendorStats(vendor._id);
      if (response.success) setVendorStats(response.stats);
    } catch {
      // stats opcionales, no bloqueamos
    } finally {
      setLoadingStats(false);
    }
  };

  // ─── Aprobar vendedor ────────────────────────────────────────────────────────
  const handleApprove = async (vendorId) => {
    try {
      const response = await vendorService.approveVendor(vendorId);
      if (response.success) {
        setVendors(prev => prev.map(v =>
          v._id === vendorId
            ? { ...v, vendorInfo: { ...v.vendorInfo, vendorStatus: 'approved' } }
            : v
        ));
        if (selectedVendor?._id === vendorId) {
          setSelectedVendor(prev => ({
            ...prev,
            vendorInfo: { ...prev.vendorInfo, vendorStatus: 'approved' }
          }));
        }
        toast.success('Vendedor aprobado exitosamente');
      }
    } catch (error) {
      toast.error('Error al aprobar vendedor');
    }
  };

  // ─── Suspender vendedor ──────────────────────────────────────────────────────
  const handleSuspend = async (vendorId) => {
    const reason = window.prompt('Ingresa el motivo de suspensión:');
    if (!reason) return;
    try {
      const response = await vendorService.suspendVendor(vendorId, reason);
      if (response.success) {
        setVendors(prev => prev.map(v =>
          v._id === vendorId
            ? { ...v, vendorInfo: { ...v.vendorInfo, vendorStatus: 'suspended' } }
            : v
        ));
        if (selectedVendor?._id === vendorId) {
          setSelectedVendor(prev => ({
            ...prev,
            vendorInfo: { ...prev.vendorInfo, vendorStatus: 'suspended' }
          }));
        }
        toast.success('Vendedor suspendido');
        setShowModal(false);
      }
    } catch (error) {
      toast.error('Error al suspender vendedor');
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getVendorStatus = (vendor) =>
    vendor.vendorInfo?.vendorStatus || 'pending';

  const statusConfig = {
    pending:   { label: 'Pendiente',  cssClass: 'status-pending'   },
    approved:  { label: 'Aprobado',   cssClass: 'status-approved'  },
    rejected:  { label: 'Rechazado',  cssClass: 'status-rejected'  },
    suspended: { label: 'Suspendido', cssClass: 'status-suspended' }
  };

  const statusFilters = [
    { value: 'all',       label: 'Todos'       },
    { value: 'pending',   label: 'Pendientes'  },
    { value: 'approved',  label: 'Aprobados'   },
    { value: 'suspended', label: 'Suspendidos' }
  ];

  return (
    <div className="admin-vendors">
      <Card
        title="Gestión de Vendedores"
        actions={
          <button
            onClick={loadVendors}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--secondary-color)' }}
            title="Actualizar"
          >
            <FiRefreshCw />
          </button>
        }
      >
        {/* ── Filtros ── */}
        <div className="vendors-filters">
          {statusFilters.map(filter => (
            <button
              key={filter.value}
              className={`filter-btn ${filterStatus === filter.value ? 'active' : ''}`}
              onClick={() => setFilterStatus(filter.value)}
            >
              {filter.label}
              <span className="filter-count">
                {filter.value === 'all'
                  ? vendors.length
                  : vendors.filter(v => getVendorStatus(v) === filter.value).length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Grid de vendedores ── */}
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : vendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-color)' }}>
            No hay vendedores con este estado
          </div>
        ) : (
          <div className="vendors-grid">
            {vendors.map(vendor => {
              const status = getVendorStatus(vendor);
              const cfg = statusConfig[status] || statusConfig.pending;

              return (
                <Card key={vendor._id} className="vendor-card">
                  {/* Header */}
                  <div className="vendor-header">
                    <div>
                      <h3>{vendor.vendorInfo?.businessName || vendor.name}</h3>
                      <p className="vendor-owner">{vendor.name}</p>
                      <p className="vendor-email">{vendor.email}</p>
                      <p className="vendor-date">Desde: {formatDate(vendor.createdAt)}</p>
                    </div>
                    <span className={`status-badge ${cfg.cssClass}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Métricas básicas */}
                  <div className="vendor-metrics">
                    <div className="metric">
                      <span className="metric-label">Ventas Totales</span>
                      <span className="metric-value">
                        {formatPrice(vendor.vendorInfo?.totalSales || 0)}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Órdenes</span>
                      <span className="metric-value">
                        {formatNumber(vendor.vendorInfo?.totalOrders || 0)}
                      </span>
                    </div>
                    {vendor.vendorInfo?.rating > 0 && (
                      <div className="metric">
                        <span className="metric-label">Calificación</span>
                        <span className="metric-value">⭐ {vendor.vendorInfo.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Descripción del negocio */}
                  {vendor.vendorInfo?.businessDescription && (
                    <p className="vendor-description">
                      {vendor.vendorInfo.businessDescription}
                    </p>
                  )}

                  {/* Acciones */}
                  <div className="vendor-actions">
                    {status === 'pending' && (
                      <>
                        <Button
                          variant="success"
                          size="small"
                          icon={<FiCheckCircle />}
                          onClick={() => handleApprove(vendor._id)}
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          icon={<FiXCircle />}
                          onClick={() => handleSuspend(vendor._id)}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                    {status === 'approved' && (
                      <Button
                        variant="danger"
                        size="small"
                        icon={<FiXCircle />}
                        onClick={() => handleSuspend(vendor._id)}
                      >
                        Suspender
                      </Button>
                    )}
                    {status === 'suspended' && (
                      <Button
                        variant="success"
                        size="small"
                        icon={<FiCheckCircle />}
                        onClick={() => handleApprove(vendor._id)}
                      >
                        Reactivar
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="small"
                      icon={<FiEye />}
                      onClick={() => handleViewDetails(vendor)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* ══════════════════════════════════════ */}
      {/* MODAL: Detalles del vendedor           */}
      {/* ══════════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedVendor(null); setVendorStats(null); }}
        title={selectedVendor ? `${selectedVendor.vendorInfo?.businessName || selectedVendor.name}` : 'Vendedor'}
        size="large"
      >
        {selectedVendor && (
          <div className="vendor-details">
            {/* Info general */}
            <div className="detail-section">
              <h4>Información General</h4>
              <div className="detail-grid">
                <div>
                  <strong>Nombre del negocio</strong>
                  <p>{selectedVendor.vendorInfo?.businessName || '—'}</p>
                </div>
                <div>
                  <strong>Propietario</strong>
                  <p>{selectedVendor.name}</p>
                </div>
                <div>
                  <strong>Email</strong>
                  <p>{selectedVendor.email}</p>
                </div>
                <div>
                  <strong>Teléfono</strong>
                  <p>{selectedVendor.phone || '—'}</p>
                </div>
                <div>
                  <strong>Fecha de registro</strong>
                  <p>{formatDate(selectedVendor.createdAt)}</p>
                </div>
                <div>
                  <strong>Estado actual</strong>
                  <p>
                    <span className={`status-badge ${statusConfig[getVendorStatus(selectedVendor)]?.cssClass}`}>
                      {statusConfig[getVendorStatus(selectedVendor)]?.label}
                    </span>
                  </p>
                </div>
              </div>
              {selectedVendor.vendorInfo?.businessDescription && (
                <div style={{ marginTop: 15 }}>
                  <strong>Descripción del negocio</strong>
                  <p style={{ marginTop: 6, color: 'var(--secondary-color)', lineHeight: 1.6 }}>
                    {selectedVendor.vendorInfo.businessDescription}
                  </p>
                </div>
              )}
            </div>

            {/* Métricas en tiempo real */}
            <div className="detail-section">
              <h4>Métricas de Rendimiento</h4>
              {loadingStats ? (
                <div className="loading" style={{ minHeight: 80 }}>
                  <div className="spinner"></div>
                </div>
              ) : (
                <div className="metrics-grid">
                  <div className="metric-card">
                    <span className="metric-label">Ventas Totales</span>
                    <span className="metric-value large">
                      {formatPrice(vendorStats?.totalRevenue || selectedVendor.vendorInfo?.totalSales || 0)}
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Órdenes Completadas</span>
                    <span className="metric-value large">
                      {formatNumber(vendorStats?.totalOrders || selectedVendor.vendorInfo?.totalOrders || 0)}
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Productos Activos</span>
                    <span className="metric-value large">
                      {vendorStats?.totalProducts || 0}
                    </span>
                  </div>
                  {(selectedVendor.vendorInfo?.rating > 0) && (
                    <div className="metric-card">
                      <span className="metric-label">Calificación Promedio</span>
                      <span className="metric-value large">
                        ⭐ {selectedVendor.vendorInfo.rating}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Acciones del modal */}
            <div className="modal-actions">
              {getVendorStatus(selectedVendor) === 'pending' && (
                <>
                  <Button
                    variant="success"
                    icon={<FiCheckCircle />}
                    onClick={() => handleApprove(selectedVendor._id)}
                  >
                    Aprobar Vendedor
                  </Button>
                  <Button
                    variant="danger"
                    icon={<FiXCircle />}
                    onClick={() => handleSuspend(selectedVendor._id)}
                  >
                    Rechazar Vendedor
                  </Button>
                </>
              )}
              {getVendorStatus(selectedVendor) === 'approved' && (
                <Button
                  variant="danger"
                  icon={<FiXCircle />}
                  onClick={() => handleSuspend(selectedVendor._id)}
                >
                  Suspender Vendedor
                </Button>
              )}
              {getVendorStatus(selectedVendor) === 'suspended' && (
                <Button
                  variant="success"
                  icon={<FiCheckCircle />}
                  onClick={() => handleApprove(selectedVendor._id)}
                >
                  Reactivar Vendedor
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminVendors;