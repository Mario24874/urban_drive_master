// Admin portal type definitions

export interface AdminUser {
  uid: string;
  email: string;
  role: 'superadmin' | 'admin';
  createdAt: Date;
}

export type AdminSection =
  | 'dashboard'
  | 'users'
  | 'companies'
  | 'subscriptions'
  | 'fleet'
  | 'maintenance'
  | 'documents'
  | 'coupons'
  | 'admins';

export interface AdminSidebarItem {
  id: AdminSection;
  labelKey: string;
  icon: string;
  superadminOnly?: boolean;
}

export const ADMIN_SIDEBAR_ITEMS: AdminSidebarItem[] = [
  { id: 'dashboard',     labelKey: 'adminDashboard',     icon: 'LayoutDashboard' },
  { id: 'users',         labelKey: 'adminUsers',         icon: 'Users' },
  { id: 'companies',     labelKey: 'adminCompanies',     icon: 'Building2' },
  { id: 'subscriptions', labelKey: 'adminSubscriptions', icon: 'CreditCard' },
  { id: 'fleet',         labelKey: 'adminFleet',         icon: 'Car' },
  { id: 'maintenance',   labelKey: 'adminMaintenance',   icon: 'Wrench' },
  { id: 'documents',     labelKey: 'adminDocuments',     icon: 'FileText' },
  { id: 'coupons',       labelKey: 'adminCoupons',       icon: 'Ticket' },
  { id: 'admins',        labelKey: 'adminAdmins',        icon: 'ShieldCheck', superadminOnly: true },
];
