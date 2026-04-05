const mongoose = require('mongoose');

/**
 * Schema de Producto
 * Productos vendidos en el marketplace
 */
const productSchema = new mongoose.Schema({
  // Información básica
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres']
  },
  
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true
  },
  
  // Precio
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  
  // Inventario
  stock: {
    type: Number,
    required: [true, 'El stock es requerido'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  
  minStock: {
    type: Number,
    default: 5,
    min: [0, 'El stock mínimo no puede ser negativo']
  },
  
  // Imágenes
  images: [{
    type: String
  }],
  
  // Categoría
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La categoría es requerida']
  },
  
  // Vendedor
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El vendedor es requerido']
  },
  
  // Estado
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  
  // Especificaciones técnicas (opcional)
  specifications: [{
    label: String,
    value: String
  }],
  
  // Estadísticas
  views: {
    type: Number,
    default: 0
  },
  
  sales: {
    type: Number,
    default: 0
  },
  
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  reviewsCount: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

/**
 * Virtual: Verificar si está con stock bajo
 */
productSchema.virtual('isLowStock').get(function() {
  return this.stock > 0 && this.stock <= this.minStock;
});

/**
 * Virtual: Verificar si está agotado
 */
productSchema.virtual('isOutOfStock').get(function() {
  return this.stock === 0;
});

/**
 * Índices para búsquedas optimizadas
 */
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

/**
 * Método: Reducir stock
 */
productSchema.methods.reduceStock = async function(quantity) {
  if (this.stock < quantity) {
    throw new Error('Stock insuficiente');
  }
  this.stock -= quantity;
  await this.save();
};

/**
 * Método: Incrementar stock
 */
productSchema.methods.increaseStock = async function(quantity) {
  this.stock += quantity;
  await this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;