const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { logAudit, createAuditLog } = require("../utils/auditLogger");

/**
 * @desc    Registrar nuevo usuario
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "El email ya está registrado",
      });
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || "client",
    });

    // Generar token
    const token = generateToken(user._id);

    // Log de auditoría
    await logAudit(
      createAuditLog(
        user,
        "create",
        "user",
        user._id,
        `Nuevo usuario registrado: ${user.name} (${user.role})`,
      ),
    );

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: error.message,
    });
  }
};

/**
 * @desc    Iniciar sesión
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario (incluir password)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Verificar contraseña
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Verificar que el usuario esté activo
    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Tu cuenta está inactiva o suspendida",
      });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Generar token
    const token = generateToken(user._id);

    // Log de auditoría
    await logAudit(
      createAuditLog(
        user,
        "login",
        "user",
        user._id,
        `Usuario inició sesión: ${user.email}`,
      ),
    );

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
      error: error.message,
    });
  }
};

/**
 * @desc    Validar token actual
 * @route   GET /api/auth/validate
 * @access  Private
 */
const validateToken = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toPublicJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al validar token",
    });
  }
};

/**
 * @desc    Obtener perfil del usuario actual
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toPublicJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener perfil",
    });
  }
};

/**
 * @desc    Cerrar sesión
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Log de auditoría
    await logAudit(
      createAuditLog(
        req.user,
        "logout",
        "user",
        req.user._id,
        `Usuario cerró sesión: ${req.user.email}`,
      ),
    );

    res.json({
      success: true,
      message: "Sesión cerrada exitosamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al cerrar sesión",
    });
  }
};

/**
 * @desc    Registrar uso de la ruleta (primera compra)
 * @route   PUT /api/auth/spin
 * @access  Private/Client
 */
const registerSpin = async (req, res) => {
  try {
    const Coupon = require("../models/Coupon"); // ✅ Importar Coupon

    // Verificar que no haya usado la ruleta
    if (req.user.hasUsedSpinWheel) {
      return res.status(400).json({
        success: false,
        message: "Ya utilizaste tu ruleta de primera compra",
      });
    }

    // Datos del premio desde el frontend
    const { prizeLabel, discount } = req.body;

    // ✅ CREAR CUPÓN REAL EN LA BASE DE DATOS
    const couponCode = `SPIN-${req.user._id.toString().slice(-6).toUpperCase()}-${Date.now()}`;

    const coupon = await Coupon.create({
      code: couponCode,
      description: `Premio de ruleta: ${prizeLabel}`,
      discountType: discount === 100 ? "percentage" : "percentage",
      discountValue: discount,
      minPurchase: 0,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      usageLimit: 1,
      onePerUser: true,
      isWheelPrize: true,
      assignedTo: req.user._id,
      status: "active",
    });

    // Marcar ruleta como usada
    await User.findByIdAndUpdate(req.user._id, {
      hasUsedSpinWheel: true,
    });

    // Log de auditoría
    await logAudit(
      createAuditLog(
        req.user,
        "use_coupon",
        "coupon",
        coupon._id,
        `Ruleta de primera compra usada. Premio: ${prizeLabel}`,
        { discount, couponCode },
      ),
    );

    res.json({
      success: true,
      message: "Ruleta registrada exitosamente",
      couponCode: coupon.code, // ✅ DEVOLVER EL CÓDIGO REAL
      discount: coupon.discountValue,
    });
  } catch (error) {
    console.error("Error al registrar ruleta:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar ruleta",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  validateToken,
  getMe,
  logout,
  registerSpin,
};
