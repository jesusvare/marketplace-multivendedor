const mongoose = require('mongoose');

/**
 * Schema de Ticket de Soporte
 * Sistema de tickets para atención al cliente
 */
const ticketSchema = new mongoose.Schema({
  // Cliente que crea el ticket
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Orden relacionada (opcional)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Asunto y descripción
  subject: {
    type: String,
    required: [true, 'El asunto es requerido'],
    trim: true,
    maxlength: [200, 'El asunto no puede exceder 200 caracteres']
  },
  
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true
  },
  
  // Categoría del ticket
  category: {
    type: String,
    enum: ['order_issue', 'product_inquiry', 'refund', 'technical', 'other'],
    default: 'other'
  },
  
  // Prioridad
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Estado del ticket
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
    default: 'open'
  },
  
  // Agente asignado
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Conversación (mensajes)
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      enum: ['client', 'support', 'admin'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    attachments: [{
      name: String,
      url: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Escalamiento
  escalated: {
    type: Boolean,
    default: false
  },
  
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  escalationReason: {
    type: String
  },
  
  // Fechas importantes
  resolvedAt: {
    type: Date
  },
  
  closedAt: {
    type: Date
  },
  
  // Tiempo de primera respuesta (SLA)
  firstResponseAt: {
    type: Date
  },
  
  // Satisfacción del cliente
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  feedback: {
    type: String
  }
  
}, {
  timestamps: true
});

/**
 * Virtual: Número de ticket legible
 */
ticketSchema.virtual('ticketNumber').get(function() {
  return `TKT-${this._id.toString().slice(-6).toUpperCase()}`;
});

/**
 * Virtual: Tiempo de respuesta
 */
ticketSchema.virtual('responseTime').get(function() {
  if (this.firstResponseAt && this.createdAt) {
    return Math.floor((this.firstResponseAt - this.createdAt) / (1000 * 60)); // En minutos
  }
  return null;
});

/**
 * Middleware: Actualizar firstResponseAt al agregar primer mensaje de soporte
 */
ticketSchema.pre('save', function(next) {
  if (this.isModified('messages') && !this.firstResponseAt) {
    const supportMessage = this.messages.find(msg => 
      msg.senderRole === 'support' || msg.senderRole === 'admin'
    );
    
    if (supportMessage) {
      this.firstResponseAt = supportMessage.timestamp;
    }
  }
  next();
});

/**
 * Índices
 */
ticketSchema.index({ customer: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ createdAt: -1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;