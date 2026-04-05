import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTrendingUp, FiShoppingCart, FiPackage, FiAlertCircle,
  FiDollarSign, FiRefreshCw
} from 'react-icons/fi';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { formatPrice, formatNumber, formatDate } from '../../utils/formatters';
import './VendorDashboard.css';

/**
 * Dashboard del vendedor — datos reales desde el backend
 */
const VendorDashboard = () => {
  const [loading,          setLoading]          = useState(true);
  const [stats,            setStats]            = useState(null);
  const [recentOrders,     setRecentOrders]     = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [salesChartData,   setSalesChartData]   = useState([]);
  const [statusChartData,  setStatusChartData]  = useState([]);
  const [topProducts,      setTopProducts]      = useState([]);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [ordersRes, productsRes] = await Promise.all([
        orderService.getVendorOrders(),
        productService.getMyProducts()
      ]);

      const orders   = ordersRes.success   ? ordersRes.orders   : [];
      const products = productsRes.success ? productsRes.products : [];

      /* ─── Calcular KPIs ─────────────────────────────────────────── */
      const totalRevenue = orders.reduce((sum, order) => {
        const myItems = order.items || [];
        return sum + myItems.reduce((s, item) => s + (item.price * item.quantity), 0);
      }, 0);

      const pendingOrders = orders.filter(o =>
        o.items?.some(i => ['paid', 'packed'].includes(i.status))
      ).length;

      const activeProducts  = products.filter(p => p.status === 'active').length;
      const lowStock        = products.filter(
        p => p.stock > 0 && p.stock <= (p.minStock || 5) && p.status === 'active'
      );

      setStats({
        totalRevenue,
        totalOrders:      orders.length,
        pendingOrders,
        activeProducts,
        lowStockCount:    lowStock.length
      });

      /* ─── Órdenes recientes (últimas 5) ─────────────────────────── */
      setRecentOrders(orders.slice(0, 5));

      /* ─── Productos con stock bajo ──────────────────────────────── */
      setLowStockProducts(lowStock.slice(0, 5));

      /* ─── Gráfico de ventas por día (últimos 7 días) ─────────────── */
      const last7 = buildSalesChart(orders);
      setSalesChartData(last7);

      /* ─── Gráfico de órdenes por estado ─────────────────────────── */
      const byStatus = buildStatusChart(orders);
      setStatusChartData(byStatus);

      /* ─── Top productos más vendidos ─────────────────────────────── */
      const top = buildTopProducts(orders);
      setTopProducts(top);

    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Helpers de gráficos ──────────────────────────────────────────── */
  const buildSalesChart = (orders) => {
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
      days[key] = { date: key, ventas: 0, ordenes: 0 };
    }
    orders.forEach(order => {
      const d    = new Date(order.createdAt);
      const key  = d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
      if (days[key]) {
        days[key].ventas  += order.total || 0;
        days[key].ordenes += 1;
      }
    });
    return Object.values(days);
  };

  const buildStatusChart = (orders) => {
    const counts = { Pagadas: 0, Empacadas: 0, Enviadas: 0, Entregadas: 0 };
    const map    = { paid: 'Pagadas', packed: 'Empacadas', shipped: 'Enviadas', delivered: 'Entregadas' };
    orders.forEach(order => {
      order.items?.forEach(item => {
        const key = map[item.status];
        if (key) counts[key]++;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const buildTopProducts = (orders) => {
    const map = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        const name = item.name || item.product?.name || 'Producto';
        if (!map[name]) map[name] = { name, ventas: 0, ingresos: 0 };
        map[name].ventas   += item.quantity || 0;
        map[name].ingresos += (item.price * item.quantity) || 0;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 5);
  };

  const COLORS     = ['#667eea', '#43e97b', '#f093fb', '#ffa751', '#38f9d7'];
  const STATUS_MAP = { paid: 'Pagada', packed: 'Empacada', shipped: 'Enviada', delivered: 'Entregada', cancelled: 'Cancelada' };
  const STATUS_CLR = { paid: 'warning', packed: 'primary', shipped: 'info', delivered: 'success', cancelled: 'danger' };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="vendor-dashboard">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <h1>Mi Dashboard</h1>
        <Button variant="secondary" size="small" icon={<FiRefreshCw />} onClick={loadDashboard}>
          Actualizar
        </Button>
      </div>

      {/* ── KPIs ── */}
      <div className="kpi-grid">
        <Card className="kpi-card">
          <div className="kpi-icon sales"><FiDollarSign /></div>
          <div className="kpi-content">
            <h3>Ingresos Totales</h3>
            <p className="kpi-value">{formatPrice(stats?.totalRevenue || 0)}</p>
            <span className="kpi-label">Todas las órdenes</span>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon orders"><FiShoppingCart /></div>
          <div className="kpi-content">
            <h3>Órdenes Totales</h3>
            <p className="kpi-value">{formatNumber(stats?.totalOrders || 0)}</p>
            <span className="kpi-label">Acumuladas</span>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon pending"><FiAlertCircle /></div>
          <div className="kpi-content">
            <h3>Pendientes</h3>
            <p className="kpi-value">{stats?.pendingOrders || 0}</p>
            <span className="kpi-label">Requieren acción</span>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon products"><FiPackage /></div>
          <div className="kpi-content">
            <h3>Productos Activos</h3>
            <p className="kpi-value">{stats?.activeProducts || 0}</p>
            <span className="kpi-label">
              {stats?.lowStockCount > 0 && (
                <span className="low-stock-alert">⚠️ {stats.lowStockCount} con stock bajo</span>
              )}
            </span>
          </div>
        </Card>
      </div>

      {/* ── Gráficos ── */}
      <div className="charts-grid">
        {/* Ventas en el tiempo */}
        <Card title="Ventas Últimos 7 Días" className="chart-card wide">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v) => [formatPrice(v), 'Ventas']} />
              <Line
                type="monotone" dataKey="ventas"
                stroke="#667eea" strokeWidth={2.5}
                dot={{ fill: '#667eea', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Órdenes por estado */}
        <Card title="Órdenes por Estado" className="chart-card">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value"
              >
                {statusChartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Top productos */}
        <Card title="Top Productos Más Vendidos" className="chart-card">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v) => [v, 'Unidades vendidas']} />
              <Bar dataKey="ventas" fill="#43e97b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Tablas ── */}
      <div className="dashboard-tables">
        {/* Órdenes recientes */}
        <Card
          title="Órdenes Recientes"
          actions={<Link to="/vendedor/ordenes"><Button variant="secondary" size="small">Ver todas</Button></Link>}
        >
          {recentOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--secondary-color)', padding: '20px 0' }}>
              No hay órdenes aún
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID Orden</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => {
                    const firstItemStatus = order.items?.[0]?.status || 'paid';
                    return (
                      <tr key={order._id}>
                        <td className="font-bold">#{order._id.slice(-8).toUpperCase()}</td>
                        <td>{order.customer?.name || '—'}</td>
                        <td>{order.items?.length || 0} ítem(s)</td>
                        <td>{formatPrice(order.total)}</td>
                        <td>
                          <span className={`status-badge status-${STATUS_CLR[firstItemStatus] || 'default'}`}>
                            {STATUS_MAP[firstItemStatus] || firstItemStatus}
                          </span>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Stock bajo */}
        <Card
          title="⚠️ Productos con Stock Bajo"
          actions={<Link to="/vendedor/productos"><Button variant="secondary" size="small">Gestionar</Button></Link>}
        >
          {lowStockProducts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--success-color)', padding: '20px 0' }}>
              ✅ Todos los productos tienen stock suficiente
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Urgencia</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(product => {
                    const pct = Math.round((product.stock / (product.minStock || 5)) * 100);
                    return (
                      <tr key={product._id}>
                        <td className="font-bold">{product.name}</td>
                        <td>
                          <span className={product.stock <= 2 ? 'text-danger' : 'text-warning'}>
                            {product.stock}
                          </span>
                        </td>
                        <td>{product.minStock || 5}</td>
                        <td>
                          <div className="stock-bar">
                            <div
                              className="stock-fill"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                background: product.stock <= 2 ? 'var(--danger-color)' : 'var(--warning-color)'
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VendorDashboard;