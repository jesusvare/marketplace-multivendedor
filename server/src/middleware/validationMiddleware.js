const { validationResult } = require('express-validator');

/**
 * Middleware: Validar resultados de express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: extractedErrors
    });
  }
  
  next();
};

module.exports = validate;