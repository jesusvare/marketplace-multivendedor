const mongoose = require('mongoose');

/**
 * Schema de Orden
 * Órdenes de compra del sistema
 */
const orderSchema = new mongoose.Schema({
  // Cliente que realiza la orden
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Items de la orden (pueden ser de múltiples vendedores)
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String, // Guardar nombre por si el producto se elimina
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    // Estado individual del item (controlado por cada vendedor)
    status: {
      type: String,
      enum: ['paid', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'paid'
    },
    // Historial de cambios de estado
    statusHistory: [{
      status: String,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
      notes: String
    }]
  }],
  
  // Información de envío
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    phone: String
  },
  
  // Totales
  subtotal: {
    type: Number,
    required: true
  },
  
  discount: {
    type: Number,
    default: 0
  },
  
  shipping: {
    type: Number,
    default: 0
  },
  
  total: {
    type: Number,
    required: true
  },
  
  // Cupón aplicado
  coupon: {
    code: String,
    discountPercent: Number,
    discountAmount: Number
  },
  
  // Estado general de la orden
  status: {
    type: String,
    enum: ['created', 'paid', 'processing', 'completed', 'cancelled'],
    default: 'created'
  },
  
  // Información de pago (simulado)
  paymentMethod: {
    type: String,
    default: 'credit_card'
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  paidAt: {
    type: Date
  },
  
  // Notas del cliente
  notes: {
    type: String
  }
  
}, {
  timestamps: true
});

/**
 * Índices
 */
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'items.vendor': 1, createdAt: -1 });
orderSchema.index({ status: 1 });

/**
 * Virtual: Número de orden legible
 */
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

/**
 * Método: Marcar como pagada
 */
orderSchema.methods.markAsPaid = function() {
  this.paymentStatus = 'paid';
  this.paidAt = new Date();
  this.status = 'paid';
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;