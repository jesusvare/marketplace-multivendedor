const Product = require("../models/Product");
const Category = require("../models/Category");
const { logAudit, createAuditLog } = require("../utils/auditLogger");

/**
 * @desc    Obtener todos los productos (catálogo público)
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      vendor,
      inStock,
      sort = "-createdAt",
      page = 1,
      limit = 20,
    } = req.query;

    // Construir query
    let query = { status: "active" };

    // Búsqueda por texto
    if (search) {
      query.$text = { $search: search };
    }

    // Filtrar por categoría
    if (category) {
      query.category = category;
    }

    // Filtrar por rango de precio
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filtrar por vendedor
    // Filtrar por vendedor
    if (vendor) {
      const User = require("../models/User");
      const matchingVendors = await User.find({
        role: "vendor",
        $or: [
          { "vendorInfo.businessName": { $regex: vendor, $options: "i" } },
          { name: { $regex: vendor, $options: "i" } },
        ],
      }).select("_id");

      if (matchingVendors.length > 0) {
        query.vendor = { $in: matchingVendors.map((v) => v._id) };
      }
    }

    // Filtrar por disponibilidad
    if (inStock === "true") {
      query.stock = { $gt: 0 };
    }

    // Ejecutar query con paginación
    const products = await Product.find(query)
      .populate("category", "name icon")
      .populate("vendor", "name vendorInfo.businessName vendorInfo.rating")
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Contar total de documentos
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener producto por ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name icon description")
      .populate(
        "vendor",
        "name email vendorInfo.businessName vendorInfo.rating vendorInfo.totalSales",
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    // Incrementar vistas
    product.views += 1;
    await product.save();

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener producto",
      error: error.message,
    });
  }
};

/**
 * @desc    Crear nuevo producto (vendedor)
 * @route   POST /api/products
 * @access  Private/Vendor
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      minStock,
      images,
      category,
      specifications,
    } = req.body;

    // Verificar que la categoría existe
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    // Crear producto
    const product = await Product.create({
      name,
      description,
      price,
      stock,
      minStock,
      images,
      category,
      specifications,
      vendor: req.user._id,
    });

    // Incrementar contador de productos en categoría
    categoryExists.productsCount += 1;
    await categoryExists.save();

    // Log de auditoría
    await logAudit(
      createAuditLog(
        req.user,
        "create",
        "product",
        product._id,
        `Producto creado: ${product.name}`,
        { price, stock },
      ),
    );

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name icon")
      .populate("vendor", "name vendorInfo.businessName");

    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      product: populatedProduct,
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear producto",
      error: error.message,
    });
  }
};

/**
 * @desc    Actualizar producto
 * @route   PUT /api/products/:id
 * @access  Private/Vendor
 */
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    // Verificar que el producto pertenece al vendedor
    if (
      product.vendor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para editar este producto",
      });
    }

    // Guardar valores anteriores para auditoría
    const oldValues = {
      name: product.name,
      price: product.price,
      stock: product.stock,
    };

    // Actualizar campos
    // Actualizar campos - solo permitir campos seguros
    const allowedFields = [
      "name",
      "description",
      "price",
      "stock",
      "minStock",
      "images",
      "category",
      "specifications",
      "status",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });
    await product.save();

    // Log de auditoría
    await logAudit(
      createAuditLog(
        req.user,
        "update",
        "product",
        product._id,
        `Producto actualizado: ${product.name}`,
        { oldValues, newValues: req.body },
      ),
    );

    const updatedProduct = await Product.findById(product._id)
      .populate("category", "name icon")
      .populate("vendor", "name vendorInfo.businessName");

    res.json({
      success: true,
      message: "Producto actualizado exitosamente",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};

/**
 * @desc    Eliminar producto (soft delete)
 * @route   DELETE /api/products/:id
 * @access  Private/Vendor
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    // Verificar permisos
    if (
      product.vendor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para eliminar este producto",
      });
    }

    // Soft delete
    product.status = "deleted";
    await product.save();

    // Log de auditoría
    await logAudit(
      createAuditLog(
        req.user,
        "delete",
        "product",
        product._id,
        `Producto eliminado: ${product.name}`,
      ),
    );

    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar producto",
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener productos del vendedor actual
 * @route   GET /api/products/vendor/my-products
 * @access  Private/Vendor
 */
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id })
      .populate("category", "name icon")
      .sort("-createdAt");

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
};
