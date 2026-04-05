const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Schema de Usuario
 * Maneja todos los tipos de usuarios del sistema
 */
const userSchema = new mongoose.Schema({
  // Información básica
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres']
  },
  
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir password en queries por defecto
  },
  
  // Información de contacto
  phone: {
    type: String,
    trim: true
  },
  
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Rol del usuario
  role: {
    type: String,
    enum: ['client', 'vendor', 'support', 'admin'],
    default: 'client'
  },
  
  // Estado del usuario
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Información específica para vendedores
  vendorInfo: {
    businessName: String,
    businessDescription: String,
    vendorStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending'
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalSales: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    }
  },
  
  // Gamificación - Ruleta de primera compra
  hasUsedSpinWheel: {
    type: Boolean,
    default: false
  },
  
  // Avatar/Foto de perfil
  avatar: {
    type: String,
    default: ''
  },
  
  // Último acceso
  lastLogin: {
    type: Date
  },
  
  // Tokens de recuperación de contraseña
  resetPasswordToken: String,
  resetPasswordExpire: Date

}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

/**
 * Middleware: Hashear contraseña antes de guardar
 */
userSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Método: Comparar contraseña
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Método: Obtener objeto público del usuario (sin password)
 */
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

/**
 * Índices para mejorar rendimiento de búsquedas
 */
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'vendorInfo.vendorStatus': 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;