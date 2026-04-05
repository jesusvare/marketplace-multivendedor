const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Importar rutas
const { protect } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const rmaRoutes = require('./routes/rmaRoutes');
const auditRoutes = require('./routes/auditRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const aiRoutes = require('./routes/aiRoutes');

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Crear carpeta uploads si no existe
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Solo imágenes JPG, PNG o WebP'));
  }
});



// Importar middleware de manejo de errores
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

/**
 * Configuración principal del servidor Express
 */
const app = express();



// =====================================================
// MIDDLEWARES GLOBALES
// =====================================================

// CORS - Permitir peticiones del frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Parser de JSON para que los datos de peticiones post, get.... ssea un formato legible por express
app.use(express.json());

// Parser de URL-encoded
app.use(express.urlencoded({ extended: true }));

// Logger de peticiones HTTP (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Ruta para subir imagen
app.post('/api/upload', protect, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No se subió ninguna imagen' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

// Servir archivos estáticos
app.use('/uploads', express.static(uploadDir));

// =====================================================
// RUTAS DE LA API
// =====================================================

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API del Marketplace Multi-Vendedor',
    version: '1.0.0',
    status: 'running'
  });
});


//AQUI SE IMPORTA TODAS LAS RUTAS Y LAS CONECTAMOS AL SISTEMA
// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de usuarios
app.use('/api/users', userRoutes);

// Rutas de productos
app.use('/api/products', productRoutes);

// Rutas de categorías
app.use('/api/categories', categoryRoutes);

// Rutas de carrito
app.use('/api/cart', cartRoutes);

// Rutas de órdenes
app.use('/api/orders', orderRoutes);

// Rutas de tickets de soporte
app.use('/api/tickets', ticketRoutes);

// Rutas de RMA (devoluciones)
app.use('/api/rmas', rmaRoutes);

// Rutas de auditoría
app.use('/api/audit', auditRoutes);

// Rutas de vendedores
app.use('/api/vendors', vendorRoutes);
// ruta de generación de imágenes con IA (Replicate)
app.use('/api/ai', aiRoutes);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Ruta no encontrada
app.use(notFound);

// Manejador global de errores
app.use(errorHandler);

// =====================================================
// CONEXIÓN A BASE DE DATOS Y ARRANQUE DEL SERVIDOR
// =====================================================

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace';
//const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://192.168.43.187:27017/marketplace';

/**
 * Conectar a MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Iniciar servidor
 */
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Modo: ${process.env.NODE_ENV || 'development'}`);
  });
};

// Iniciar la aplicación
startServer();

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error(`❌ Error no manejado: ${err.message}`);
  process.exit(1);
});

module.exports = app;