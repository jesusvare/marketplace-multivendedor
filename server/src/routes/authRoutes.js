const express = require('express');
const router  = express.Router();
const {
  register,
  login,
  validateToken,
  getMe,
  logout,
  registerSpin
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');


//EN ESTOS ARCHIVOS ROUTES SE CREA EL ENDOPOINT O DEFINEN QUE URL EXISTEN EJE: '/export' Y ADEMAS A QUE FUNCION DIRIGEN LA PETICION, 
// EN ESTE CASO LAS FUNCIONES SON register..... y las otras 


// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/validate
router.get('/validate', protect, validateToken);

// GET /api/auth/me
router.get('/me', protect, getMe);

// POST /api/auth/logout
router.post('/logout', protect, logout);

// PUT /api/auth/spin — registrar uso de ruleta
router.put('/spin', protect, registerSpin);

module.exports = router;