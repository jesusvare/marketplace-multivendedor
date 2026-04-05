const Category = require("../models/Category");
const { logAudit, createAuditLog } = require("../utils/auditLogger");

const getCategories = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    // Si no es admin, solo mostrar categorías activas
    // Línea 8 de categoryController.js
    if (req.user?.role !== "admin") {
      query.status = "active";
    }

    const categories = await Category.find(query).sort("name");
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al obtener categorías",
        error: error.message,
      });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Categoría no encontrada" });
    }
    res.json({ success: true, category });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al obtener categoría",
        error: error.message,
      });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, icon, status } = req.body;

    const exists = await Category.findOne({ name });
    if (exists) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Ya existe una categoría con ese nombre",
        });
    }

    const category = await Category.create({ name, description, icon, status });

    await logAudit(
      createAuditLog(
        req.user,
        "create",
        "category",
        category._id,
        `Categoría creada: ${category.name}`,
      ),
    );

    res
      .status(201)
      .json({
        success: true,
        message: "Categoría creada exitosamente",
        category,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al crear categoría",
        error: error.message,
      });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Categoría no encontrada" });
    }

    const oldValues = { name: category.name, status: category.status };
    Object.assign(category, req.body);
    await category.save();

    await logAudit(
      createAuditLog(
        req.user,
        "update",
        "category",
        category._id,
        `Categoría actualizada: ${category.name}`,
        { oldValues, newValues: req.body },
      ),
    );

    res.json({
      success: true,
      message: "Categoría actualizada exitosamente",
      category,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al actualizar categoría",
        error: error.message,
      });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Categoría no encontrada" });
    }

    category.status = "inactive";
    await category.save();

    await logAudit(
      createAuditLog(
        req.user,
        "delete",
        "category",
        category._id,
        `Categoría desactivada: ${category.name}`,
      ),
    );

    res.json({ success: true, message: "Categoría eliminada exitosamente" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al eliminar categoría",
        error: error.message,
      });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
