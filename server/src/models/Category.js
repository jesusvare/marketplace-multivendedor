const mongoose = require('mongoose');

/**
 * Schema de Categoría
 * Categorías para organizar productos
 */
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la categoría es requerido'],
    unique: true,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  icon: {
    type: String,
    default: '📦'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // Contador de productos
  productsCount: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

/**
 * Índices
 */
categorySchema.index({ name: 1 });
categorySchema.index({ status: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;