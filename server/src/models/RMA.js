const mongoose = require("mongoose");

/**
 * Schema de RMA (Return Merchandise Authorization)
 * Sistema de devoluciones de productos
 */
const rmaSchema = new mongoose.Schema(
  {
    // Cliente que solicita la devolución
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Orden relacionada
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // Items a devolver (pueden ser uno o varios de la orden)
    items: [
      {
        orderItem: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    // Motivo de la devolución
    reason: {
      type: String,
      enum: [
        "defective", // Producto defectuoso
        "wrong_item", // Producto equivocado
        "not_as_described", // No es como se describió
        "changed_mind", // Cambié de opinión
        "damaged", // Llegó dañado
        "other", // Otro motivo
      ],
      required: true,
    },

    reasonDescription: {
      type: String,
      required: [true, "Debe proporcionar una descripción del motivo"],
    },

    // Evidencia (fotos, documentos)
    evidence: [
      {
        type: String, // URLs de imágenes/archivos
        description: String,
      },
    ],

    // Estado de la RMA
    status: {
      type: String,
      enum: [
        "requested",
        "approved",
        "rejected",
        "received",
        "refunded",
        "cancelled",
      ],
      default: "requested",
    },

    // Historial de estados
    statusHistory: [
      {
        status: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],

    // Agente de soporte asignado
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    escalated: {
      type: Boolean,
      default: false,
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    escalationReason: {
      type: String,
    },

    // Decisión y notas del equipo
    decision: {
      approved: Boolean,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
      notes: String,
    },

    // Información de reembolso
    refund: {
      amount: Number,
      method: {
        type: String,
        enum: ["original_payment", "store_credit", "other"],
      },
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      processedAt: Date,
      transactionId: String,
    },

    // Fechas importantes
    approvedAt: Date,
    rejectedAt: Date,
    receivedAt: Date,
    refundedAt: Date,

    // Información de envío de devolución
    returnShipping: {
      trackingNumber: String,
      carrier: String,
      shippedAt: Date,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Virtual: Número de RMA legible
 */
rmaSchema.virtual("rmaNumber").get(function () {
  return `RMA-${this._id.toString().slice(-6).toUpperCase()}`;
});

/**
 * Virtual: Monto total de la devolución
 */
rmaSchema.virtual("totalAmount").get(function () {
  return this.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
});

/**
 * Middleware: Agregar al historial cuando cambia el estado
 */
rmaSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });
  }
  next();
});

/**
 * Índices
 */
rmaSchema.index({ customer: 1, createdAt: -1 });
rmaSchema.index({ order: 1 });
rmaSchema.index({ status: 1 });
rmaSchema.index({ assignedTo: 1 });
rmaSchema.index({ "items.vendor": 1 });

const RMA = mongoose.model("RMA", rmaSchema);

module.exports = RMA;
