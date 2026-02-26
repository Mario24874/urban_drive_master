import { Loader2 } from 'lucide-react';
import { useAdminAuth } from './hooks/useAdminAuth';
import AdminLayout from './components/AdminLayout';
import AdminAccessDenied from './components/AdminAccessDenied';

// This is the lazy-loaded entry point for /admin/*
// It handles auth check before rendering the admin layout

export default function AdminPortal() {
  const { firebaseUser, adminUser, loading, isAdmin } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated → redirect to app root (App.tsx handles login)
  if (!firebaseUser) {
    window.location.href = '/';
    return null;
  }

  // Authenticated but not an admin
  if (!isAdmin || !adminUser) {
    return <AdminAccessDenied />;
  }

  return <AdminLayout adminUser={adminUser} />;
}
