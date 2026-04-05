const mongoose = require('mongoose');

/**
 * Schema de Cupón
 * Cupones de descuento y gamificación (ruleta)
 */
const couponSchema = new mongoose.Schema({
  // Código del cupón
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Descripción
  description: {
    type: String,
    required: true
  },
  
  // Tipo de descuento
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  
  // Valor del descuento
  discountValue: {
    type: Number,
    required: true,
    min: [0, 'El descuento no puede ser negativo']
  },
  
  // Monto mínimo de compra
  minPurchase: {
    type: Number,
    default: 0
  },
  
  // Monto máximo de descuento (para porcentajes)
  maxDiscount: {
    type: Number
  },
  
  // Fecha de validez
  validFrom: {
    type: Date,
    default: Date.now
  },
  
  validUntil: {
    type: Date,
    required: true
  },
  
  // Límite de usos
  usageLimit: {
    type: Number,
    default: null // null = ilimitado
  },
  
  usageCount: {
    type: Number,
    default: 0
  },
  
  // Un uso por usuario
  onePerUser: {
    type: Boolean,
    default: true
  },
  
  // Usuarios que han usado el cupón
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  }],
  
  // Generado por ruleta (gamificación)
  isWheelPrize: {
    type: Boolean,
    default: false
  },
  
  // Usuario específico (cupones personalizados)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Estado
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  }
  
}, {
  timestamps: true
});

/**
 * Virtual: Verificar si está expirado
 */
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

/**
 * Virtual: Verificar si alcanzó el límite de usos
 */
couponSchema.virtual('isExhausted').get(function() {
  if (!this.usageLimit) return false;
  return this.usageCount >= this.usageLimit;
});

/**
 * Método: Verificar si un usuario puede usar el cupón
 */
couponSchema.methods.canBeUsedBy = function(userId) {
  // Verificar si está activo
  if (this.status !== 'active') return false;
  
  // Verificar si está expirado
  if (this.isExpired) return false;
  
  // Verificar si alcanzó el límite
  if (this.isExhausted) return false;
  
  // Verificar si está asignado a un usuario específico
  if (this.assignedTo && this.assignedTo.toString() !== userId.toString()) {
    return false;
  }
  
  // Verificar si el usuario ya lo usó (si onePerUser es true)
  if (this.onePerUser) {
    const alreadyUsed = this.usedBy.some(
      usage => usage.user.toString() === userId.toString()
    );
    if (alreadyUsed) return false;
  }
  
  return true;
};

/**
 * Método: Calcular descuento
 */
couponSchema.methods.calculateDiscount = function(subtotal) {
  // Verificar monto mínimo
  if (subtotal < this.minPurchase) {
    return 0;
  }
  
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = subtotal * (this.discountValue / 100);
    
    // Aplicar máximo si existe
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    // Descuento fijo
    discount = this.discountValue;
  }
  
  // El descuento no puede ser mayor al subtotal
  return Math.min(discount, subtotal);
};

/**
 * Método: Marcar como usado por un usuario
 */
couponSchema.methods.markAsUsed = async function(userId, orderId) {
  this.usedBy.push({
    user: userId,
    order: orderId,
    usedAt: new Date()
  });
  this.usageCount += 1;
  await this.save();
};

/**
 * Índices
 */
couponSchema.index({ code: 1 });
couponSchema.index({ status: 1, validUntil: 1 });
couponSchema.index({ assignedTo: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;