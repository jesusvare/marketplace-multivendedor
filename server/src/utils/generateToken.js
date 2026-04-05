const jwt = require('jsonwebtoken');

/**
 * Generar JWT Token
 * @param {string} id - ID del usuario
 * @returns {string} - Token JWT
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

module.exports = generateToken;