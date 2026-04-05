import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import { isValidEmail, validatePassword } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { FiMail, FiLock, FiUser, FiPhone } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Auth.css';

/**
 * Página de registro
 * Permite a nuevos usuarios crear una cuenta
 */
const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Validación del formulario
   */
  const validate = (values) => {
    const errors = {};

    if (!values.name) {
      errors.name = 'El nombre es requerido';
    } else if (values.name.length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!values.email) {
      errors.email = 'El email es requerido';
    } else if (!isValidEmail(values.email)) {
      errors.email = 'Email inválido';
    }

    if (!values.password) {
      errors.password = 'La contraseña es requerida';
    } else {
      const passwordValidation = validatePassword(values.password);
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.errors[0];
      }
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = 'Debes confirmar la contraseña';
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!values.acceptTerms) {
      errors.acceptTerms = 'Debes aceptar los términos y condiciones';
    }

    return errors;
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (formValues) => {
    const userData = {
      name: formValues.name,
      email: formValues.email,
      password: formValues.password,
      phone: formValues.phone,
      role: 'client' // Por defecto, los usuarios se registran como clientes
    };

    const result = await register(userData);

    if (result.success) {
      toast.success('¡Registro exitoso! Bienvenido');
      navigate('/productos');
    } else {
      toast.error(result.error);
    }
  };

  const { values, errors, isSubmitting, handleChange, handleSubmit: onSubmit } = useForm(
    { 
      name: '', 
      email: '', 
      phone: '',
      password: '', 
      confirmPassword: '',
      acceptTerms: false 
    },
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
              <h2>Crear Cuenta</h2>
              <p>Regístrate para comenzar a comprar</p>
            </div>

            {/* Formulario */}
            <form onSubmit={onSubmit} className="auth-form">
              <Input
                label="Nombre completo"
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                error={errors.name}
                icon={<FiUser />}
                placeholder="Juan Pérez"
                required
              />

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
                label="Teléfono"
                type="tel"
                name="phone"
                value={values.phone}
                onChange={handleChange}
                error={errors.phone}
                icon={<FiPhone />}
                placeholder="88888888"
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

              <Input
                label="Confirmar contraseña"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
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
                  <span>Mostrar contraseñas</span>
                </label>
              </div>

              <div className="terms-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={values.acceptTerms}
                    onChange={handleChange}
                  />
                  <span>
                    Acepto los{' '}
                    <Link to="/terminos" target="_blank">
                      términos y condiciones
                    </Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <span className="input-error">{errors.acceptTerms}</span>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={isSubmitting}
              >
                Crear Cuenta
              </Button>
            </form>

            {/* Link a login */}
            <div className="auth-footer">
              <p>
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login">Inicia sesión aquí</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Columna derecha - Imagen/Info */}
        <div className="auth-visual-section">
          <div className="visual-content">
            <h2>Comienza tu experiencia</h2>
            <p>
              Regístrate ahora y accede a miles de productos de
              vendedores verificados en todo el país.
            </p>
            <ul className="features-list">
              <li>✓ Registro rápido y sencillo</li>
              <li>✓ Sin costo de membresía</li>
              <li>✓ Ofertas exclusivas para nuevos usuarios</li>
              <li>✓ Cupón de bienvenida en tu primera compra</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;