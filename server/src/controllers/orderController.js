const Order   = require('../models/Order');
const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const Coupon  = require('../models/Coupon');
const User    = require('../models/User');
const { logAudit, createAuditLog } = require('../utils/auditLogger');

/**
 * @desc    Crear orden (checkout)
 * @route   POST /api/orders
 * @access  Private/Client
 */
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, couponCode, notes, paymentMethod } = req.body;

    // Obtener carrito del usuario
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    // ✅ DETECTAR PRIMERA COMPRA ANTES DE CREAR LA ORDEN
    const prevOrderCount = await Order.countDocuments({ customer: req.user._id });
    const isFirstOrder = prevOrderCount === 0;

    // Verificar stock de todos los items
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product || product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Producto no disponible: ${item.product.name}`
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para: ${product.name}`
        });
      }
    }

    // Construir items de la orden
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      vendor:  item.product.vendor,
      name:    item.product.name,
      price:   item.price,
      quantity: item.quantity,
      status:  'paid',
      statusHistory: [{
        status:    'paid',
        changedAt: new Date(),
        notes:     'Orden pagada'
      }]
    }));

    // Calcular subtotal
    let subtotal = orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    let discount = 0;
    let appliedCoupon = null;

    // Aplicar cupón si existe
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });
      
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Cupón no encontrado'
        });
      }

      // Validar cupón
      if (!coupon.canBeUsedBy(req.user._id)) {
        return res.status(400).json({
          success: false,
          message: 'Este cupón no puede ser usado'
        });
      }

      discount = coupon.calculateDiscount(subtotal);
      appliedCoupon = coupon._id;
    }

    const total = subtotal - discount;

    // Crear orden
    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      discount,
      total,
      status: 'paid',
      paymentStatus: 'paid',
      paidAt: new Date(),
      notes,
      paymentMethod: paymentMethod || 'credit_card',
      appliedCoupon
    });

    // Marcar cupón como usado
    if (appliedCoupon) {
      const coupon = await Coupon.findById(appliedCoupon);
      await coupon.markAsUsed(req.user._id, order._id);

      await logAudit(createAuditLog(
        req.user, 'use_coupon', 'coupon', coupon._id,
        `Cupón ${coupon.code} usado en orden ${order._id}`,
        { discount, order: order._id }
      ));
    }

    // Descontar stock y actualizar ventas
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      await product.reduceStock(item.quantity);
      product.sales += item.quantity;
      await product.save();

      // Actualizar stats del vendedor
      await User.findByIdAndUpdate(item.vendor, {
        $inc: {
          'vendorInfo.totalSales': item.price * item.quantity,
          'vendorInfo.totalOrders': 1
        }
      });
    }

    // Vaciar carrito
    await Cart.findByIdAndUpdate(cart._id, { items: [] });

    // Log de auditoría
    await logAudit(createAuditLog(
      req.user, 'create', 'order', order._id,
      `Orden creada: ${order._id}`,
      { total, itemsCount: orderItems.length, isFirstOrder }
    ));

    // Poblar orden para respuesta
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('items.product', 'name images')
      .populate('items.vendor', 'name vendorInfo.businessName');

    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      order: populatedOrder,
      isFirstOrder  // ✅ DEVOLVER ESTO AL FRONTEND
    });

  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener órdenes del cliente
 * @route   GET /api/orders/my-orders
 * @access  Private/Client
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('items.product', 'name images')
      .populate('items.vendor', 'name vendorInfo.businessName')
      .sort('-createdAt');

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes',
      error:   error.message
    });
  }
};

/**
 * @desc    Obtener orden por ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images price')
      .populate('items.vendor', 'name vendorInfo.businessName')
      .populate('items.statusHistory.changedBy', 'name role');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    // Verificar permisos
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isAdmin    = req.user.role === 'admin' || req.user.role === 'support';
    const isVendor   = req.user.role === 'vendor' && order.items.some(
      item => item.vendor?._id?.toString() === req.user._id.toString()
    );

    if (!isCustomer && !isAdmin && !isVendor) {
      return res.status(403).json({ success: false, message: 'Sin permiso para ver esta orden' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden',
      error:   error.message
    });
  }
};

/**
 * @desc    Obtener órdenes del vendedor
 * @route   GET /api/orders/vendor/orders
 * @access  Private/Vendor
 */
const getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'items.vendor': req.user._id })
      .populate('customer', 'name email')
      .populate('items.product', 'name images price')
      .sort('-createdAt');

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes',
      error:   error.message
    });
  }
};

/**
 * @desc    Obtener todas las órdenes (admin)
 * @route   GET /api/orders/all
 * @access  Private/Admin
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .populate('items.vendor', 'name vendorInfo.businessName')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Order.countDocuments(query);

    res.json({ success: true, count: orders.length, total, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes',
      error:   error.message
    });
  }
};

/**
 * @desc    Actualizar estado de item de la orden (vendedor)
 * @route   PUT /api/orders/:orderId/items/:itemId/status
 * @access  Private/Vendor
 */
const updateItemStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['packed', 'shipped', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    // Encontrar el item
    const itemIndex = order.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item no encontrado' });
    }

    // Verificar que el vendedor es dueño del item
    if (
      order.items[itemIndex].vendor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Sin permiso para actualizar este item' });
    }

    // Validar progresión lineal de estados
    const progression = { paid: 0, packed: 1, shipped: 2, delivered: 3 };
    const currentLevel = progression[order.items[itemIndex].status] ?? -1;
    const newLevel     = progression[status] ?? -1;
    if (newLevel !== currentLevel + 1) {
      return res.status(400).json({
        success: false,
        message: `Transición inválida: ${order.items[itemIndex].status} → ${status}`
      });
    }

    const oldStatus = order.items[itemIndex].status;

    // Actualizar estado del item
    order.items[itemIndex].status = status;
    order.items[itemIndex].statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes:     notes || `Estado cambiado a ${status}`
    });

    await order.save();

    // Log de auditoría
    await logAudit(createAuditLog(
      req.user, 'status_change', 'order', order._id,
      `Item de orden actualizado: ${oldStatus} → ${status}`,
      { orderId: order._id, itemId: req.params.itemId, oldStatus, newStatus: status }
    ));

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('items.product', 'name images')
      .populate('items.vendor', 'name vendorInfo.businessName');

    res.json({ success: true, message: 'Estado actualizado exitosamente', order: populatedOrder });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error:   error.message
    });
  }
};

/**
 * @desc    Aplicar cupón
 * @route   POST /api/orders/apply-coupon
 * @access  Private/Client
 */
const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
    }

    if (!coupon.canBeUsedBy(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cupón no válido o ya utilizado' });
    }

    const discount = coupon.calculateDiscount(subtotal);

    // Log de auditoría
    await logAudit(createAuditLog(
      req.user, 'use_coupon', 'coupon', coupon._id,
      `Cupón aplicado: ${couponCode} - Descuento: $${discount}`,
      { couponCode, discount, subtotal }
    ));

    res.json({
      success: true,
      message: 'Cupón aplicado exitosamente',
      coupon: {
        code:          coupon.code,
        description:   coupon.description,
        discountType:  coupon.discountType,
        discountValue: coupon.discountValue,
        discount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al aplicar cupón',
      error:   error.message
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getVendorOrders,
  getAllOrders,
  updateItemStatus,
  applyCoupon
};