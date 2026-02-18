import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface RegisterProps {
  handleRegister: () => void;
}

// Zod validation schema
const registerSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  phone: z
    .string()
    .min(8, 'Phone number must be at least 8 digits')
    .regex(/^[+]?[\d\s\-\(\)]{8,}$/, 'Invalid phone number format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z
    .string()
    .min(6, 'Confirm password is required'),
  userType: z.enum(['user', 'driver']),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Helper function for Firebase errors
const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error.code;

  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please try logging in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email format.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email registration is not enabled.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

const Register: React.FC<RegisterProps> = ({ handleRegister }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      userType: 'user',
      acceptTerms: false,
    },
  });

  const userType = form.watch('userType');

  // Auto-login after registration
  useEffect(() => {
    if (registrationComplete) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const targetRoute = userType === 'driver' ? '/driver-home' : '/user-home';
          setTimeout(() => {
            handleRegister();
            navigate(targetRoute);
          }, 1500);
        }
      });

      return () => unsubscribe();
    }
  }, [registrationComplete, userType, handleRegister, navigate]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    try {
      const { email, password, displayName, phone, userType } = data;

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
        isVisible: true,
        createdAt: new Date().toISOString(),
      };

      // Save to appropriate Firestore collection
      const collection = userType === 'user' ? 'users' : 'drivers';
      await setDoc(doc(db, collection, firebaseUser.uid), userData);

      toast.success('Account created successfully!', {
        description: 'Signing you in...',
      });

      setRegistrationComplete(true);
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      toast.error('Registration failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = () => {
    form.setValue('acceptTerms', true);
    setShowTerms(false);
    toast.success('Terms accepted', {
      description: 'You can now create your account',
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm mx-auto sm:max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              Create Account
            </CardTitle>
            <CardDescription className="text-base">
              Join Urban Drive and get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Display Name */}
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1 234 567 8900"
                          autoComplete="tel"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* User Type Radio Buttons */}
                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I want to register as:</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-3">
                          <Label
                            htmlFor="userType-user"
                            className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              field.value === 'user'
                                ? 'border-primary bg-primary/5'
                                : 'border-input hover:bg-accent'
                            }`}
                          >
                            <input
                              id="userType-user"
                              type="radio"
                              value="user"
                              checked={field.value === 'user'}
                              onChange={() => field.onChange('user')}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <div
                                className={`w-4 h-4 rounded-full mx-auto mb-1 ${
                                  field.value === 'user' ? 'bg-primary' : 'bg-muted'
                                }`}
                              />
                              <span className="text-sm font-medium">User</span>
                            </div>
                          </Label>

                          <Label
                            htmlFor="userType-driver"
                            className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              field.value === 'driver'
                                ? 'border-primary bg-primary/5'
                                : 'border-input hover:bg-accent'
                            }`}
                          >
                            <input
                              id="userType-driver"
                              type="radio"
                              value="driver"
                              checked={field.value === 'driver'}
                              onChange={() => field.onChange('driver')}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <div
                                className={`w-4 h-4 rounded-full mx-auto mb-1 ${
                                  field.value === 'driver' ? 'bg-primary' : 'bg-muted'
                                }`}
                              />
                              <span className="text-sm font-medium">Driver</span>
                            </div>
                          </Label>
                        </div>
                      </FormControl>
                      <FormDescription>
                        {field.value === 'user'
                          ? 'Register as a user to request rides'
                          : 'Register as a driver to provide rides'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Accept Terms Checkbox */}
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          I agree to the{' '}
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-sm"
                            onClick={() => setShowTerms(true)}
                          >
                            Terms of Use
                          </Button>{' '}
                          and Privacy Policy
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={isLoading || registrationComplete}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating Account...
                    </>
                  ) : registrationComplete ? (
                    <>
                      <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Success!
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </Form>

            {/* Sign in link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Terms of Use Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {userType === 'user'
                ? 'UrbanDrive Terms of Use for Users'
                : 'UrbanDrive Terms of Use for Drivers'}
            </DialogTitle>
            <DialogDescription>
              Please read and accept our terms of use to continue
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p>
              Welcome to UrbanDrive! These terms of use ("Terms") govern your use of our
              platform as a {userType}. By registering and using UrbanDrive, you agree to
              comply with these Terms.
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">1. Account Registration</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>You must provide accurate and complete information during registration.</li>
                  <li>You are responsible for maintaining the confidentiality of your credentials.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-1">
                  2. {userType === 'user' ? 'User' : 'Driver'} Responsibilities
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>You agree to use the platform only for its intended purposes.</li>
                  <li>You must not engage in any activity that could harm the platform or other users.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-1">3. Communication</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    You may communicate with {userType === 'user' ? 'drivers' : 'users'} through the
                    platform's messaging system.
                  </li>
                  <li>All communications must be respectful and appropriate.</li>
                </ul>
              </div>

              {userType === 'driver' && (
                <div>
                  <h4 className="font-semibold mb-1">4. Location Services</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>You agree to enable location services to provide real-time updates to users.</li>
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-1">{userType === 'driver' ? '5' : '4'}. Privacy</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Your personal information will be handled in accordance with our Privacy Policy.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-1">{userType === 'driver' ? '6' : '5'}. Termination</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>We reserve the right to terminate your account if you violate these Terms.</li>
                </ul>
              </div>
            </div>

            <p className="text-muted-foreground">
              By accepting these Terms, you acknowledge that you have read, understood, and agree
              to be bound by them.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowTerms(false)}>
              Close
            </Button>
            <Button onClick={handleAcceptTerms}>Accept Terms</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Register;
