import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp,
  FiPackage, FiMessageSquare, FiRefreshCw, FiAlertCircle
} from 'react-icons/fi';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { userService }    from '../../services/userService';
import { vendorService }  from '../../services/vendorService';
import { orderService }   from '../../services/orderService';
import { ticketService }  from '../../services/ticketService';
import { rmaService }     from '../../services/rmaService';
import { formatPrice, formatNumber, formatDate } from '../../utils/formatters';
import './AdminDashboard.css';

/**
 * Dashboard del administrador — datos reales desde el backend
 */
const AdminDashboard = () => {
  const [loading,        setLoading]        = useState(true);
  const [stats,          setStats]          = useState(null);
  const [recentOrders,   setRecentOrders]   = useState([]);
  const [topVendors,     setTopVendors]     = useState([]);
  const [salesChart,     setSalesChart]     = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Llamadas paralelas al backend
      const [usersRes, vendorsRes, ordersRes, ticketsRes, rmasRes] = await Promise.allSettled([
        userService.getUsers({ limit: 1 }),
        vendorService.getVendors({ limit: 1 }),
        orderService.getAllOrders({ limit: 100 }),
        ticketService.getAllTickets({ status: 'open' }),
        rmaService.getAllRMAs({ status: 'requested' })
      ]);

      const users   = usersRes.status   === 'fulfilled' ? usersRes.value   : {};
      const vendors = vendorsRes.status === 'fulfilled' ? vendorsRes.value : {};
      const orders  = ordersRes.status  === 'fulfilled' ? ordersRes.value  : {};
      const tickets = ticketsRes.status === 'fulfilled' ? ticketsRes.value : {};
      const rmas    = rmasRes.status    === 'fulfilled' ? rmasRes.value    : {};

      const ordersList = orders.orders || [];

      // Ingresos totales
      const totalRevenue = ordersList.reduce((sum, o) => sum + (o.total || 0), 0);

      // Vendedores aprobados
      const approvedVendors = (vendors.vendors || []).filter(
        v => v.vendorInfo?.vendorStatus === 'approved'
      ).length;

      setStats({
        totalUsers:     users.total      || 0,
        totalVendors:   vendors.total    || 0,
        approvedVendors,
        totalOrders:    orders.total     || ordersList.length,
        totalRevenue,
        openTickets:    tickets.count    || 0,
        pendingRMAs:    rmas.count       || 0
      });

      // Últimas 5 órdenes
      setRecentOrders(ordersList.slice(0, 5));

      // Gráfico de ventas (últimos 7 días)
      setSalesChart(buildSalesChart(ordersList));

      // Órdenes por estado (dona)
      setOrdersByStatus(buildStatusChart(ordersList));

      // Top 3 vendedores por ingresos
      setTopVendors(buildTopVendors(ordersList));

    } catch (error) {
      console.error('Error al cargar dashboard admin:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Helpers ─────────────────────────────────────────────────────── */
  const buildSalesChart = (orders) => {
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
      days[key] = { date: key, ingresos: 0, ordenes: 0 };
    }
    orders.forEach(order => {
      const key = new Date(order.createdAt)
        .toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
      if (days[key]) {
        days[key].ingresos += order.total || 0;
        days[key].ordenes  += 1;
      }
    });
    return Object.values(days);
  };

  const buildStatusChart = (orders) => {
    const counts = {};
    orders.forEach(o => {
      const s = o.status || 'created';
      counts[s] = (counts[s] || 0) + 1;
    });
    const labels = { created: 'Creada', paid: 'Pagada', processing: 'Procesando', completed: 'Completada', cancelled: 'Cancelada' };
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  };

  const buildTopVendors = (orders) => {
    const map = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        const vName = item.vendor?.name || item.vendor?.vendorInfo?.businessName || 'Vendedor';
        const vId   = item.vendor?._id?.toString() || vName;
        if (!map[vId]) map[vId] = { name: vName, ingresos: 0, ordenes: 0 };
        map[vId].ingresos += (item.price * item.quantity) || 0;
        map[vId].ordenes  += 1;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);
  };

  const COLORS   = ['#667eea', '#43e97b', '#f093fb', '#ffa751', '#38f9d7'];
  const STATUS_C = { created: '#64748b', paid: '#f59e0b', processing: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="admin-dashboard">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <Button variant="secondary" size="small" icon={<FiRefreshCw />} onClick={loadDashboard}>
          Actualizar
        </Button>
      </div>

      {/* ── KPIs Principales ── */}
      <div className="kpi-grid">
        <Card className="kpi-card">
          <div className="kpi-icon users"><FiUsers /></div>
          <div className="kpi-content">
            <h3>Total Usuarios</h3>
            <p className="kpi-value">{formatNumber(stats?.totalUsers || 0)}</p>
            <span className="kpi-label">Registrados</span>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon vendors"><FiShoppingBag /></div>
          <div className="kpi-content">
            <h3>Vendedores</h3>
            <p className="kpi-value">{formatNumber(stats?.totalVendors || 0)}</p>
            <span className="kpi-label">{stats?.approvedVendors} aprobados</span>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon revenue"><FiDollarSign /></div>
          <div className="kpi-content">
            <h3>Ingresos Totales</h3>
            <p className="kpi-value">{formatPrice(stats?.totalRevenue || 0)}</p>
            <span className="kpi-label">Todas las órdenes</span>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon orders"><FiTrendingUp /></div>
          <div className="kpi-content">
            <h3>Órdenes Totales</h3>
            <p className="kpi-value">{formatNumber(stats?.totalOrders || 0)}</p>
            <span className="kpi-label">Acumuladas</span>
          </div>
        </Card>
      </div>

      {/* ── KPIs Secundarios ── */}
      <div className="secondary-stats">
        <Card className="stat-card">
          <FiMessageSquare className="stat-icon" />
          <div>
            <h4>Tickets Abiertos</h4>
            <p className={stats?.openTickets > 0 ? 'text-warning' : ''}>
              {stats?.openTickets || 0}
            </p>
          </div>
        </Card>
        <Card className="stat-card">
          <FiAlertCircle className="stat-icon" />
          <div>
            <h4>RMAs Pendientes</h4>
            <p className={stats?.pendingRMAs > 0 ? 'text-warning' : ''}>
              {stats?.pendingRMAs || 0}
            </p>
          </div>
        </Card>
        <Card className="stat-card">
          <FiShoppingBag className="stat-icon" />
          <div>
            <h4>Vend. Pendientes</h4>
            <p>{(stats?.totalVendors || 0) - (stats?.approvedVendors || 0)}</p>
          </div>
        </Card>
        <Card className="stat-card">
          <FiPackage className="stat-icon" />
          <div>
            <h4>Ticket Promedio</h4>
            <p>
              {stats?.totalOrders > 0
                ? formatPrice((stats?.totalRevenue || 0) / stats.totalOrders)
                : formatPrice(0)}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Gráficos ── */}
      <div className="charts-grid">
        {/* Ventas en el tiempo */}
        <Card title="Ingresos Últimos 7 Días" className="chart-card wide">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v) => [formatPrice(v), 'Ingresos']} />
              <Line
                type="monotone" dataKey="ingresos"
                stroke="#667eea" strokeWidth={2.5}
                dot={{ fill: '#667eea', r: 4 }} activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Órdenes por estado */}
        <Card title="Órdenes por Estado" className="chart-card">
          {ordersByStatus.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--secondary-color)', paddingTop: 60 }}>Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={ordersByStatus} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value"
                >
                  {ordersByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top vendedores */}
        <Card title="Top Vendedores por Ingresos" className="chart-card">
          {topVendors.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--secondary-color)', paddingTop: 40 }}>Sin ventas aún</p>
          ) : (
            <div className="ranking-list">
              {topVendors.map((v, i) => (
                <div key={i} className="ranking-item">
                  <div className="ranking-position">{i + 1}</div>
                  <div className="ranking-info">
                    <strong>{v.name}</strong>
                    <span>{v.ordenes} ítems vendidos</span>
                  </div>
                  <div className="ranking-value">{formatPrice(v.ingresos)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Órdenes recientes ── */}
      <Card
        title="Órdenes Recientes"
        actions={<Link to="/admin/auditoria"><Button variant="secondary" size="small">Ver auditoría</Button></Link>}
      >
        {recentOrders.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--secondary-color)', padding: '30px 0' }}>
            No hay órdenes aún
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order._id}>
                    <td className="font-bold">#{order._id.slice(-8).toUpperCase()}</td>
                    <td>{order.customer?.name || '—'}</td>
                    <td>{order.items?.length || 0}</td>
                    <td>{formatPrice(order.total)}</td>
                    <td>
                      <span style={{
                        background: `${STATUS_C[order.status] || '#64748b'}15`,
                        color:       STATUS_C[order.status] || '#64748b',
                        padding:    '3px 10px', borderRadius: 12,
                        fontSize: 12, fontWeight: 600
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;