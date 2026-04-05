import React, { useState, useEffect, useCallback } from 'react';
import {
  FiFilter, FiCalendar, FiUser, FiActivity, FiDownload, FiRefreshCw, FiSearch
} from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { auditService } from '../../services/auditService';
import { formatDateTime } from '../../utils/formatters';
import { toast } from 'react-toastify';
import './AdminAudit.css';

/**
 * Auditoría del sistema con API real
 */
const AdminAudit = () => {
  const [auditLogs,   setAuditLogs]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [exporting,   setExporting]   = useState(false);
  const limit = 15;

  const [filters, setFilters] = useState({
    user:     '',
    action:   'all',
    entity:   'all',
    dateFrom: '',
    dateTo:   ''
  });

  // ─── Cargar logs ──────────────────────────────────────────────────────────────
  const loadLogs = useCallback(async (currentPage = 1) => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit };
      if (filters.user.trim())          params.user     = filters.user.trim();
      if (filters.action !== 'all')     params.action   = filters.action;
      if (filters.entity !== 'all')     params.entity   = filters.entity;
      if (filters.dateFrom)             params.dateFrom = filters.dateFrom;
      if (filters.dateTo)               params.dateTo   = filters.dateTo;

      const response = await auditService.getLogs(params);
      if (response.success) {
        setAuditLogs(response.logs);
        setTotal(response.total);
      }
    } catch (error) {
      toast.error('Error al cargar logs de auditoría');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLogs(page);
  }, [page]);

  // Al cambiar filtros, volver a página 1
  const handleApplyFilters = () => {
    setPage(1);
    loadLogs(1);
  };

  const handleClearFilters = () => {
    setFilters({ user: '', action: 'all', entity: 'all', dateFrom: '', dateTo: '' });
    setPage(1);
    setTimeout(() => loadLogs(1), 100);
  };

  // ─── Exportar CSV ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      setExporting(true);
      await auditService.exportLogs();
      toast.success('Logs exportados exitosamente');
    } catch (error) {
      toast.error('Error al exportar logs');
    } finally {
      setExporting(false);
    }
  };

  // ─── Configuración de acciones ────────────────────────────────────────────────
  const actionTypes = [
    { value: 'all',              label: 'Todas las acciones'  },
    { value: 'create',           label: 'Crear'               },
    { value: 'update',           label: 'Actualizar'          },
    { value: 'delete',           label: 'Eliminar'            },
    { value: 'approve',          label: 'Aprobar'             },
    { value: 'reject',           label: 'Rechazar'            },
    { value: 'suspend',          label: 'Suspender'           },
    { value: 'activate',         label: 'Activar'             },
    { value: 'status_change',    label: 'Cambio de estado'    },
    { value: 'use_coupon',       label: 'Usar cupón'          },
    { value: 'login',            label: 'Inicio de sesión'    },
    { value: 'logout',           label: 'Cierre de sesión'    },
    { value: 'permission_change',label: 'Cambio de permiso'   }
  ];

  const entityTypes = [
    { value: 'all',      label: 'Todas las entidades' },
    { value: 'user',     label: 'Usuarios'            },
    { value: 'vendor',   label: 'Vendedores'          },
    { value: 'product',  label: 'Productos'           },
    { value: 'category', label: 'Categorías'          },
    { value: 'order',    label: 'Órdenes'             },
    { value: 'ticket',   label: 'Tickets'             },
    { value: 'rma',      label: 'Devoluciones'        },
    { value: 'coupon',   label: 'Cupones'             }
  ];

  // ─── Helpers visuales ────────────────────────────────────────────────────────
  const getActionConfig = (action) => ({
    create:            { label: 'Crear',          cssClass: 'action-create'  },
    update:            { label: 'Actualizar',     cssClass: 'action-update'  },
    delete:            { label: 'Eliminar',       cssClass: 'action-delete'  },
    approve:           { label: 'Aprobar',        cssClass: 'action-approve' },
    reject:            { label: 'Rechazar',       cssClass: 'action-reject'  },
    suspend:           { label: 'Suspender',      cssClass: 'action-reject'  },
    activate:          { label: 'Activar',        cssClass: 'action-approve' },
    status_change:     { label: 'Cambio Estado',  cssClass: 'action-status'  },
    use_coupon:        { label: 'Cupón',          cssClass: 'action-coupon'  },
    login:             { label: 'Login',          cssClass: 'action-login'   },
    logout:            { label: 'Logout',         cssClass: 'action-login'   },
    password_change:   { label: 'Contraseña',     cssClass: 'action-update'  },
    permission_change: { label: 'Permiso',        cssClass: 'action-status'  }
  }[action] || { label: action, cssClass: 'action-default' });

  const getEntityLabel = (entity) => ({
    user: 'Usuario', vendor: 'Vendedor', product: 'Producto',
    category: 'Categoría', order: 'Orden', ticket: 'Ticket',
    rma: 'Devolución', coupon: 'Cupón', cart: 'Carrito'
  }[entity] || entity);

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = filters.user || filters.action !== 'all' ||
    filters.entity !== 'all' || filters.dateFrom || filters.dateTo;

  return (
    <div className="admin-audit">
      <Card
        title={`Auditoría del Sistema ${total > 0 ? `(${total} registros)` : ''}`}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => loadLogs(page)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--secondary-color)' }}
              title="Actualizar"
            >
              <FiRefreshCw />
            </button>
            <Button
              variant="secondary"
              icon={<FiDownload />}
              loading={exporting}
              onClick={handleExport}
            >
              Exportar CSV
            </Button>
          </div>
        }
      >
        {/* ─── Panel de filtros ─────────────────────────────────────────────── */}
        <div className="audit-filters">
          <div className="filter-row">
            {/* Buscar usuario */}
            <div className="filter-group">
              <FiUser />
              <input
                type="text"
                className="filter-input"
                placeholder="Filtrar por usuario o email..."
                value={filters.user}
                onChange={e => setFilters({ ...filters, user: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
              />
            </div>

            {/* Tipo de acción */}
            <div className="filter-group">
              <FiActivity />
              <select
                className="filter-select"
                value={filters.action}
                onChange={e => setFilters({ ...filters, action: e.target.value })}
              >
                {actionTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Entidad */}
            <div className="filter-group">
              <FiFilter />
              <select
                className="filter-select"
                value={filters.entity}
                onChange={e => setFilters({ ...filters, entity: e.target.value })}
              >
                {entityTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-row">
            {/* Fecha desde */}
            <div className="filter-group">
              <FiCalendar />
              <input
                type="date"
                className="filter-input"
                value={filters.dateFrom}
                onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
              />
              <span className="filter-date-label">Desde</span>
            </div>

            {/* Fecha hasta */}
            <div className="filter-group">
              <FiCalendar />
              <input
                type="date"
                className="filter-input"
                value={filters.dateTo}
                onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
              />
              <span className="filter-date-label">Hasta</span>
            </div>

            {/* Botones de filtro */}
            <div className="filter-buttons">
              <Button variant="primary" icon={<FiSearch />} onClick={handleApplyFilters}>
                Buscar
              </Button>
              {hasActiveFilters && (
                <Button variant="secondary" onClick={handleClearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Timeline de logs ────────────────────────────────────────────── */}
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : auditLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-color)' }}>
            No se encontraron registros con los filtros aplicados
          </div>
        ) : (
          <>
            <div className="audit-timeline">
              {auditLogs.map(log => {
                const actionCfg = getActionConfig(log.action);
                return (
                  <div key={log._id} className="audit-item">
                    {/* Marcador de timeline */}
                    <div className="audit-marker">
                      <div className={`marker-dot ${actionCfg.cssClass}`}></div>
                      <div className="marker-line"></div>
                    </div>

                    {/* Tarjeta del log */}
                    <Card className="audit-card">
                      <div className="audit-header">
                        <div className="audit-meta">
                          <span className={`action-badge ${actionCfg.cssClass}`}>
                            {actionCfg.label}
                          </span>
                          <span className="entity-badge">
                            {getEntityLabel(log.entity)}
                          </span>
                          <span className="entity-id">
                            #{log.entityId?.toString().slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <span className="audit-time">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>

                      <p className="audit-description">{log.description}</p>

                      <div className="audit-footer">
                        <div className="audit-user">
                          <FiUser size={13} />
                          <span className="user-name">
                            {log.userName || log.user?.name}
                          </span>
                          <span className="user-email">
                            ({log.userEmail || log.user?.email})
                          </span>
                          <span className={`role-badge role-${log.userRole}`}>
                            {log.userRole}
                          </span>
                        </div>
                        {log.ipAddress && (
                          <span className="audit-ip">IP: {log.ipAddress}</span>
                        )}
                      </div>

                      {/* Detalles extras (si existen) */}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="audit-details">
                          <summary>Ver detalles técnicos</summary>
                          <pre className="details-json">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* ─── Paginación ──────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="audit-pagination">
                <Button
                  variant="secondary"
                  size="small"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Anterior
                </Button>

                <div className="pagination-pages">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Mostrar páginas alrededor de la actual
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`page-btn ${page === pageNum ? 'active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  size="small"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Siguiente →
                </Button>

                <span className="pagination-info">
                  Página {page} de {totalPages} · {total} registros
                </span>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminAudit;