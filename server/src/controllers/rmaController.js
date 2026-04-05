const RMA = require("../models/RMA");
const Order = require("../models/Order");
const { logAudit, createAuditLog } = require("../utils/auditLogger");

const createRMA = async (req, res) => {
  try {
    const { orderId, items, reason, reasonDescription, evidence } = req.body;

    const order = await Order.findById(orderId).populate(
      "items.product items.vendor",
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Orden no encontrada" });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Sin permiso para esta orden" });
    }

    // Construir items del RMA
    const rmaItems = items.map((item) => {
      const orderItem = order.items.find(
        (oi) => oi._id.toString() === item.orderItemId,
      );
      return {
        orderItem: item.orderItemId,
        product: orderItem.product._id,
        vendor: orderItem.vendor._id,
        quantity: item.quantity,
        price: orderItem.price,
      };
    });

    const rma = await RMA.create({
      customer: req.user._id,
      order: orderId,
      items: rmaItems,
      reason,
      reasonDescription,
      evidence: evidence || [],
      statusHistory: [{ status: "requested", changedAt: new Date() }],
    });

    await logAudit(
      createAuditLog(
        req.user,
        "create",
        "rma",
        rma._id,
        `Devolución solicitada para orden: ${orderId}`,
        { reason, itemsCount: rmaItems.length },
      ),
    );

    res
      .status(201)
      .json({ success: true, message: "Solicitud de devolución creada", rma });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al crear RMA",
        error: error.message,
      });
  }
};

const getMyRMAs = async (req, res) => {
  try {
    const rmas = await RMA.find({ customer: req.user._id })
      .populate("order", "_id createdAt")
      .populate("items.product", "name images")
      .sort("-createdAt");
    res.json({ success: true, count: rmas.length, rmas });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al obtener RMAs",
        error: error.message,
      });
  }
};

const getAllRMAs = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const rmas = await RMA.find(query)
      .populate("customer", "name email")
      .populate("order", "_id createdAt")
      .populate("items.product", "name images")
      .sort("-createdAt");

    res.json({ success: true, count: rmas.length, rmas });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al obtener RMAs",
        error: error.message,
      });
  }
};

const getRMAById = async (req, res) => {
  try {
    const rma = await RMA.findById(req.params.id)
      .populate("customer", "name email")
      .populate("order")
      .populate("items.product", "name images price")
      .populate("assignedTo", "name");

    if (!rma) {
      return res
        .status(404)
        .json({ success: false, message: "RMA no encontrada" });
    }

    const isOwner = rma.customer._id.toString() === req.user._id.toString();
    const isStaff = ["support", "admin"].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res
        .status(403)
        .json({ success: false, message: "Sin permiso para ver esta RMA" });
    }

    res.json({ success: true, rma });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al obtener RMA",
        error: error.message,
      });
  }
};

const updateRMAStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const rma = await RMA.findById(req.params.id);

    if (!rma) {
      return res
        .status(404)
        .json({ success: false, message: "RMA no encontrada" });
    }

    const oldStatus = rma.status;
    rma.status = status;
    rma.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes,
    });

    if (status === "approved") {
      rma.approvedAt = new Date();
      rma.decision = {
        approved: true,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        notes,
      };
    }
    if (status === "rejected") {
      rma.rejectedAt = new Date();
      rma.decision = {
        approved: false,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        notes,
      };
    }
    if (status === "received") rma.receivedAt = new Date();
    if (status === "refunded") {
      rma.refundedAt = new Date();
      rma.refund = { processedBy: req.user._id, processedAt: new Date() };
    }

    await rma.save();

    await logAudit(
      createAuditLog(
        req.user,
        "status_change",
        "rma",
        rma._id,
        `RMA ${rma._id}: ${oldStatus} → ${status}`,
        { oldStatus, newStatus: status, notes },
      ),
    );

    res.json({ success: true, message: "Estado de RMA actualizado", rma });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al actualizar RMA",
        error: error.message,
      });
  }
};

const assignRMA = async (req, res) => {
  try {
    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res
        .status(404)
        .json({ success: false, message: "RMA no encontrada" });
    }

    rma.assignedTo = req.user._id;
    await rma.save();

    res.json({ success: true, message: "RMA asignada exitosamente", rma });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error al asignar RMA",
        error: error.message,
      });
  }
};

/**
 * @desc    Escalar RMA a administrador
 * @route   PUT /api/rmas/:id/escalate
 * @access  Private/Support
 */
const escalateRMA = async (req, res) => {
  try {
    const { escalateTo, reason } = req.body;
    const rma = await RMA.findById(req.params.id);

    if (!rma) {
      return res.status(404).json({
        success: false,
        message: "RMA no encontrada",
      });
    }

    // Actualizar campos de escalamiento
    rma.escalated = true;
    rma.escalatedTo = escalateTo;
    rma.escalationReason = reason;
    await rma.save();

    // Log de auditoría
    await logAudit(
      createAuditLog(
        req.user,
        "escalate",
        "rma",
        rma._id,
        `RMA escalada: ${reason}`,
        { escalateTo, reason },
      ),
    );

    res.json({
      success: true,
      message: "RMA escalada exitosamente",
      rma,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al escalar RMA",
      error: error.message,
    });
  }
};

module.exports = {
  createRMA,
  getMyRMAs,
  getAllRMAs,
  getRMAById,
  updateRMAStatus,
  assignRMA,
  escalateRMA, 
};


