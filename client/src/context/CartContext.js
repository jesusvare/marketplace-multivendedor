import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar carrito cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user?.role === 'client') {
      loadCart();
    } else {
      setCart([]);
    }
  }, [isAuthenticated, user]);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (response.success) {
        setCart(response.cart.items || []);
      }
    } catch (error) {
      console.error('Error al cargar carrito:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Agregar producto al carrito
   */
  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.warning('Debes iniciar sesión para agregar productos');
      return false;
    }
    try {
      const response = await cartService.addItem(productId, quantity);
      if (response.success) {
        setCart(response.cart.items || []);
        toast.success('Producto agregado al carrito ✓');
        return true;
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al agregar al carrito';
      toast.error(msg);
      return false;
    }
  };

  /**
   * Actualizar cantidad
   */
  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    try {
      const response = await cartService.updateQuantity(productId, quantity);
      if (response.success) {
        setCart(response.cart.items || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar cantidad');
    }
  };

  /**
   * Eliminar producto del carrito
   */
  const removeFromCart = async (productId) => {
    try {
      const response = await cartService.removeItem(productId);
      if (response.success) {
        setCart(response.cart.items || []);
        toast.info('Producto eliminado del carrito');
      }
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  /**
   * Vaciar carrito
   */
  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCart([]);
    } catch (error) {
      // Limpiar localmente aunque falle el backend
      setCart([]);
    }
  };

  /**
   * Calcular totales
   */
  const getCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, itemCount, total: subtotal };
  };

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartTotals,
      reloadCart: loadCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
};

export default CartContext;