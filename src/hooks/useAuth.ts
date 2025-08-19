import { useState, ChangeEvent } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthValues {
  displayName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  userType: 'user' | 'driver';
  isVisible: boolean;
  userId: string;
}

interface AuthError {
  general?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

interface User {
  id: string;
  userType: 'user' | 'driver';
  displayName: string;
  email: string;
  phone: string;
  isVisible: boolean;
}

// Helper function to convert Firebase errors to user-friendly messages
const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please try logging in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email format.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email registration is not enabled.';
    case 'auth/invalid-credential':
      return 'Invalid credentials.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

// Validation helper functions
const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required.';
  if (!emailRegex.test(email)) return 'Invalid email format.';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
};

const validateDisplayName = (displayName: string): string | null => {
  if (!displayName) return 'Display name is required.';
  if (displayName.length < 2) return 'Display name must be at least 2 characters.';
  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required.';
  const phoneRegex = /^[+]?[\d\s\-\(\)]{8,}$/;
  if (!phoneRegex.test(phone)) return 'Invalid phone number format.';
  return null;
};

export const useAuth = () => {
  const [authValues, setAuthValues] = useState<AuthValues>({
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    userType: 'user',
    isVisible: true, // Valor predeterminado para la visibilidad
    userId: '', // Valor predeterminado para userId
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const handleAuthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAuthValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = (isRegister: boolean = false): AuthError | null => {
    const errors: AuthError = {};
    
    if (isRegister) {
      const displayNameError = validateDisplayName(authValues.displayName);
      if (displayNameError) errors.displayName = displayNameError;
      
      const phoneError = validatePhone(authValues.phone);
      if (phoneError) errors.phone = phoneError;
      
      if (authValues.password !== authValues.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
      
      if (!authValues.acceptTerms) {
        errors.general = 'You must accept the terms and conditions.';
      }
    }
    
    const emailError = validateEmail(authValues.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validatePassword(authValues.password);
    if (passwordError) errors.password = passwordError;
    
    return Object.keys(errors).length > 0 ? errors : null;
  };

  const handleRegister = async (): Promise<User | null> => {
    setLoading(true);
    setError(null);
  
    // Validate form
    const validationError = validateForm(true);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return null;
    }

    try {
      const { email, password, displayName, phone, userType, isVisible } = authValues;
      
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
  
      // Prepare user data
      const userData = {
        id: firebaseUser.uid,
        displayName,
        email,
        phone,
        userType,
        isVisible,
        createdAt: new Date().toISOString(),
      };
  
      // Save to appropriate Firestore collection
      const collection = userType === 'user' ? 'users' : 'drivers';
      await setDoc(doc(db, collection, firebaseUser.uid), userData);
  
      // Return User object
      const user: User = {
        id: firebaseUser.uid,
        userType,
        displayName,
        email,
        phone,
        isVisible,
      };

      return user;
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      setError({ general: errorMessage });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (): Promise<User | null> => {
    setLoading(true);
    setError(null);

    // Validate form
    const validationError = validateForm(false);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return null;
    }

    try {
      const { email, password } = authValues;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get additional data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const driverDoc = await getDoc(doc(db, 'drivers', firebaseUser.uid));

      let userData = null;
      let userType: 'user' | 'driver' = 'user';

      if (userDoc.exists()) {
        userData = userDoc.data();
        userType = 'user';
      } else if (driverDoc.exists()) {
        userData = driverDoc.data();
        userType = 'driver';
      } else {
        throw new Error('User data not found');
      }

      // Update authValues
      setAuthValues(prev => ({
        ...prev,
        userId: firebaseUser.uid,
        userType,
        displayName: userData?.displayName || '',
        phone: userData?.phone || '',
        isVisible: userData?.isVisible || true,
      }));

      // Return User object
      const user: User = {
        id: firebaseUser.uid,
        userType,
        displayName: userData?.displayName || '',
        email: firebaseUser.email || '',
        phone: userData?.phone || '',
        isVisible: userData?.isVisible || true,
      };

      return user;
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      setError({ general: errorMessage });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (email?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const emailToUse = email || authValues.email;
    
    if (!emailToUse) {
      setError({ email: 'Enter your email to reset password.' });
      setLoading(false);
      return false;
    }

    const emailValidationError = validateEmail(emailToUse);
    if (emailValidationError) {
      setError({ email: emailValidationError });
      setLoading(false);
      return false;
    }

    try {
      await sendPasswordResetEmail(auth, emailToUse);
      return true;
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      setError({ general: errorMessage });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setAuthValues({
      displayName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      userType: 'user',
      isVisible: true,
      userId: '',
    });
    setError(null);
  };

  return {
    authValues,
    handleAuthChange,
    handleRegister,
    handleLogin,
    handlePasswordReset,
    clearForm,
    loading,
    error,
    validateForm,
  };
};

export type { AuthValues, AuthError, User };