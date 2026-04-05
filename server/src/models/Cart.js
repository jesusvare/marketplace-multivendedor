const mongoose = require('mongoose');

/**
 * Schema de Carrito
 * Carrito de compras persistente por usuario
 */
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Un carrito por usuario
  },
  
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'La cantidad mínima es 1'],
      default: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  
  // Totales calculados
  subtotal: {
    type: Number,
    default: 0
  },
  
  discount: {
    type: Number,
    default: 0
  },
  
  total: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

/**
 * Middleware: Calcular totales antes de guardar
 */
cartSchema.pre('save', function(next) {
  // Calcular subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  // Calcular total (subtotal - descuento)
  this.total = this.subtotal - this.discount;
  
  next();
});

/**
 * Índices
 */
cartSchema.index({ user: 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;