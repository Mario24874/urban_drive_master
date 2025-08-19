import React, { useState } from 'react';
import { useAuth, User } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  handleLogin: (data: { user: User; email: string; password: string }) => void;
}

const Login: React.FC<LoginProps> = ({ handleLogin }) => {
  const { authValues, handleAuthChange, handleLogin: authHandleLogin, handlePasswordReset, loading, error } = useAuth();
  const navigate = useNavigate();
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await authHandleLogin();
    if (user) {
      handleLogin({ user, email: authValues.email, password: authValues.password });
      
      // Redirect to the appropriate dashboard
      navigate(user.userType === 'user' ? '/user-dashboard' : '/driver-dashboard');
    }
  };

  const handleForgotPassword = async () => {
    setIsResettingPassword(true);
    setResetEmailSent(false);
    
    const success = await handlePasswordReset();
    
    if (success) {
      setResetEmailSent(true);
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setResetEmailSent(false);
        setIsResettingPassword(false);
      }, 5000);
    }
    
    setIsResettingPassword(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto sm:w-96 card p-6 sm:p-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome Back
        </h1>
        <p className="text-mobile-base text-gray-600">
          Sign in to your Urban Drive account
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="touch-spacing">
        {/* General error message */}
        {error && error.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
            <span className="text-mobile-sm font-medium">{error.general}</span>
          </div>
        )}

        {/* Email field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-mobile-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`input-field ${error && error.email ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="Enter your email"
            value={authValues.email}
            onChange={handleAuthChange}
            aria-describedby={error && error.email ? "email-error" : undefined}
          />
          {error && error.email && (
            <p id="email-error" className="text-red-600 text-mobile-sm mt-1" role="alert">
              {error.email}
            </p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-mobile-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={`input-field ${error && error.password ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="Enter your password"
            value={authValues.password}
            onChange={handleAuthChange}
            aria-describedby={error && error.password ? "password-error" : undefined}
          />
          {error && error.password && (
            <p id="password-error" className="text-red-600 text-mobile-sm mt-1" role="alert">
              {error.password}
            </p>
          )}
        </div>

        {/* Login button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-6 sm:mt-8 relative"
          aria-describedby="login-button-description"
        >
          {loading ? (
            <>
              <span className="spinner mr-2" aria-hidden="true"></span>
              <span>Signing in...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
        
        {/* Hidden description for screen readers */}
        <span id="login-button-description" className="sr-only">
          {loading ? 'Please wait while we sign you in' : 'Sign in to your Urban Drive account'}
        </span>
      </form>

      {/* Password reset success message */}
      {resetEmailSent && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg" role="alert">
          <span className="text-mobile-sm">
            Se ha enviado un correo de recuperación a {authValues.email}
          </span>
        </div>
      )}

      {/* Additional options */}
      <div className="mt-6 text-center">
        <button
          type="button"
          disabled={isResettingPassword || !authValues.email}
          className="text-mobile-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 underline focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleForgotPassword}
          title={!authValues.email ? "Ingresa tu email primero" : "Recuperar contraseña"}
        >
          {isResettingPassword ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
        </button>
      </div>
    </div>
  );
};

export default Login;