import React, { memo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Camera, RefreshCw } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useApp } from '../../contexts/AppContext';
import type { UserData } from '../../types';

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
  FormDescription,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

interface ProfileEditorProps {
  user: UserData;
  onUpdate?: (updatedUser: UserData) => void;
}

// Validation schema
const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  username: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional(),
  userType: z.enum(['user', 'driver']),
  isVisible: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onUpdate }) => {
  const { t } = useApp();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('selectImage'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('imageTooLarge'));
      return;
    }

    const compressToDataURL = (f: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(f);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const maxSize = 200;
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = url;
      });

    setUploadingPhoto(true);
    try {
      const dataURL = await compressToDataURL(file);
      const collName = user.userType === 'driver' ? 'drivers' : 'users';
      await updateDoc(doc(db, collName, user.id), { photoURL: dataURL });
      onUpdate?.({ ...user, photoURL: dataURL });
      toast.success(t('photoUpdated'));
    } catch (error: any) {
      console.error('Error al actualizar la foto:', error);
      toast.error(t('photoError'), { description: error.message });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName || '',
      username: user.username || '',
      phone: user.phone || '',
      bio: user.bio || '',
      userType: user.userType || 'user',
      isVisible: user.isVisible !== undefined ? user.isVisible : true,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Update Firebase Auth display name
      if (auth.currentUser && data.displayName) {
        await updateProfile(auth.currentUser, { displayName: data.displayName });
      }

      // Update ONLY the form fields in Firestore — never touch contacts, photoURL, etc.
      const collName = user.userType === 'driver' ? 'drivers' : 'users';
      await updateDoc(doc(db, collName, user.id), {
        displayName: data.displayName,
        username: data.username || '',
        phone: data.phone || '',
        bio: data.bio || '',
        userType: data.userType,
        isVisible: data.isVisible,
      });

      toast.success(t('profileUpdated'));

      if (onUpdate) {
        onUpdate({ ...user, ...data });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(t('profileError'), { description: error.message });
    }
  };

  const getUserInitials = () => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-4"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4 mb-4">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL} alt={user.displayName} />
                <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              {uploadingPhoto ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <RefreshCw className="h-6 w-6 text-white animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div>
              <CardTitle>{t('editProfile')}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{t('tapAvatarToChange')}<br/>{t('maxPhotoSize')}</p>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Display Name */}
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('displayName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('usernameOptional')}</FormLabel>
                    <FormControl>
                      <Input placeholder="@johndoe" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('usernameDesc')}
                    </FormDescription>
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
                    <FormLabel>{t('phoneOptional')}</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bioOptional')}</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="w-full p-3 border border-input rounded-md focus:ring-2 focus:ring-ring focus:outline-none resize-none text-sm"
                      />
                    </FormControl>
                    <FormDescription>
                      {t('bioMaxChars')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* User Type */}
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('accountType')}</FormLabel>
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
                            <span className="text-sm font-medium">{t('typeUser')}</span>
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
                            <span className="text-sm font-medium">{t('typeDriver')}</span>
                          </div>
                        </Label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Visibility Toggle */}
              <FormField
                control={form.control}
                name="isVisible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t('visibility')}</FormLabel>
                      <FormDescription>
                        {t('visibilityDesc')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-border"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('saving')}
                  </>
                ) : (
                  t('saveChanges')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default memo(ProfileEditor);
