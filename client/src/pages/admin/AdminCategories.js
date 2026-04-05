import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiRefreshCw } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { categoryService } from '../../services/categoryService';
import { formatNumber } from '../../utils/formatters';
import { toast } from 'react-toastify';
import './AdminCategories.css';

/**
 * Gestión de categorías con API real
 */
const AdminCategories = () => {
  const [categories,       setCategories]       = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [showModal,        setShowModal]        = useState(false);
  const [editingCategory,  setEditingCategory]  = useState(null);
  const [form,             setForm]             = useState({
    name: '', description: '', icon: '📦', status: 'active'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  // ─── Carga de categorías ──────────────────────────────────────────────────────
  const loadCategories = async () => {
    try {
      setLoading(true);
      // Pasar status vacío para que el admin vea todas
      const response = await categoryService.getCategories({});
      if (response.success) setCategories(response.categories);
    } catch (error) {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  // ─── Abrir modal crear ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '', icon: '📦', status: 'active' });
    setShowModal(true);
  };

  // ─── Abrir modal editar ───────────────────────────────────────────────────────
  const openEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name:        category.name,
      description: category.description || '',
      icon:        category.icon || '📦',
      status:      category.status
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  // ─── Guardar (crear o editar) ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.warning('El nombre de la categoría es requerido');
      return;
    }
    try {
      setSaving(true);
      if (editingCategory) {
        const response = await categoryService.updateCategory(editingCategory._id, form);
        if (response.success) {
          setCategories(prev => prev.map(c =>
            c._id === editingCategory._id ? response.category : c
          ));
          toast.success('Categoría actualizada exitosamente');
        }
      } else {
        const response = await categoryService.createCategory(form);
        if (response.success) {
          setCategories(prev => [...prev, response.category]);
          toast.success('Categoría creada exitosamente');
        }
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar categoría');
    } finally {
      setSaving(false);
    }
  };

  // ─── Activar/Desactivar categoría ────────────────────────────────────────────
  const handleToggleStatus = async (category) => {
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    const action    = newStatus === 'inactive' ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Deseas ${action} la categoría "${category.name}"?`)) return;
    try {
      const response = await categoryService.updateCategory(category._id, { status: newStatus });
      if (response.success) {
        setCategories(prev => prev.map(c =>
          c._id === category._id ? { ...c, status: newStatus } : c
        ));
        toast.success(`Categoría ${newStatus === 'active' ? 'activada' : 'desactivada'}`);
      }
    } catch (error) {
      toast.error('Error al cambiar estado de categoría');
    }
  };

  // ─── Eliminar (soft delete) ───────────────────────────────────────────────────
  const handleDelete = async (category) => {
    if (category.productsCount > 0) {
      toast.warning(`Esta categoría tiene ${category.productsCount} productos. Desactívala en su lugar.`);
      return;
    }
    if (!window.confirm(`¿Eliminar permanentemente "${category.name}"?`)) return;
    try {
      const response = await categoryService.deleteCategory(category._id);
      if (response.success) {
        setCategories(prev => prev.filter(c => c._id !== category._id));
        toast.success('Categoría eliminada');
      }
    } catch (error) {
      toast.error('Error al eliminar categoría');
    }
  };

  // Emojis sugeridos para el selector
  const suggestedIcons = ['📦', '💻', '🎧', '⌚', '📷', '🖱️', '📱', '🎮', '🏠', '👕', '🍕', '🚗', '⚽', '📚', '💊', '🎨'];

  return (
    <div className="admin-categories">
      <Card
        title="Gestión de Categorías"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={loadCategories}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--secondary-color)' }}
              title="Actualizar"
            >
              <FiRefreshCw />
            </button>
            <Button variant="primary" icon={<FiPlus />} onClick={openCreate}>
              Nueva Categoría
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <>
            {/* ── Estadística rápida ── */}
            <div className="categories-summary">
              <span>
                <strong>{categories.filter(c => c.status === 'active').length}</strong> activas
              </span>
              <span>
                <strong>{categories.filter(c => c.status === 'inactive').length}</strong> inactivas
              </span>
              <span>
                <strong>{categories.reduce((s, c) => s + (c.productsCount || 0), 0)}</strong> productos totales
              </span>
            </div>

            {/* ── Grid de categorías ── */}
            {categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-color)' }}>
                <p>No hay categorías creadas.</p>
                <Button variant="primary" icon={<FiPlus />} onClick={openCreate} style={{ marginTop: 15 }}>
                  Crear primera categoría
                </Button>
              </div>
            ) : (
              <div className="categories-grid">
                {categories.map(category => (
                  <Card
                    key={category._id}
                    className={`category-card ${category.status === 'inactive' ? 'category-inactive' : ''}`}
                  >
                    {/* Header con icono y badge */}
                    <div className="category-header">
                      <div className="category-icon">{category.icon || '📦'}</div>
                      <span className={`status-badge status-${category.status}`}>
                        {category.status === 'active' ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    {/* Info */}
                    <h3 className="category-name">{category.name}</h3>
                    <p className="category-description">
                      {category.description || 'Sin descripción'}
                    </p>

                    {/* Stats */}
                    <div className="category-stats">
                      <div className="stat">
                        <FiTag />
                        <span>{formatNumber(category.productsCount || 0)} productos</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="category-actions">
                      <Button
                        variant="primary"
                        size="small"
                        icon={<FiEdit2 />}
                        onClick={() => openEdit(category)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleToggleStatus(category)}
                      >
                        {category.status === 'active' ? 'Desactivar' : 'Activar'}
                      </Button>
                      <button
                        className="btn-icon danger"
                        title="Eliminar"
                        onClick={() => handleDelete(category)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* ════════════════════════════════════ */}
      {/* MODAL: Crear / Editar categoría      */}
      {/* ════════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        size="medium"
      >
        <div className="category-form">
          <Input
            label="Nombre de la categoría"
            required
            placeholder="Ej: Electrónica"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <div className="input-group">
            <label className="input-label">Descripción</label>
            <textarea
              className="custom-input"
              rows="3"
              placeholder="Describe brevemente esta categoría..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Selector de icono */}
          <div className="input-group">
            <label className="input-label">Icono (emoji)</label>
            <div className="icon-selector">
              {suggestedIcons.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`icon-btn ${form.icon === emoji ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, icon: emoji })}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="custom-input"
              placeholder="O escribe un emoji personalizado..."
              value={form.icon}
              onChange={e => setForm({ ...form, icon: e.target.value })}
              style={{ marginTop: 8 }}
              maxLength={4}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Estado <span className="required">*</span></label>
            <select
              className="custom-input"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
            </select>
          </div>

          {/* Preview */}
          <div className="category-preview">
            <div className="preview-icon">{form.icon || '📦'}</div>
            <div>
              <strong>{form.name || 'Nombre de categoría'}</strong>
              <p>{form.description || 'Descripción de la categoría'}</p>
            </div>
          </div>

          <div className="form-actions">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCategories;