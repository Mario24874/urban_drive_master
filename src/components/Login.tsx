import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../hooks/useAuth';
import SocialAuthButtons from './auth/SocialAuthButtons';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface LoginProps {
  handleLogin: (data: { user: User; email: string; password: string }) => void;
}

// Zod validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Helper function to convert Firebase errors to user-friendly messages
const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error.code;

  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection';
    case 'auth/invalid-credential':
      return 'Invalid credentials';
    case 'auth/invalid-email':
      return 'Invalid email format';
    default:
      return error.message || 'An unexpected error occurred';
  }
};

const Login: React.FC<LoginProps> = ({ handleLogin }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      const { email, password } = data;
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

      const user: User = {
        id: firebaseUser.uid,
        userType,
        displayName: userData?.displayName || '',
        email: firebaseUser.email || '',
        phone: userData?.phone || '',
        isVisible: userData?.isVisible || true,
      };

      toast.success('Welcome back!', {
        description: `Signed in as ${user.displayName || user.email}`,
      });

      handleLogin({ user, email, password });

      // Redirect to the appropriate dashboard
      navigate(user.userType === 'user' ? '/user-dashboard' : '/driver-dashboard');
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      toast.error('Login failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = form.getValues('email');

    if (!email) {
      toast.error('Email required', {
        description: 'Please enter your email address first',
      });
      return;
    }

    // Validate email format
    const emailValidation = loginSchema.shape.email.safeParse(email);
    if (!emailValidation.success) {
      toast.error('Invalid email', {
        description: 'Please enter a valid email address',
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent', {
        description: `Check your inbox at ${email}`,
        duration: 5000,
      });
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      toast.error('Password reset failed', {
        description: errorMessage,
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-sm mx-auto sm:max-w-md"
    >
      {/* Logo */}
      <div className="text-center mb-6">
        <img
          src="/assets/UrbanDriveLogo-512.png"
          alt="Urban Drive"
          className="h-24 w-24 mx-auto rounded-2xl shadow-xl mb-3 ring-1 ring-brand-yellow/20"
        />
        <h1 className="text-2xl font-bold text-white">Urban Drive</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to your Urban Drive account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm"
              disabled={isResettingPassword}
              onClick={handleForgotPassword}
            >
              {isResettingPassword ? 'Sending...' : 'Forgot your password?'}
            </Button>
          </div>

          <SocialAuthButtons />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Login;
