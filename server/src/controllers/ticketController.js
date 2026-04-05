const Ticket = require('../models/Ticket');
const { logAudit, createAuditLog } = require('../utils/auditLogger');

const createTicket = async (req, res) => {
  try {
    const { subject, description, orderId, category, priority } = req.body;

    const ticket = await Ticket.create({
      customer: req.user._id,
      subject,
      description,
      order: orderId,
      category: category || 'other',
      priority: priority || 'medium',
      messages: [{
        sender: req.user._id,
        senderRole: 'client',
        message: description,
        timestamp: new Date()
      }]
    });

    await logAudit(createAuditLog(
      req.user, 'create', 'ticket', ticket._id,
      `Ticket creado: ${ticket.subject}`
    ));

    res.status(201).json({ success: true, message: 'Ticket creado exitosamente', ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear ticket', error: error.message });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ customer: req.user._id })
      .populate('assignedTo', 'name')
      .sort('-createdAt');
    res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener tickets', error: error.message });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;
    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const tickets = await Ticket.find(query)
      .populate('customer', 'name email')
      .populate('assignedTo', 'name')
      .sort('-createdAt');

    res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener tickets', error: error.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('assignedTo', 'name role')
      .populate('messages.sender', 'name role')
      .populate('order', '_id status');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    // Verificar acceso
    const isOwner = ticket.customer._id.toString() === req.user._id.toString();
    const isStaff = ['support', 'admin'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Sin permiso para ver este ticket' });
    }

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener ticket', error: error.message });
  }
};

const addMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    ticket.messages.push({
      sender: req.user._id,
      senderRole: req.user.role,
      message,
      timestamp: new Date()
    });

    // Si soporte responde y el ticket está abierto → cambiar a in_progress
    if (req.user.role !== 'client' && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();
    res.json({ success: true, message: 'Mensaje agregado', ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al agregar mensaje', error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;

    if (status === 'resolved') ticket.resolvedAt = new Date();
    if (status === 'closed') ticket.closedAt = new Date();

    await ticket.save();

    await logAudit(createAuditLog(
      req.user, 'status_change', 'ticket', ticket._id,
      `Ticket ${ticket._id}: ${oldStatus} → ${status}`,
      { oldStatus, newStatus: status, notes }
    ));

    res.json({ success: true, message: 'Estado actualizado', ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar estado', error: error.message });
  }
};

const assignTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    ticket.assignedTo = req.user._id;
    if (ticket.status === 'open') ticket.status = 'in_progress';
    await ticket.save();

    res.json({ success: true, message: 'Ticket asignado exitosamente', ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al asignar ticket', error: error.message });
  }
};

const escalateTicket = async (req, res) => {
  try {
    const { escalateTo, reason } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    ticket.escalated = true;
    ticket.escalatedTo = escalateTo;
    ticket.escalationReason = reason;
    await ticket.save();

    await logAudit(createAuditLog(
      req.user, 'status_change', 'ticket', ticket._id,
      `Ticket escalado: ${reason}`
    ));

    res.json({ success: true, message: 'Ticket escalado exitosamente', ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al escalar ticket', error: error.message });
  }
};

module.exports = {
  createTicket, getMyTickets, getAllTickets,
  getTicketById, addMessage, updateStatus,
  assignTicket, escalateTicket
};