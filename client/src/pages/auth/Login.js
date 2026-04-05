import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import { isValidEmail } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { FiMail, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Auth.css';

/**
 * Página de inicio de sesión
 * Permite a los usuarios autenticarse en el sistema
 */
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Validación del formulario
   */
  const validate = (values) => {
    const errors = {};

    if (!values.email) {
      errors.email = 'El email es requerido';
    } else if (!isValidEmail(values.email)) {
      errors.email = 'Email inválido';
    }

    if (!values.password) {
      errors.password = 'La contraseña es requerida';
    }

    return errors;
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (formValues) => {
    const result = await login(formValues.email, formValues.password);

    if (result.success) {
      toast.success('¡Bienvenido!');
      
      // Redirigir según el rol del usuario
      switch (result.user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'vendor':
          navigate('/vendedor');
          break;
        case 'support':
          navigate('/soporte');
          break;
        case 'client':
          navigate('/productos');
          break;
        default:
          navigate('/');
      }
    } else {
      toast.error(result.error);
    }
  };

  const { values, errors, isSubmitting, handleChange, handleSubmit: onSubmit } = useForm(
    { email: '', password: '' },
    handleSubmit,
    validate
  );

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Columna izquierda - Formulario */}
        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            {/* Logo */}
            <div className="auth-logo">
              <img src="/logo192.png" alt="Logo" />
              <h1>Marketplace</h1>
            </div>

            {/* Título */}
            <div className="auth-header">
              <h2>Iniciar Sesión</h2>
              <p>Bienvenido de nuevo, ingresa tus credenciales</p>
            </div>

            {/* Formulario */}
            <form onSubmit={onSubmit} className="auth-form">
              <Input
                label="Email"
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                error={errors.email}
                icon={<FiMail />}
                placeholder="tu@email.com"
                required
              />

              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={values.password}
                onChange={handleChange}
                error={errors.password}
                icon={<FiLock />}
                placeholder="••••••••"
                required
              />

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  <span>Mostrar contraseña</span>
                </label>

                <Link to="/recuperar-password" className="forgot-link">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={isSubmitting}
              >
                Iniciar Sesión
              </Button>
            </form>

            {/* Link a registro */}
            <div className="auth-footer">
              <p>
                ¿No tienes una cuenta?{' '}
                <Link to="/registro">Regístrate aquí</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Columna derecha - Imagen/Info */}
        <div className="auth-visual-section">
          <div className="visual-content">
            <h2>Únete a nuestro Marketplace</h2>
            <p>
              Descubre miles de productos de vendedores verificados.
              Compra seguro y recibe soporte post-venta de calidad.
            </p>
            <ul className="features-list">
              <li>✓ Múltiples vendedores en un solo lugar</li>
              <li>✓ Pagos seguros y protegidos</li>
              <li>✓ Soporte al cliente 24/7</li>
              <li>✓ Devoluciones fáciles y rápidas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;