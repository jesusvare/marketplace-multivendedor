import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiClock, FiCheckCircle, FiAlertCircle,
         FiRefreshCw, FiRotateCcw } from 'react-icons/fi';
import Card from '../../components/common/Card';
import { ticketService } from '../../services/ticketService';
import { rmaService }    from '../../services/rmaService';
import { formatNumber, formatDateTime } from '../../utils/formatters';
import { toast } from 'react-toastify';
import './SupportDashboard.css';

const PRIORITY_MAP = {
  urgent: { label: '🔴 Urgente', cls: 'priority-urgent' },
  high:   { label: '🟠 Alta',    cls: 'priority-high'   },
  medium: { label: '🟡 Media',   cls: 'priority-medium' },
  low:    { label: '🟢 Baja',    cls: 'priority-low'    }
};

const STATUS_MAP = {
  open:             { label: 'Abierto',           cls: 'status-open'             },
  in_progress:      { label: 'En Progreso',        cls: 'status-in_progress'      },
  waiting_customer: { label: 'Esperando Cliente',  cls: 'status-waiting_customer' },
  resolved:         { label: 'Resuelto',           cls: 'status-resolved'         },
  closed:           { label: 'Cerrado',            cls: 'status-closed'           }
};

const SupportDashboard = () => {
  const [loading,       setLoading]       = useState(true);
  const [stats,         setStats]         = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      // Llamadas en paralelo para cada estado
      const [
        allRes,
        openRes,
        inProgressRes,
        resolvedRes,
        pendingRMAsRes
      ] = await Promise.allSettled([
        ticketService.getAllTickets({ limit: 8 }),                         // recientes
        ticketService.getAllTickets({ status: 'open',        limit: 1 }), // solo total
        ticketService.getAllTickets({ status: 'in_progress', limit: 1 }),
        ticketService.getAllTickets({ status: 'resolved',    limit: 1 }),
        rmaService.getAllRMAs({ status: 'requested',         limit: 1 })
      ]);

      // Extraer totales de la paginación de cada respuesta
      const total       = allRes.value?.success       ? (allRes.value.pagination?.total       || allRes.value.tickets?.length       || 0) : 0;
      const open        = openRes.value?.success      ? (openRes.value.pagination?.total      || openRes.value.tickets?.length      || 0) : 0;
      const inProgress  = inProgressRes.value?.success? (inProgressRes.value.pagination?.total|| inProgressRes.value.tickets?.length|| 0) : 0;
      const resolved    = resolvedRes.value?.success  ? (resolvedRes.value.pagination?.total  || resolvedRes.value.tickets?.length  || 0) : 0;
      const pendingRMAs = pendingRMAsRes.value?.success? (pendingRMAsRes.value.pagination?.total|| pendingRMAsRes.value.rmas?.length|| 0) : 0;

      setStats({ total, open, inProgress, resolved, pendingRMAs });

      // Tickets recientes del primer fetch
      if (allRes.value?.success) {
        setRecentTickets(allRes.value.tickets?.slice(0, 6) || []);
      }
    } catch (error) {
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="support-dashboard">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="support-dashboard">
      {/* Header */}
      <div className="dashboard-top-bar">
        <h2>Panel de Soporte</h2>
        <button
          className="refresh-btn"
          onClick={loadDashboard}
          title="Actualizar"
        >
          <FiRefreshCw />
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <Card className="kpi-card">
          <div className="kpi-icon tickets">
            <FiMessageSquare />
          </div>
          <div className="kpi-content">
            <h3>Total Tickets</h3>
            <p className="kpi-value">{formatNumber(stats.total)}</p>
            <span className="kpi-label">En el sistema</span>
          </div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-icon open">
            <FiAlertCircle />
          </div>
          <div className="kpi-content">
            <h3>Abiertos</h3>
            <p className="kpi-value">{stats.open}</p>
            <span className="kpi-label">Requieren atención</span>
          </div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-icon progress">
            <FiClock />
          </div>
          <div className="kpi-content">
            <h3>En Progreso</h3>
            <p className="kpi-value">{stats.inProgress}</p>
            <span className="kpi-label">Siendo atendidos</span>
          </div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-icon resolved">
            <FiCheckCircle />
          </div>
          <div className="kpi-content">
            <h3>Resueltos</h3>
            <p className="kpi-value">{stats.resolved}</p>
            <span className="kpi-label">Total histórico</span>
          </div>
        </Card>
      </div>

      {/* Fila de métricas secundarias */}
      <div className="metrics-row">
        <Card>
          <div className="metric-item">
            <FiRotateCcw size={22} style={{ color: 'var(--warning-color)' }} />
            <div>
              <h4>RMAs Pendientes</h4>
              <p className="metric-value">{stats.pendingRMAs}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="metric-item">
            <FiMessageSquare size={22} style={{ color: 'var(--info-color, #3b82f6)' }} />
            <div>
              <h4>Tasa de Resolución</h4>
              <p className="metric-value">
                {stats.total > 0
                  ? `${Math.round((stats.resolved / stats.total) * 100)}%`
                  : '—'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="metric-item">
            <FiAlertCircle size={22} style={{ color: 'var(--danger-color)' }} />
            <div>
              <h4>Sin Atender</h4>
              <p className="metric-value">{stats.open}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tickets recientes */}
      <Card
        title="Tickets Recientes"
        actions={
          <Link to="/soporte/tickets" style={{ fontSize: 13, color: 'var(--primary-color)' }}>
            Ver todos →
          </Link>
        }
      >
        {recentTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--secondary-color)' }}>
            No hay tickets registrados
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Asunto</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Asignado a</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map(ticket => {
                  const pri = PRIORITY_MAP[ticket.priority] || { label: ticket.priority, cls: '' };
                  const sts = STATUS_MAP[ticket.status]    || { label: ticket.status,   cls: '' };
                  return (
                    <tr key={ticket._id}>
                      <td className="font-bold">
                        #{ticket._id?.slice(-6).toUpperCase()}
                      </td>
                      <td>{ticket.customer?.name || '—'}</td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.subject}
                      </td>
                      <td>
                        <span className={`priority-badge ${pri.cls}`}>
                          {pri.label}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${sts.cls}`}>
                          {sts.label}
                        </span>
                      </td>
                      <td>{ticket.assignedTo?.name || <em style={{ color: 'var(--secondary-color)' }}>Sin asignar</em>}</td>
                      <td>{formatDateTime(ticket.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SupportDashboard;