const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * @desc    Obtener carrito del usuario
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price images stock status vendor',
        populate: {
          path: 'vendor',
          select: 'name vendorInfo.businessName'
        }
      });

    // Si no existe carrito, crear uno vacío
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener carrito',
      error: error.message
    });
  }
};

/**
 * @desc    Agregar item al carrito
 * @route   POST /api/cart/add
 * @access  Private
 */
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Verificar que el producto existe y está activo
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o no disponible'
      });
    }

    // Verificar stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente'
      });
    }

    // Obtener o crear carrito
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Actualizar cantidad
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente para esta cantidad'
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Agregar nuevo item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();

    // Poblar datos para respuesta
    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price images stock status vendor',
      populate: {
        path: 'vendor',
        select: 'name vendorInfo.businessName'
      }
    });

    res.json({
      success: true,
      message: 'Producto agregado al carrito',
      cart
    });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar al carrito',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar cantidad de item
 * @route   PUT /api/cart/update
 * @access  Private
 */
const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    // Buscar el item
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado en el carrito'
      });
    }

    // Verificar stock
    const product = await Product.findById(productId);
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente'
      });
    }

    // Actualizar cantidad
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Poblar datos
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price images stock status vendor',
      populate: {
        path: 'vendor',
        select: 'name vendorInfo.businessName'
      }
    });

    res.json({
      success: true,
      message: 'Cantidad actualizada',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Error al actualizar carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar carrito',
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar item del carrito
 * @route   DELETE /api/cart/remove/:productId
 * @access  Private
 */
const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    // Filtrar item
    cart.items = cart.items.filter(
      item => item.product.toString() !== req.params.productId
    );

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price images stock status vendor',
      populate: {
        path: 'vendor',
        select: 'name vendorInfo.businessName'
      }
    });

    res.json({
      success: true,
      message: 'Producto eliminado del carrito',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar del carrito',
      error: error.message
    });
  }
};

/**
 * @desc    Vaciar carrito
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Carrito vaciado',
      cart
    });
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al vaciar carrito',
      error: error.message
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};