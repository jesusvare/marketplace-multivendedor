const User = require('../models/User');
const { logAudit, createAuditLog } = require('../utils/auditLogger');

/**
 * @desc    Obtener todos los usuarios
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const {
      role,
      status,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Construir query
    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener usuario por ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar usuario
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const { name, email, phone, status } = req.body;
    const oldValues = { name: user.name, email: user.email, status: user.status };

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (status) user.status = status;

    await user.save();

    await logAudit(createAuditLog(
      req.user, 'update', 'user', user._id,
      `Usuario actualizado: ${user.email}`,
      { oldValues, newValues: req.body }
    ));

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Desactivar usuario (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No se puede desactivar a uno mismo
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }

    user.status = 'inactive';
    await user.save();

    await logAudit(createAuditLog(
      req.user, 'delete', 'user', user._id,
      `Usuario desactivado: ${user.email}`
    ));

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al desactivar usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Cambiar rol de usuario
 * @route   PUT /api/users/:id/role
 * @access  Private/Admin
 */
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['client', 'vendor', 'support', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAudit(createAuditLog(
      req.user, 'permission_change', 'user', user._id,
      `Rol cambiado de ${oldRole} a ${role} para: ${user.email}`,
      { oldRole, newRole: role }
    ));

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar rol',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateRole
};