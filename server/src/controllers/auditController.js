const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
  try {
    const { user, action, entity, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    let query = {};

    if (user) query.$or = [
      { userEmail: { $regex: user, $options: 'i' } },
      { userName: { $regex: user, $options: 'i' } }
    ];
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({ success: true, count: logs.length, total, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener logs', error: error.message });
  }
};

const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('user', 'name email role');

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log no encontrado' });
    }

    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener log', error: error.message });
  }
};

const exportLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('user', 'name email role')
      .sort('-createdAt')
      .limit(1000);

    // Formato CSV simple
    const csvRows = [
      ['Fecha', 'Usuario', 'Email', 'Rol', 'Acción', 'Entidad', 'Descripción'].join(',')
    ];

    logs.forEach(log => {
      csvRows.push([
        log.createdAt.toISOString(),
        log.userName,
        log.userEmail,
        log.userRole,
        log.action,
        log.entity,
        `"${log.description}"`
      ].join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al exportar logs', error: error.message });
  }
};

module.exports = { getAuditLogs, getAuditLogById, exportLogs };