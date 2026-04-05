const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { logAudit, createAuditLog } = require('../utils/auditLogger');

const getVendors = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = { role: 'vendor' };
    if (status) query['vendorInfo.vendorStatus'] = status;

    const vendors = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);
    res.json({ success: true, count: vendors.length, total, vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener vendedores', error: error.message });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' }).select('-password');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
    }
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener vendedor', error: error.message });
  }
};

const approveVendor = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
    }

    vendor.vendorInfo.vendorStatus = 'approved';
    await vendor.save();

    await logAudit(createAuditLog(
      req.user, 'approve', 'vendor', vendor._id,
      `Vendedor aprobado: ${vendor.vendorInfo.businessName || vendor.name}`
    ));

    res.json({ success: true, message: 'Vendedor aprobado exitosamente', vendor: vendor.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al aprobar vendedor', error: error.message });
  }
};

const suspendVendor = async (req, res) => {
  try {
    const { reason } = req.body;
    const vendor = await User.findById(req.params.id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
    }

    vendor.vendorInfo.vendorStatus = 'suspended';
    await vendor.save();

    await logAudit(createAuditLog(
      req.user, 'suspend', 'vendor', vendor._id,
      `Vendedor suspendido: ${vendor.name}. Razón: ${reason}`,
      { reason }
    ));

    res.json({ success: true, message: 'Vendedor suspendido', vendor: vendor.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al suspender vendedor', error: error.message });
  }
};

const getVendorStats = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const totalProducts = await Product.countDocuments({ vendor: vendorId, status: 'active' });
    const orders = await Order.find({ 'items.vendor': vendorId });
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      const vendorItems = order.items.filter(item => item.vendor.toString() === vendorId);
      return sum + vendorItems.reduce((s, item) => s + (item.price * item.quantity), 0);
    }, 0);

    res.json({ success: true, stats: { totalProducts, totalOrders, totalRevenue } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas', error: error.message });
  }
};
 
const registerAsVendor = async (req, res) => {
  try {
    const { businessName, businessDescription } = req.body;
    const user = await User.findById(req.user._id);

    user.role = 'vendor';
    user.vendorInfo = {
      businessName,
      businessDescription,
      vendorStatus: 'pending'
    };
    await user.save();

    await logAudit(createAuditLog(
      user, 'create', 'vendor', user._id,
      `Solicitud de vendedor: ${businessName}`
    ));

    res.json({ success: true, message: 'Solicitud enviada. Pendiente de aprobación.', user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al registrar vendedor', error: error.message });
  }
};

module.exports = { getVendors, getVendorById, approveVendor, suspendVendor, getVendorStats, registerAsVendor };