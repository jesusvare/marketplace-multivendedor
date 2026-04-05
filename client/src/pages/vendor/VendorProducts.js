import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import { productService } from "../../services/productService";
import { categoryService } from "../../services/categoryService";
import api from "../../services/api";
import { formatPrice } from "../../utils/formatters";
import { toast } from "react-toastify";
import "./VendorProducts.css";

const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [generatingImage, setGeneratingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    minStock: "5",
    category: "",
    status: "active",
    imageUrl: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes] = await Promise.all([
        productService.getMyProducts(),
        categoryService.getCategories(),
      ]);
      if (prodsRes.success) setProducts(prodsRes.products);
      if (catsRes.success) setCategories(catsRes.categories);
    } catch (error) {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      minStock: "5",
      category: categories[0]?._id || "",
      imageUrl: "",
      status: "active",
    });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock || 5,
      category: product.category?._id || product.category,
      status: product.status,
      imageUrl: product.images?.[0] || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      toast.warning("Completa los campos requeridos");
      return;
    }
    try {
      setSaving(true);

      const productData = {
        ...form,
        images: form.imageUrl ? [form.imageUrl] : [],
      };

      let response;
      if (editing) {
        response = await productService.updateProduct(editing._id, productData);
        if (response.success) {
          setProducts((prev) =>
            prev.map((p) => (p._id === editing._id ? response.product : p)),
          );
          toast.success("Producto actualizado");
        }
      } else {
        response = await productService.createProduct(productData);
        if (response.success) {
          setProducts((prev) => [response.product, ...prev]);
          toast.success("Producto creado exitosamente");
        }
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar producto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`¿Eliminar "${productName}"?`)) return;
    try {
      const response = await productService.deleteProduct(productId);
      if (response.success) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
        toast.success("Producto eliminado");
      }
    } catch (error) {
      toast.error("Error al eliminar producto");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        setForm((prev) => ({ ...prev, imageUrl: data.url }));
        toast.success("Imagen subida correctamente");
      }
    } catch {
      toast.error("Error al subir imagen");
    }
  };

  const handleGenerateImage = async () => {
    if (!form.name.trim()) {
      toast.warning("Escribí el nombre del producto primero");
      return;
    }

    try {
      setGeneratingImage(true);
      toast.info("🎨 Generando imagen con IA... puede tardar unos segundos", {
        autoClose: false,
        toastId: "generating",
      });

      const { data } = await api.post("/ai/generate-image", {
        prompt: form.name,
      });

      toast.dismiss("generating");

      if (data.success) {
        setForm((prev) => ({ ...prev, imageUrl: data.imageUrl }));
        toast.success("🖼️ ¡Imagen generada exitosamente!");
      }
    } catch (error) {
      toast.dismiss("generating");
      toast.error(error.response?.data?.message || "Error al generar imagen");
    } finally {
      setGeneratingImage(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="vendor-products">
      <Card
        title="Mis Productos"
        actions={
          <Button variant="primary" icon={<FiPlus />} onClick={openCreate}>
            Nuevo Producto
          </Button>
        }
      >
        {/* Barra de búsqueda */}
        <div className="products-toolbar">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="products-count">{filtered.length} productos</span>
        </div>

        {/* Tabla */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="product-cell">
                      <img
                        src={
                          product.images?.[0] ||
                          "https://via.placeholder.com/50"
                        }
                        alt={product.name}
                      />
                      <span className="font-bold">{product.name}</span>
                    </div>
                  </td>
                  <td>{product.category?.name || "—"}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>
                    <span
                      className={
                        product.stock <= product.minStock ? "low-stock" : ""
                      }
                    >
                      {product.stock}
                      {product.stock <= product.minStock &&
                        product.stock > 0 &&
                        " ⚠️"}
                      {product.stock === 0 && " 🚫"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${product.status}`}>
                      {product.status === "active" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => openEdit(product)}
                        title="Editar"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(product._id, product.name)}
                        title="Eliminar"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: 30,
                      color: "var(--secondary-color)",
                    }}
                  >
                    {search
                      ? "No se encontraron productos"
                      : "Aún no tienes productos. ¡Crea el primero!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Editar Producto" : "Nuevo Producto"}
        size="large"
      >
        <div className="product-form">
          <div className="name-with-generate">
            <div className="name-input-wrapper">
              <Input
                label="Nombre del producto"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Laptop Gaming Pro"
              />
            </div>
            <Button
              variant="secondary"
              type="button"
              onClick={handleGenerateImage}
              loading={generatingImage}
              disabled={generatingImage || !form.name.trim()}
              className="generate-btn"
            >
              {generatingImage ? "⏳ Generando..." : "🤖 Generar Imagen con IA"}
            </Button>
          </div>

          <div className="input-group">
            <label className="input-label">
              Descripción <span className="required">*</span>
            </label>
            <textarea
              className="custom-input"
              rows="3"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Describe tu producto..."
            />
          </div>

          <div className="form-grid-3">
            <Input
              label="Precio ($)"
              type="number"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label="Stock"
              type="number"
              required
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Stock mínimo"
              type="number"
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              placeholder="5"
            />

            {/* ── Campo de imagen ── */}
            <div className="input-group">
              <label className="input-label">Imagen del producto</label>

              {/* Input file oculto */}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                id="product-image-input"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />

              {/* Botón para subir desde PC */}
              <Button
                variant="secondary"
                type="button"
                onClick={() =>
                  document.getElementById("product-image-input").click()
                }
              >
                📁 Subir imagen desde PC
              </Button>

              {/* Input para pegar URL manualmente */}
              <Input
                placeholder="O pegar URL de imagen..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                style={{ marginTop: 8 }}
              />

              {/* Vista previa */}
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="Vista previa"
                  style={{
                    marginTop: 8,
                    width: "100%",
                    maxHeight: 150,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--border-color)",
                  }}
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label className="input-label">
                Categoría <span className="required">*</span>
              </label>
              <select
                className="custom-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Estado</label>
              <select
                className="custom-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorProducts;
