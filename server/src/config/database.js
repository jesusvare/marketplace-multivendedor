const mongoose = require('mongoose');

/**
 * Configuración de la conexión a MongoDB
 */
const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB conectado exitosamente`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Base de datos: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(`❌ Error al conectar a MongoDB: ${error.message}`);
    throw error;
  }
};

/**
 * Evento de conexión exitosa
 */
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose conectado a MongoDB');
});

/**
 * Evento de error
 */
mongoose.connection.on('error', (err) => {
  console.error(`❌ Error de Mongoose: ${err.message}`);
});

/**
 * Evento de desconexión
 */
mongoose.connection.on('disconnected', () => {
  console.log('📊 Mongoose desconectado de MongoDB');
});

/**
 * Cerrar conexión cuando el proceso termine
 */
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('📊 Conexión de Mongoose cerrada por terminación de app');
  process.exit(0);
});

module.exports = connectDB;