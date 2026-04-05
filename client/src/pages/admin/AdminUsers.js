import React, { useState, useEffect } from "react";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import { userService } from "../../services/userService";
import api from "../../services/api";
import { toast } from "react-toastify";
import "./AdminUsers.css";
import { auditService } from "../../services/auditService";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiRefreshCw, FiActivity } from 'react-icons/fi';
import { formatDate, formatDateTime } from "../../utils/formatters";

/**
 * Gestión de usuarios con API real
 */
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActivity, setShowActivity] = useState(false);
  const [activityUser, setActivityUser] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [filterRole, setFilterRole] = useState("all");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "client",
    status: "active",
    password: "",
  });

  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  // ─── Carga de usuarios ───────────────────────────────────────────────────────
  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRole !== "all") params.role = filterRole;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await userService.getUsers(params);
      if (response.success) setUsers(response.users);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  // ─── Abrir modal ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingUser(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      role: "client",
      status: "active",
      password: "",
    });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      status: user.status,
      password: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  // ─── Guardar usuario ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.warning("Nombre y email son requeridos");
      return;
    }
    if (!editingUser && !form.password) {
      toast.warning("La contraseña es requerida para nuevo usuario");
      return;
    }
    try {
      setSaving(true);
      if (editingUser) {
        // Actualizar usuario existente
        const updateData = {
          name: form.name,
          phone: form.phone,
          status: form.status,
        };
        const response = await userService.updateUser(
          editingUser._id,
          updateData,
        );
        if (response.success) {
          // Si cambió el rol, actualizarlo también
          if (form.role !== editingUser.role) {
            await userService.updateRole(editingUser._id, form.role);
          }
          setUsers((prev) =>
            prev.map((u) =>
              u._id === editingUser._id
                ? { ...u, ...updateData, role: form.role }
                : u,
            ),
          );
          toast.success("Usuario actualizado exitosamente");
        }
      } else {
        // Crear nuevo usuario
        const { data } = await api.post("/auth/register", {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
        });
        if (data.success) {
          setUsers((prev) => [data.user, ...prev]);
          toast.success("Usuario creado exitosamente");
        }
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar usuario");
    } finally {
      setSaving(false);
    }
  };

  // ─── Desactivar usuario ──────────────────────────────────────────────────────
  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`¿Desactivar a "${userName}"?`)) return;
    try {
      const response = await userService.deleteUser(userId);
      if (response.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, status: "inactive" } : u,
          ),
        );
        toast.success("Usuario desactivado");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error al desactivar usuario",
      );
    }
  };

  // ─── Ver actividad del usuario ───────────────────────────────────────────────
  const openActivity = async (user) => {
    setActivityUser(user);
    setActivityLogs([]);
    setShowActivity(true);
    try {
      setLoadingActivity(true);
      const response = await auditService.getLogs({
        user: user._id,
        limit: 50,
      });
      if (response.success) setActivityLogs(response.logs || []);
    } catch {
      toast.error("Error al cargar actividad");
    } finally {
      setLoadingActivity(false);
    }
  };

  // ─── Labels y estilos ────────────────────────────────────────────────────────
  const roleLabels = {
    admin: "Administrador",
    vendor: "Vendedor",
    support: "Soporte",
    client: "Cliente",
  };
  const roleOptions = Object.entries(roleLabels);

  // Filtrado local por búsqueda
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="admin-users">
      <Card
        title="Gestión de Usuarios"
        actions={
          <Button variant="primary" icon={<FiPlus />} onClick={openCreate}>
            Nuevo Usuario
          </Button>
        }
      >
        {/* ── Toolbar ── */}
        <div className="users-toolbar">
          <form className="search-box" onSubmit={handleSearch}>
            <FiSearch />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" style={{ display: "none" }}>
              Buscar
            </button>
          </form>

          <div className="filter-group">
            <FiFilter />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="role-filter"
            >
              <option value="all">Todos los roles</option>
              {roleOptions.map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadUsers}
            className="refresh-btn"
            title="Actualizar"
          >
            <FiRefreshCw />
          </button>
        </div>

        {/* ── Tabla ── */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="font-bold">{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || "—"}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${user.status}`}>
                          {user.status === "active"
                            ? "Activo"
                            : user.status === "inactive"
                              ? "Inactivo"
                              : "Suspendido"}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            title="Editar"
                            onClick={() => openEdit(user)}
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            className="btn-icon"
                            title="Ver Actividad"
                            onClick={() => openActivity(user)}
                          >
                            <FiActivity />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Desactivar"
                            onClick={() => handleDelete(user._id, user.name)}
                            disabled={user.status === "inactive"}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          textAlign: "center",
                          padding: "30px",
                          color: "var(--secondary-color)",
                        }}
                      >
                        No se encontraron usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                {filteredUsers.length} usuario
                {filteredUsers.length !== 1 ? "s" : ""}
              </span>
            </div>
          </>
        )}
      </Card>

      {/* ══════════════════════════════════ */}
      {/* MODAL: Crear / Editar usuario      */}
      {/* ══════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? `Editar: ${editingUser.name}` : "Nuevo Usuario"}
        size="medium"
      >
        <div className="user-form">
          <div className="form-row">
            <Input
              label="Nombre completo"
              required
              placeholder="Nombre y apellido"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Teléfono"
              placeholder="8888-8888"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <Input
            label="Email"
            type="email"
            required
            placeholder="usuario@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={!!editingUser}
          />

          {!editingUser && (
            <Input
              label="Contraseña"
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}

          <div className="form-row">
            <div className="input-group">
              <label className="input-label">
                Rol <span className="required">*</span>
              </label>
              <select
                className="custom-input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {roleOptions.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">
                Estado <span className="required">*</span>
              </label>
              <select
                className="custom-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════ */}
      {/* MODAL: Actividad del usuario       */}
      {/* ══════════════════════════════════ */}
      <Modal
        isOpen={showActivity}
        onClose={() => {
          setShowActivity(false);
          setActivityUser(null);
          setActivityLogs([]);
        }}
        title={activityUser ? `Actividad de ${activityUser.name}` : ""}
        size="large"
      >
        {loadingActivity ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : activityLogs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--secondary-color)",
            }}
          >
            <FiActivity size={40} style={{ marginBottom: 12 }} />
            <p>Este usuario no tiene actividad registrada</p>
          </div>
        ) : (
          <div>
            <p
              style={{
                marginBottom: 16,
                color: "var(--secondary-color)",
                fontSize: 14,
              }}
            >
              Últimas {activityLogs.length} acciones registradas
            </p>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td>
                        <span
                          style={{
                            background: "var(--primary-color)22",
                            color: "var(--primary-color)",
                            padding: "2px 8px",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{log.entity}</td>
                      <td
                        style={{
                          fontSize: 13,
                          color: "var(--secondary-color)",
                        }}
                      >
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
