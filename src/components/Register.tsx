import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

interface RegisterProps {
  handleRegister: () => void;
}

const Register: React.FC<RegisterProps> = ({ handleRegister }) => {
  const { authValues, handleAuthChange, handleRegister: registerUser, loading, error } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const navigate = useNavigate();

  // Listen for authentication state changes for auto-login
  useEffect(() => {
    if (registrationComplete) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in after registration
          setShowSuccess(true);
          setTimeout(() => {
            handleRegister();
            if (authValues.userType === 'driver') {
              navigate('/driver-home');
            } else {
              navigate('/user-home');
            }
          }, 1500); // Show success message for 1.5 seconds
        }
      });

      return () => unsubscribe();
    }
  }, [registrationComplete, authValues.userType, handleRegister, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    const user = await registerUser();
    
    if (user) {
      // Registration successful - Firebase automatically signs in the user
      setRegistrationComplete(true);
    }
  };

  const toggleTerms = () => setShowTerms(!showTerms);

  return (
    <div className="w-full max-w-sm mx-auto sm:w-96 card p-6 sm:p-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Create Account
        </h1>
        <p className="text-mobile-base text-gray-600">
          Join Urban Drive and get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="touch-spacing">
        {/* Success message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 animate-fade-in" role="alert">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-mobile-sm font-medium">Account created successfully! Signing you in...</span>
            </div>
          </div>
        )}

        {/* General error message */}
        {error && error.general && !showSuccess && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-mobile-sm font-medium">{error.general}</span>
            </div>
          </div>
        )}

        {/* Display Name field */}
        <div className="space-y-2">
          <label htmlFor="displayName" className="block text-mobile-sm font-medium text-gray-700">
            Display Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            required
            className={`input-field ${error && error.displayName ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="John Doe"
            value={authValues.displayName}
            onChange={handleAuthChange}
            aria-describedby={error && error.displayName ? "displayName-error" : undefined}
          />
          {error && error.displayName && (
            <p id="displayName-error" className="text-red-600 text-mobile-sm mt-1" role="alert">
              {error.displayName}
            </p>
          )}
        </div>

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
            placeholder="john@example.com"
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

        {/* Phone field */}
        <div className="space-y-2">
          <label htmlFor="phone" className="block text-mobile-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            className={`input-field ${error && error.phone ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="+1 234 567 8900"
            value={authValues.phone}
            onChange={handleAuthChange}
            aria-describedby={error && error.phone ? "phone-error" : undefined}
          />
          {error && error.phone && (
            <p id="phone-error" className="text-red-600 text-mobile-sm mt-1" role="alert">
              {error.phone}
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
            autoComplete="new-password"
            required
            className={`input-field ${error && error.password ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="Create a password"
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

        {/* Confirm Password field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-mobile-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className={`input-field ${error && error.confirmPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="Confirm your password"
            value={authValues.confirmPassword}
            onChange={handleAuthChange}
            aria-describedby={error && error.confirmPassword ? "confirmPassword-error" : undefined}
          />
          {error && error.confirmPassword && (
            <p id="confirmPassword-error" className="text-red-600 text-mobile-sm mt-1" role="alert">
              {error.confirmPassword}
            </p>
          )}
        </div>

        {/* User Type Selection */}
        <div className="space-y-3">
          <label className="block text-mobile-sm font-medium text-gray-700">
            I want to register as:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2 transition-colors duration-200">
              <input
                type="radio"
                name="userType"
                value="user"
                checked={authValues.userType === 'user'}
                onChange={handleAuthChange}
                className="sr-only"
                aria-describedby="user-type-description"
              />
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${authValues.userType === 'user' ? 'bg-black' : 'bg-gray-300'}`}></div>
                <span className="text-mobile-sm font-medium text-gray-700">User</span>
              </div>
            </label>
            <label className="flex items-center justify-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2 transition-colors duration-200">
              <input
                type="radio"
                name="userType"
                value="driver"
                checked={authValues.userType === 'driver'}
                onChange={handleAuthChange}
                className="sr-only"
                aria-describedby="driver-type-description"
              />
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${authValues.userType === 'driver' ? 'bg-black' : 'bg-gray-300'}`}></div>
                <span className="text-mobile-sm font-medium text-gray-700">Driver</span>
              </div>
            </label>
          </div>
          {/* Hidden descriptions for screen readers */}
          <span id="user-type-description" className="sr-only">
            Register as a user to request rides
          </span>
          <span id="driver-type-description" className="sr-only">
            Register as a driver to provide rides
          </span>
        </div>

        {/* Terms checkbox */}
        <div className="space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={authValues.acceptTerms}
                onChange={handleAuthChange}
                className="peer sr-only"
                required
                aria-describedby="terms-description"
              />
              <div className="w-6 h-6 border-2 border-gray-300 rounded-md group-hover:border-gray-400 peer-focus:ring-2 peer-focus:ring-black peer-focus:ring-offset-2 peer-checked:bg-black peer-checked:border-black flex items-center justify-center transition-all duration-200">
                <svg 
                  className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-mobile-sm text-gray-700 leading-5">
              I agree to the{' '}
              <button 
                type="button" 
                className="text-black underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 rounded"
                onClick={toggleTerms}
                aria-describedby="terms-button-description"
              >
                Terms of Use
              </button>
              {' '}and Privacy Policy
            </div>
          </label>
          {/* Hidden descriptions for screen readers */}
          <span id="terms-description" className="sr-only">
            You must accept the terms of use to create an account
          </span>
          <span id="terms-button-description" className="sr-only">
            Click to view the full terms of use
          </span>
        </div>

        {/* Register button */}
        <button
          type="submit"
          disabled={loading || !authValues.acceptTerms || showSuccess}
          className="btn-primary w-full mt-6 sm:mt-8 relative"
          aria-describedby="register-button-description"
        >
          {loading ? (
            <>
              <span className="spinner mr-2" aria-hidden="true"></span>
              <span>Creating Account...</span>
            </>
          ) : showSuccess ? (
            <>
              <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Success!</span>
            </>
          ) : (
            'Create Account'
          )}
        </button>
        
        {/* Hidden description for screen readers */}
        <span id="register-button-description" className="sr-only">
          {loading ? 'Please wait while we create your account' : 'Create your Urban Drive account'}
        </span>
      </form>

      {/* Terms Modal */}
      {showTerms && (
        <div className="modal-overlay" onClick={toggleTerms}>
          <div 
            className="modal-content p-6 sm:p-8" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="terms-modal-title"
            aria-describedby="terms-modal-description"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="terms-modal-title" className="text-xl sm:text-2xl font-bold text-gray-900">
                Terms of Use
              </h2>
              <button
                onClick={toggleTerms}
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors duration-200"
                aria-label="Close terms modal"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div id="terms-modal-description" className="max-h-96 overflow-y-auto scrollbar-hide text-mobile-sm text-gray-700 leading-6 space-y-4">
              {authValues.userType === 'user' ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">UrbanDrive Terms of Use for Users</h3>
                  <p className="mb-4">
                    Welcome to UrbanDrive! These terms of use ("Terms") govern your use of our platform as a user. By registering and using UrbanDrive, you agree to comply with these Terms.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">1. Account Registration</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>You must provide accurate and complete information during the registration process.</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">2. User Responsibilities</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>You agree to use the platform only for its intended purposes.</li>
                        <li>You must not engage in any activity that could harm the platform or other users.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">3. Communication</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>You may communicate with drivers through the platform's messaging system.</li>
                        <li>All communications must be respectful and appropriate.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">4. Privacy</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>Your personal information will be handled in accordance with our Privacy Policy.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">5. Termination</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>We reserve the right to terminate your account if you violate these Terms.</li>
                      </ul>
                    </div>
                  </div>
                  
                  <p className="mt-4 text-gray-700">
                    By accepting these Terms, you acknowledge that you have read, understood, and agree to be bound by them.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">UrbanDrive Terms of Use for Drivers</h3>
                  <p className="mb-4">
                    Welcome to UrbanDrive! These terms of use ("Terms") govern your use of our platform as a driver. By registering and using UrbanDrive, you agree to comply with these Terms.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">1. Account Registration</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>You must provide accurate and complete information during the registration process.</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">2. Driver Responsibilities</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>You agree to use the platform only for its intended purposes.</li>
                        <li>You must not engage in any activity that could harm the platform or other users.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">3. Communication</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>You may communicate with users through the platform's messaging system.</li>
                        <li>All communications must be respectful and appropriate.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">4. Location Services</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>You agree to enable location services to provide real-time updates to users.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">5. Privacy</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>Your personal information will be handled in accordance with our Privacy Policy.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">6. Termination</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>We reserve the right to terminate your account if you violate these Terms.</li>
                      </ul>
                    </div>
                  </div>
                  
                  <p className="mt-4 text-gray-700">
                    By accepting these Terms, you acknowledge that you have read, understood, and agree to be bound by them.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={toggleTerms}
                className="btn-secondary flex-1"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleAuthChange({
                    target: { name: 'acceptTerms', type: 'checkbox', checked: true }
                  } as React.ChangeEvent<HTMLInputElement>);
                  toggleTerms();
                }}
                className="btn-primary flex-1"
              >
                Accept Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional options */}
      <div className="mt-6 text-center">
        <p className="text-mobile-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            className="text-black font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded transition-colors duration-200"
            onClick={() => navigate('/login')}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;