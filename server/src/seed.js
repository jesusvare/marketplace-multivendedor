/**
 * SEED SCRIPT — Marketplace Multi-Vendedor
 * Pobla MongoDB con datos de prueba realistas
 *
 * Uso:
 *   node src/seed.js           — inserta datos (salta los existentes)
 *   node src/seed.js --clean   — limpia todo y vuelve a insertar
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Category = require("./models/Category");
const Product = require("./models/Product");
const Coupon = require("./models/Coupon");
const Order = require("./models/Order");
const Ticket = require("./models/Ticket");
const RMA = require("./models/RMA");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/marketplace";
const CLEAN = process.argv.includes("--clean");

// ─── HELPERS ────────────────────────────────────────────────────────────────
const hash = (pw) => bcrypt.hash(pw, 10);
const future = (days) => new Date(Date.now() + days * 86_400_000);
const past = (days) => new Date(Date.now() - days * 86_400_000);

// ─── DATOS ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    name: "Electrónica",
    icon: "💻",
    description: "Computadoras, laptops y más",
  },
  {
    name: "Audio",
    icon: "🎧",
    description: "Auriculares, bocinas y equipos de sonido",
  },
  { name: "Smartphones", icon: "📱", description: "Celulares y accesorios" },
  { name: "Fotografía", icon: "📷", description: "Cámaras y lentes" },
  { name: "Gaming", icon: "🎮", description: "Consolas, juegos y periféricos" },
  {
    name: "Wearables",
    icon: "⌚",
    description: "Relojes y dispositivos ponibles",
  },
  {
    name: "Periféricos",
    icon: "🖱️",
    description: "Teclados, mouse y monitores",
  },
  { name: "Hogar", icon: "🏠", description: "Tecnología para el hogar" },
];

const USERS_DATA = [
  {
    name: "Administrador Sistema",
    email: "admin@marketplace.com",
    password: "Admin123!",
    role: "admin",
    status: "active",
  },
  {
    name: "Agente Soporte",
    email: "soporte@marketplace.com",
    password: "Soporte123!",
    role: "support",
    status: "active",
  },
  {
    name: "TechStore CR",
    email: "techstore@marketplace.com",
    password: "Vendor123!",
    role: "vendor",
    status: "active",
    vendorInfo: {
      businessName: "TechStore CR",
      businessDescription: "Los mejores equipos tecnológicos de Costa Rica",
      vendorStatus: "approved",
      rating: 4.8,
      totalSales: 45250,
      totalOrders: 234,
    },
  },
  {
    name: "AudioMax",
    email: "audiomax@marketplace.com",
    password: "Vendor123!",
    role: "vendor",
    status: "active",
    vendorInfo: {
      businessName: "AudioMax",
      businessDescription: "Especialistas en audio profesional y consumer",
      vendorStatus: "approved",
      rating: 4.6,
      totalSales: 38100,
      totalOrders: 189,
    },
  },
  {
    name: "GamerZone",
    email: "gamerzone@marketplace.com",
    password: "Vendor123!",
    role: "vendor",
    status: "active",
    vendorInfo: {
      businessName: "GamerZone",
      businessDescription: "Todo para gamers",
      vendorStatus: "pending",
      rating: 0,
      totalSales: 0,
      totalOrders: 0,
    },
  },
  {
    name: "Juan Pérez",
    email: "juan@cliente.com",
    password: "Cliente123!",
    role: "client",
    status: "active",
  },
  {
    name: "María García",
    email: "maria@cliente.com",
    password: "Cliente123!",
    role: "client",
    status: "active",
  },
  {
    name: "Carlos López",
    email: "carlos@cliente.com",
    password: "Cliente123!",
    role: "client",
    status: "active",
  },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Conectado a MongoDB\n");

  if (CLEAN) {
    console.log("🧹 Limpiando base de datos...");
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
      Order.deleteMany({}),
      Ticket.deleteMany({}),
      RMA.deleteMany({}),
    ]);
    console.log("✅ Base de datos limpia\n");
  }

  // ── 1. CATEGORÍAS ──────────────────────────────────────────────────────────
  console.log("📦 Creando categorías...");
  const categories = {};
  for (const cat of CATEGORIES) {
    const existing = await Category.findOne({ name: cat.name });
    if (existing) {
      categories[cat.name] = existing;
    } else {
      categories[cat.name] = await Category.create(cat);
    }
  }
  console.log(`   ✅ ${Object.keys(categories).length} categorías\n`);

  // ── 2. USUARIOS ────────────────────────────────────────────────────────────
  console.log("👤 Creando usuarios...");
  const users = {};
  for (const ud of USERS_DATA) {
    const existing = await User.findOne({ email: ud.email });
    if (existing) {
      users[ud.email] = existing;
      console.log(`   ⏭  ${ud.email} ya existe`);
    } else {
      // DESPUÉS — el pre('save') del modelo se encarga del hash
      const { password, ...rest } = ud;
      users[ud.email] = await User.create({ ...rest, password });
      console.log(`   ✅ ${ud.email}`);
    }
  }
  console.log();

  const techstore = users["techstore@marketplace.com"];
  const audiomax = users["audiomax@marketplace.com"];
  const juan = users["juan@cliente.com"];
  const maria = users["maria@cliente.com"];

  // ── 3. PRODUCTOS ───────────────────────────────────────────────────────────
  console.log("🛒 Creando productos...");
  const PRODUCTS_DATA = [
    // TechStore
    {
      name: "Laptop Gaming Pro X15",
      description:
        "Laptop de alto rendimiento con procesador Intel i7, 16GB RAM y RTX 3060. Ideal para gaming y diseño profesional.",
      price: 1299.99,
      stock: 15,
      minStock: 3,
      images: [
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600",
      ],
      category: categories["Electrónica"]._id,
      vendor: techstore._id,
      status: "active",
      specifications: [
        { label: "Procesador", value: "Intel Core i7-12700H" },
        { label: "RAM", value: "16GB DDR5" },
        { label: "Disco", value: "512GB SSD NVMe" },
        { label: "Pantalla", value: '15.6" FHD 144Hz' },
        { label: "Gráficos", value: "NVIDIA RTX 3060 6GB" },
      ],
      sales: 45,
    },
    {
      name: "Tablet Pro 12 Ultra",
      description:
        'Tablet profesional con pantalla AMOLED 12", chip M2 y soporte para lápiz óptico.',
      price: 849.99,
      stock: 10,
      minStock: 3,
      images: [
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600",
      ],
      category: categories["Electrónica"]._id,
      vendor: techstore._id,
      status: "active",
      specifications: [
        { label: "Pantalla", value: '12" AMOLED 2K' },
        { label: "Procesador", value: "Apple M2" },
        { label: "RAM", value: "8GB" },
        { label: "Batería", value: "10,000 mAh" },
      ],
      sales: 28,
    },
    {
      name: 'Monitor UltraWide 34"',
      description:
        "Monitor curvo UltraWide QHD 165Hz, perfecto para productividad y gaming.",
      price: 599.99,
      stock: 8,
      minStock: 2,
      images: [
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600",
      ],
      category: categories["Periféricos"]._id,
      vendor: techstore._id,
      status: "active",
      specifications: [
        { label: "Tamaño", value: '34" Curvo' },
        { label: "Resolución", value: "3440×1440 QHD" },
        { label: "Frecuencia", value: "165Hz" },
        { label: "Panel", value: "IPS" },
      ],
      sales: 19,
    },
    {
      name: "Teclado Mecánico RGB Pro",
      description:
        "Teclado mecánico con switches Cherry MX Red, retroiluminación RGB por tecla y construcción de aluminio.",
      price: 149.99,
      stock: 2,
      minStock: 5, // stock bajo
      images: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
      ],
      category: categories["Periféricos"]._id,
      vendor: techstore._id,
      status: "active",
      specifications: [
        { label: "Switches", value: "Cherry MX Red" },
        { label: "Layout", value: "TKL" },
        { label: "Conexión", value: "USB-C + inalámbrico" },
      ],
      sales: 67,
    },
    {
      name: "Mouse Inalámbrico Pro",
      description:
        "Mouse ergonómico inalámbrico con sensor de 25,600 DPI, 7 botones programables y 70 horas de batería.",
      price: 79.99,
      stock: 30,
      minStock: 5,
      images: [
        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600",
      ],
      category: categories["Periféricos"]._id,
      vendor: techstore._id,
      status: "active",
      specifications: [
        { label: "Sensor", value: "Óptico 25,600 DPI" },
        { label: "Batería", value: "70 horas" },
        { label: "Conexión", value: "USB-C / 2.4GHz" },
      ],
      sales: 112,
    },
    {
      name: "Smartwatch Series 9",
      description:
        "Reloj inteligente con pantalla Always-On, GPS, monitor cardíaco 24/7 y resistencia al agua 50m.",
      price: 299.99,
      stock: 4,
      minStock: 5, // stock bajo
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
      ],
      category: categories["Wearables"]._id,
      vendor: techstore._id,
      status: "active",
      specifications: [
        { label: "Pantalla", value: 'AMOLED 1.9" Always-On' },
        { label: "GPS", value: "GPS + GLONASS" },
        { label: "Batería", value: "18 horas uso activo" },
        { label: "Agua", value: "Resistente 50m" },
      ],
      sales: 55,
    },
    // AudioMax
    {
      name: "Auriculares Bluetooth Pro",
      description:
        "Auriculares inalámbricos con cancelación activa de ruido, 30 horas de batería y sonido Hi-Fi.",
      price: 249.99,
      stock: 20,
      minStock: 5,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      ],
      category: categories["Audio"]._id,
      vendor: audiomax._id,
      status: "active",
      specifications: [
        { label: "ANC", value: "Cancelación activa de ruido" },
        { label: "Batería", value: "30 horas" },
        { label: "Drivers", value: "40mm Hi-Fi" },
        { label: "Conexión", value: "Bluetooth 5.2 + 3.5mm" },
      ],
      sales: 89,
    },
    {
      name: "Parlante Portátil Bass 360",
      description:
        "Parlante portátil con sonido 360°, resistente al agua IPX7 y 20 horas de batería.",
      price: 189.99,
      stock: 18,
      minStock: 4,
      images: [
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",
      ],
      category: categories["Audio"]._id,
      vendor: audiomax._id,
      status: "active",
      specifications: [
        { label: "Potencia", value: "30W RMS" },
        { label: "Agua", value: "IPX7" },
        { label: "Batería", value: "20 horas" },
        { label: "Conexión", value: "Bluetooth 5.0" },
      ],
      sales: 74,
    },
    {
      name: "Audífonos In-Ear Sport",
      description:
        "Audífonos deportivos con ajuste seguro, resistentes al sudor y 8 horas de batería con estuche de carga.",
      price: 89.99,
      stock: 35,
      minStock: 8,
      images: [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600",
      ],
      category: categories["Audio"]._id,
      vendor: audiomax._id,
      status: "active",
      specifications: [
        { label: "IPX", value: "IPX5 resistente al sudor" },
        { label: "Batería", value: "8h + 24h con estuche" },
        { label: "Latencia", value: "Ultra-low 25ms" },
      ],
      sales: 145,
    },
    {
      name: "Cámara Sony Alpha A7 IV",
      description:
        "Cámara mirrorless full-frame de 33MP, video 4K 60fps y estabilización óptica de 5 ejes.",
      price: 2499.99,
      stock: 3,
      minStock: 2,
      images: [
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
      ],
      category: categories["Fotografía"]._id,
      vendor: audiomax._id,
      status: "active",
      specifications: [
        { label: "Sensor", value: "Full-Frame 33MP BSI-CMOS" },
        { label: "Video", value: "4K 60fps / FHD 120fps" },
        { label: "ISO", value: "100 - 51200 (expandible)" },
        { label: "Montura", value: "Sony E" },
      ],
      sales: 12,
    },
  ];

  const products = [];
  for (const pd of PRODUCTS_DATA) {
    const existing = await Product.findOne({
      name: pd.name,
      vendor: pd.vendor,
    });
    if (existing) {
      products.push(existing);
      console.log(`   ⏭  ${pd.name}`);
    } else {
      products.push(await Product.create(pd));
      console.log(`   ✅ ${pd.name}`);
    }
  }
  console.log();

  // Actualizar productsCount en categorías
  for (const cat of Object.values(categories)) {
    const count = await Product.countDocuments({
      category: cat._id,
      status: "active",
    });
    await Category.findByIdAndUpdate(cat._id, { productsCount: count });
  }

  // ── 4. CUPONES ─────────────────────────────────────────────────────────────
  console.log("🎟️  Creando cupones...");
  const COUPONS_DATA = [
    {
      code: "BIENVENIDO10",
      description: "10% de descuento de bienvenida",
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 0,
      usageLimit: 100, // ✅ CORRECTO
      validFrom: new Date(),
      validUntil: future(365),
      onePerUser: true,
      isWheelPrize: false,
      status: "active",
    },
    {
      code: "TECHSTORE20",
      description: "20% en compras mayores a $500 en TechStore",
      discountType: "percentage",
      discountValue: 20,
      minPurchase: 500,
      maxDiscount: 100,
      usageLimit: 50, // ✅ CORRECTO
      validFrom: new Date(),
      validUntil: future(180),
      onePerUser: true,
      isWheelPrize: false,
      status: "active",
    },
    {
      code: "SPIN15",
      description: "Premio de ruleta — 15% OFF",
      discountType: "percentage",
      discountValue: 15,
      minPurchase: 0,
      usageLimit: 1000, // ✅ CORRECTO
      validFrom: new Date(),
      validUntil: future(365),
      onePerUser: false,
      isWheelPrize: true,
      status: "active",
    },
    {
      code: "FIJO50",
      description: "$50 de descuento en compras mayores a $500",
      discountType: "fixed",
      discountValue: 50,
      minPurchase: 500,
      usageLimit: 30, // ✅ CORRECTO
      validFrom: new Date(),
      validUntil: future(90),
      onePerUser: true,
      isWheelPrize: false,
      status: "active",
    },
  ];

  for (const cd of COUPONS_DATA) {
    const existing = await Coupon.findOne({ code: cd.code });
    if (!existing) {
      await Coupon.create(cd);
      console.log(`   ✅ ${cd.code}`);
    } else {
      console.log(`   ⏭  ${cd.code} ya existe`);
    }
  }
  console.log();

  // ── 5. ÓRDENES ─────────────────────────────────────────────────────────────
  console.log("📦 Creando órdenes de prueba...");

  const laptop = products.find((p) => p.name.includes("Laptop"));
  const mouse = products.find((p) => p.name.includes("Mouse"));
  const auricular = products.find((p) =>
    p.name.includes("Auriculares Bluetooth"),
  );

  const shippingJuan = {
    fullName: "Juan Pérez",
    address: "Av. Central 123",
    city: "San José",
    state: "San José",
    country: "Costa Rica",
    zipCode: "10101",
    phone: "+506 8888-1111",
  };

  const shippingMaria = {
    fullName: "María García",
    address: "Calle 5, Casa 20",
    city: "Cartago",
    state: "Cartago",
    country: "Costa Rica",
    zipCode: "30101",
    phone: "+506 8888-2222",
  };

  let order1, order2, order3;

  // Orden 1 — Juan, entregada (7 días atrás)
  const existing1 = await Order.findOne({
    customer: juan._id,
    "items.0.name": laptop.name,
  });
  if (!existing1) {
    order1 = await Order.create({
      customer: juan._id,
      items: [
        {
          product: laptop._id,
          vendor: techstore._id,
          name: laptop.name,
          price: laptop.price,
          quantity: 1,
          status: "delivered",
          statusHistory: [
            { status: "paid", changedAt: past(7), notes: "Orden pagada" },
            {
              status: "packed",
              changedAt: past(6),
              notes: "Producto empacado",
            },
            { status: "shipped", changedAt: past(5), notes: "Enviado por DHL" },
            {
              status: "delivered",
              changedAt: past(3),
              notes: "Entregado en domicilio",
            },
          ],
        },
      ],
      shippingAddress: shippingJuan,
      subtotal: laptop.price,
      discount: 0,
      total: laptop.price,
      status: "completed",
      paymentStatus: "paid",
      paidAt: past(7),
      createdAt: past(7),
    });
    console.log("   ✅ Orden 1 (Juan — Laptop, entregada)");
  } else {
    order1 = existing1;
    console.log("   ⏭  Orden 1 ya existe");
  }

  // Orden 2 — Juan, enviada (2 días atrás)
  // Orden 2 — Juan, enviada (2 días atrás)
  const existing2 = await Order.findOne({
    customer: juan._id,
    "items.0.name": mouse.name,
  });
  if (!existing2) {
    order2 = await Order.create({
      customer: juan._id,
      items: [
        {
          product: mouse._id,
          vendor: techstore._id,
          name: mouse.name,
          price: mouse.price,
          quantity: 2,
          status: "shipped", // ✅ CORRECTO - Estado del ITEM
          statusHistory: [
            { status: "paid", changedAt: past(2), notes: "Orden pagada" },
            {
              status: "packed",
              changedAt: past(2),
              notes: "Producto empacado",
            },
            {
              status: "shipped", // ✅ CORRECTO - Historial del ITEM
              changedAt: past(1),
              notes: "Enviado por Correos de CR",
            },
          ],
        },
      ],
      shippingAddress: shippingJuan,
      subtotal: mouse.price * 2,
      discount: 0,
      total: mouse.price * 2,
      status: "processing", // ✅ CORRECTO - Estado de la ORDEN
      paymentStatus: "paid",
      paidAt: past(2),
      createdAt: past(2),
    });
    console.log("   ✅ Orden 2 (Juan — Mouse ×2, enviada)");
  } else {
    order2 = existing2;
    console.log("   ⏭  Orden 2 ya existe");
  }

  // Orden 3 — María, pagada (hoy)
  const existing3 = await Order.findOne({
    customer: maria._id,
    "items.0.name": auricular.name,
  });
  if (!existing3) {
    order3 = await Order.create({
      customer: maria._id,
      items: [
        {
          product: auricular._id,
          vendor: audiomax._id,
          name: auricular.name,
          price: auricular.price,
          quantity: 1,
          status: "paid",
          statusHistory: [
            {
              status: "paid",
              changedAt: new Date(),
              notes: "Orden pagada — esperando vendedor",
            },
          ],
        },
      ],
      shippingAddress: shippingMaria,
      subtotal: auricular.price,
      discount: 0,
      total: auricular.price,
      status: "paid",
      paymentStatus: "paid",
      paidAt: new Date(),
    });
    console.log("   ✅ Orden 3 (María — Auriculares, pagada)");
  } else {
    order3 = existing3;
    console.log("   ⏭  Orden 3 ya existe");
  }
  console.log();

  // ── 6. TICKETS ─────────────────────────────────────────────────────────────
  console.log("🎫 Creando tickets de soporte...");
  const soporte = users["soporte@marketplace.com"];

  const existingT1 = await Ticket.findOne({
    customer: juan._id,
    subject: "Mi paquete aún no ha llegado",
  });
  if (!existingT1) {
    await Ticket.create({
      customer: juan._id,
      order: order2._id,
      subject: "Mi paquete aún no ha llegado",
      description:
        "Hice el pedido hace 2 días y figura como enviado pero no ha llegado.",
      category: "order_issue",
      priority: "high",
      status: "in_progress",
      assignedTo: soporte._id,
      messages: [
        {
          sender: juan._id,
          senderRole: "client",
          message:
            "Hola, mi paquete fue enviado hace 1 día y no llega. ¿Cuándo lo recibiré?",
          timestamp: past(1),
        },
        {
          sender: soporte._id,
          senderRole: "support",
          message:
            "Hola Juan, revisé tu caso. El paquete está en tránsito con DHL. Tiempo estimado: 1-2 días hábiles más.",
          timestamp: new Date(Date.now() - 3_600_000),
        },
      ],
    });
    console.log("   ✅ Ticket 1 (Juan — envío, alta prioridad, en progreso)");
  } else {
    console.log("   ⏭  Ticket 1 ya existe");
  }

  const existingT2 = await Ticket.findOne({
    customer: maria._id,
    subject: "Consulta sobre garantía",
  });
  if (!existingT2) {
    await Ticket.create({
      customer: maria._id,
      order: order3._id,
      subject: "Consulta sobre garantía",
      description:
        "¿Cuánto tiempo de garantía tienen los auriculares que compré?",
      category: "order_issue",
      priority: "low",
      status: "open",
      messages: [
        {
          sender: maria._id,
          senderRole: "client",
          message:
            "¿Los auriculares tienen garantía? ¿Por cuánto tiempo y qué cubre?",
          timestamp: new Date(),
        },
      ],
    });
    console.log("   ✅ Ticket 2 (María — garantía, baja prioridad, abierto)");
  } else {
    console.log("   ⏭  Ticket 2 ya existe");
  }
  console.log();

  // ── 7. RMA ─────────────────────────────────────────────────────────────────
  console.log("🔄 Creando solicitud RMA...");
  const laptopItem = order1.items[0];

  const existingRMA = await RMA.findOne({
    customer: juan._id,
    order: order1._id,
  });
  if (!existingRMA && order1._id) {
    await RMA.create({
      customer: juan._id,
      order: order1._id,
      items: [
        {
          orderItem: laptopItem._id,
          product: laptop._id,
          vendor: techstore._id,
          quantity: 1,
          price: laptop.price,
        },
      ],
      reason: "defective",
      reasonDescription:
        "La pantalla tiene un pixel muerto y el ventilador hace ruido excesivo desde el primer día.",
      evidence: [],
      status: "requested",
      statusHistory: [
        {
          status: "requested",
          changedAt: new Date(),
          notes: "Solicitud enviada por el cliente",
        },
      ],
    });
    console.log("   ✅ RMA 1 (Juan — Laptop defectuosa, solicitado)");
  } else {
    console.log("   ⏭  RMA 1 ya existe");
  }

  // ── RESUMEN ────────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  ✅  BASE DE DATOS POBLADA EXITOSAMENTE");
  console.log("═══════════════════════════════════════════════════\n");
  console.log("  CREDENCIALES DE ACCESO:");
  console.log("  ┌──────────────────────────────────────────────┐");
  console.log("  │ ADMIN    admin@marketplace.com / Admin123!   │");
  console.log("  │ SOPORTE  soporte@marketplace.com / Soporte123! │");
  console.log("  │ VENDOR   techstore@marketplace.com / Vendor123! │");
  console.log("  │ VENDOR   audiomax@marketplace.com / Vendor123! │");
  console.log("  │ CLIENT   juan@cliente.com / Cliente123!      │");
  console.log("  │ CLIENT   maria@cliente.com / Cliente123!     │");
  console.log("  └──────────────────────────────────────────────┘\n");
  console.log("  DATOS CREADOS:");
  console.log(`  • ${Object.keys(categories).length} categorías`);
  console.log(`  • ${USERS_DATA.length} usuarios`);
  console.log(`  • ${PRODUCTS_DATA.length} productos`);
  console.log(`  • ${COUPONS_DATA.length} cupones`);
  console.log("  • 3 órdenes (entregada / enviada / pagada)");
  console.log("  • 2 tickets de soporte");
  console.log("  • 1 solicitud de RMA\n");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error en seed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
