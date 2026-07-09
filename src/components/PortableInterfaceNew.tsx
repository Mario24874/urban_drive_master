import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useLocation } from '../hooks/useLocation';
import { useInvitations } from '../hooks/useInvitations';
import { useApp } from '../contexts/AppContext';
import { useSubscription } from '../features/enterprise/hooks/useSubscription';
import { useFreePlanLimits } from '../hooks/useFreePlanLimits';
import type { UserData, Contact } from '../types';

// Components — GPSMapComponent is lazy to defer mapbox-gl loading until map tab opens
const GPSMapComponent = lazy(() => import('./GPSMapComponent'));
import ChatInterface from './ChatInterface';
import InvitationBanner from './InvitationBanner';
import messagingService from '../services/messaging';
import ConversationsList from './ConversationsList';
import ProfileEditor from './profile/ProfileEditor';
import ContactList from './contacts/ContactList';
import SettingsSheet from './SettingsSheet';
import Login from './Login';
import Register from './Register';
import Landing from './landing/Landing';
import PricingPlans from '../features/enterprise/components/PricingPlans';
import CompanySetup from '../features/enterprise/components/CompanySetup';
import FleetManager from '../features/enterprise/components/FleetManager';
import DriverManager from '../features/enterprise/components/DriverManager';
import MaintenanceScheduler from '../features/enterprise/components/MaintenanceScheduler';
import DocumentsDashboard from '../features/enterprise/components/DocumentsDashboard';
import FleetAnalytics from '../features/enterprise/components/FleetAnalytics';
import { useCompany } from '../features/enterprise/hooks/useCompany';

// Shadcn UI Components
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { RefreshCw, MapPinOff, Eye, EyeOff } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../features/enterprise/types/subscription';
import { toast } from 'sonner';
import { Home, MapPin, Users, MessageSquare, User as UserIcon } from './Icons';

// ─── Plan Badge ───────────────────────────────────────────────────────────────
const PLAN_BADGE_STYLES: Record<string, string> = {
  free:   'bg-white/10 text-white/50 border border-white/15',
  bronce: 'bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-sm',
  plata:  'bg-gradient-to-r from-slate-500 to-slate-300 text-white shadow-sm',
  oro:    'bg-gradient-to-r from-yellow-500 to-yellow-300 text-brand-ink shadow-sm',
};
const PLAN_LABELS: Record<string, string> = {
  free: 'Plan Gratuito', bronce: 'Bronce', plata: 'Plata', oro: 'Oro',
};
const PlanBadge: React.FC<{ tier: string; size?: 'sm' | 'lg' }> = ({ tier, size = 'sm' }) => (
  <span className={`inline-flex items-center font-semibold rounded-full ${
    size === 'lg' ? 'text-sm px-4 py-1.5' : 'text-xs px-2.5 py-0.5'
  } ${PLAN_BADGE_STYLES[tier] ?? PLAN_BADGE_STYLES.free}`}>
    {PLAN_LABELS[tier] ?? 'Plan Gratuito'}
  </span>
);

interface PortableInterfaceProps {
  user: UserData | null;
  isAuthenticated: boolean;
  handleLogin?: (data: any) => void;
  handleRegister?: () => void;
  onUserUpdate?: (updatedUser: UserData) => void;
}

const PortableInterface: React.FC<PortableInterfaceProps> = ({
  user,
  isAuthenticated,
  handleLogin,
  handleRegister,
  onUserUpdate,
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [navTarget, setNavTarget] = useState<Contact | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [showFleetManager, setShowFleetManager] = useState(false);
  const [showDriverManager, setShowDriverManager] = useState(false);
  const [showMaintenanceScheduler, setShowMaintenanceScheduler] = useState(false);
  const [showDocumentsDashboard, setShowDocumentsDashboard] = useState(false);
  const [showFleetAnalytics, setShowFleetAnalytics] = useState(false);

  const { t } = useApp();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();
  const { tier: subscriptionTier, isActive: hasActiveSub } = useSubscription(user?.id ?? null);
  const { company } = useCompany(user?.id ?? null);
  const planLimits = useFreePlanLimits(user?.id ?? null, subscriptionTier);

  const maxContacts = SUBSCRIPTION_PLANS[subscriptionTier].maxContacts;
  const isFreeSlotPlan = subscriptionTier === 'free';

  // Detect post-payment redirect params (?subscription=success|canceled)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('subscription');
    if (result === 'success') {
      window.history.replaceState({}, '', '/');
      const timer = setTimeout(() => {
        toast.success(t('subscriptionActivated'), {
          description: t('subscriptionActivatedDesc').replace('{plan}', PLAN_LABELS[subscriptionTier] ?? subscriptionTier),
          duration: 6000,
        });
      }, 800);
      return () => clearTimeout(timer);
    }
    if (result === 'canceled') {
      window.history.replaceState({}, '', '/');
      toast.info(t('subscriptionCanceled'));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Custom hooks
  const { location, loading: locationLoading, refreshLocation } = useLocation(user);

  // Total de mensajes no leídos → badge del tab Chat
  useEffect(() => {
    if (!user?.id) return;
    const unsub = messagingService.subscribeToUserConversations(user.id, (convs) => {
      setUnreadMessages(convs.reduce((sum, c) => sum + (c.unreadCount?.[user.id] || 0), 0));
    });
    return unsub;
  }, [user?.id]);

  // Invitations — hoisted here so they stay mounted regardless of active tab
  const invitationsData = useInvitations(
    user?.id ?? null,
    user?.userType,
    user?.email ?? undefined,
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // silently ignore
    }
  };

  /** Called from ContactList "Navigate here" — switches to map tab and starts navigation */
  const handleNavigateToContact = (contact: Contact) => {
    // Spread to create a new object ref so GPSMapComponent's useEffect always fires
    setNavTarget({ ...contact });
    setActiveTab('map');
  };

  // Not authenticated: public marketing landing by default; auth forms on /login & /register.
  if (!isAuthenticated || !user) {
    const path = routerLocation.pathname;
    if (path !== '/login' && path !== '/register') {
      return <Landing />;
    }
    const isRegister = path === '/register';
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
        {/* Fondo branded: poster del hero (autopista nocturna) + capa de marca. */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/assets/video/hero-poster.jpg)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 60% at 50% 30%, rgba(255,214,10,.10), transparent 60%), linear-gradient(180deg, rgba(10,11,13,.82), rgba(10,11,13,.95))',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-md">
        {isRegister ? (
          <div className="w-full">
            <Register handleRegister={handleRegister || (() => {})} />
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => navigate('/login')}
                className="text-sm"
              >
                {t('alreadyHaveAccount')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <Login handleLogin={handleLogin || (() => {})} />
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => navigate('/register')}
                className="text-sm"
              >
                {t('dontHaveAccount')}
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  return (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col bg-brand-ink"
      style={{
        backgroundImage:
          'radial-gradient(80% 50% at 50% -10%, rgba(255,214,10,.07), transparent 60%), radial-gradient(60% 40% at 100% 100%, rgba(45,211,111,.05), transparent 60%)',
      }}
    >
      {/* ── App Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 landscape:h-10 bg-black/50 backdrop-blur-md border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src="/assets/UrbanDriveLogo-512.png" alt="Urban Drive" className="h-9 w-9 rounded-xl ring-1 ring-brand-yellow/20" />
          <span className="font-bold text-white text-base hidden sm:inline">Urban Drive</span>
        </div>
        <SettingsSheet
          user={user}
          onLogout={handleLogout}
          onOpenPricing={() => setShowPricing(true)}
          subscriptionTier={subscriptionTier}
          company={company}
          onOpenCompanySetup={() => setShowCompanySetup(true)}
          onOpenFleetManager={() => setShowFleetManager(true)}
          onOpenDriverManager={() => setShowDriverManager(true)}
          onOpenMaintenanceScheduler={() => setShowMaintenanceScheduler(true)}
          onOpenDocumentsDashboard={() => setShowDocumentsDashboard(true)}
          onOpenFleetAnalytics={() => setShowFleetAnalytics(true)}
        />
      </header>

      {/* Invitación pendiente — aceptar/rechazar en 1 tap */}
      <InvitationBanner
        invitation={invitationsData.received[0] ?? null}
        count={invitationsData.pendingCount}
        onAccept={(inv) => invitationsData.acceptInvitation(inv, user.userType)}
        onReject={(inv) => invitationsData.rejectInvitation(inv.id)}
        onView={() => setActiveTab('contacts')}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Desktop Tabs List */}
        <div className="hidden sm:block border-b border-white/10 bg-black/50 backdrop-blur-md">
          <div className="container-responsive py-3">
            <TabsList className="grid w-full max-w-2xl grid-cols-5 mx-auto bg-white/5 [&_[data-state=active]]:bg-brand-yellow [&_[data-state=active]]:text-brand-ink">
              <TabsTrigger value="home" className="flex items-center space-x-2">
                <Home size={18} />
                <span className="hidden md:inline">{t('home')}</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center space-x-2">
                <MapPin size={18} />
                <span className="hidden md:inline">{t('map')}</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center space-x-2 relative">
                <Users size={18} />
                <span className="hidden md:inline">{t('contacts')}</span>
                {invitationsData.pendingCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                    {invitationsData.pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center space-x-2 relative">
                <MessageSquare size={18} />
                <span className="hidden md:inline">{t('messages')}</span>
                {unreadMessages > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 p-0 text-[10px] flex items-center justify-center bg-brand-green text-brand-ink">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <UserIcon size={18} />
                <span className="hidden md:inline">{t('profile')}</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {/* Home Tab */}
          <TabsContent value="home" className="h-full m-0 p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div>
                <h1 className="font-display text-3xl font-bold leading-tight text-white mb-1">
                  {t('welcome')}, {user.displayName || user.email}!
                </h1>
                <div className="flex items-center gap-2 mt-1 mb-1">
                  <PlanBadge tier={subscriptionTier} />
                </div>
                <p className="text-white/60 text-sm">
                  {user.userType === 'driver'
                    ? t('subtitleDriver')
                    : t('subtitleUser')}
                </p>
              </div>

              {/* Plan banner: upgrade CTA for free, active plan info for paid */}
              {!hasActiveSub ? (
                <motion.button
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setShowPricing(true)}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-600/20 via-yellow-500/15 to-orange-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all text-left"
                >
                  <div>
                    <p className="text-amber-300 font-semibold text-sm">✨ Desbloquea más funciones</p>
                    <p className="text-amber-300/60 text-xs mt-0.5">Planes desde $19/mes · Cancela cuando quieras</p>
                  </div>
                  <span className="flex-shrink-0 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {t('planUpgrade')}
                  </span>
                </motion.button>
              ) : (
                <motion.button
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setShowPricing(true)}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <PlanBadge tier={subscriptionTier} size="lg" />
                    <p className="text-white/50 text-xs">{t('planChangePlan')} →</p>
                  </div>
                </motion.button>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <StatCard
                  label={t('contacts')}
                  value={user.contacts?.length ?? 0}
                  icon={<Users size={20} />}
                />
                <StatCard
                  label={location ? `${t('accuracy')}: ${Math.round(location.accuracy || 0)}m` : t('location')}
                  value={location ? <MapPin size={24} /> : <MapPinOff size={24} />}
                  tone={location ? 'success' : 'danger'}
                  icon={<MapPin size={20} />}
                />
                <StatCard
                  label={user.isVisible ? t('visible') : t('hidden')}
                  value={user.isVisible ? <Eye size={24} /> : <EyeOff size={24} />}
                  tone={user.isVisible ? 'success' : 'default'}
                  icon={<UserIcon size={20} />}
                />
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-white">{t('quickActions')}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={refreshLocation}
                    disabled={locationLoading}
                    variant="outline"
                    className="h-auto py-4"
                  >
                    <RefreshCw
                      size={20}
                      className={`mr-2 ${locationLoading ? 'animate-spin' : ''}`}
                    />
                    {t('refreshLocation')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('map')}
                    variant="outline"
                    className="h-auto py-4"
                  >
                    <MapPin size={20} className="mr-2" />
                    {t('viewMap')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('contacts')}
                    variant="outline"
                    className="h-auto py-4"
                  >
                    <Users size={20} className="mr-2" />
                    {t('browseContacts')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('profile')}
                    variant="outline"
                    className="h-auto py-4"
                  >
                    <UserIcon size={20} className="mr-2" />
                    {t('editProfile')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Map Tab — GPSMapComponent is lazy so mapbox-gl loads only on first visit */}
          <TabsContent value="map" className="h-full m-0">
            <Suspense fallback={
              <div className="flex h-full items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            }>
              <GPSMapComponent
                userLocation={location}
                user={user}
                userId={user.id}
                userType={user.userType}
                isActive={activeTab === 'map'}
                navTarget={navTarget}
              />
            </Suspense>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="h-full m-0 p-4 overflow-y-auto">
            <div className="h-full max-w-2xl mx-auto">
              <ContactList
                userId={user.id}
                userType={user.userType}
                currentUser={user}
                selectedContact={selectedContact}
                onSelectContact={(contact) => {
                  setSelectedContact(contact);
                  setActiveTab('messages');
                }}
                onNavigateToContact={handleNavigateToContact}
                invitationsData={invitationsData}
                maxContacts={maxContacts}
                planName={PLAN_LABELS[subscriptionTier]}
                onUpgrade={() => setShowPricing(true)}
                isFreeSlotPlan={isFreeSlotPlan}
              />
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="h-full m-0">
            {selectedContact ? (
              <ChatInterface
                currentUserId={user.id}
                currentUserName={user.displayName || user.email || 'User'}
                selectedContact={selectedContact}
                onBack={() => setSelectedContact(null)}
                planLimits={planLimits}
                onUpgrade={() => setShowPricing(true)}
              />
            ) : (
              <ConversationsList
                currentUserId={user.id}
                onSelectConversation={(contact) => setSelectedContact(contact)}
                onNewChat={() => setActiveTab('contacts')}
              />
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="h-full m-0 overflow-y-auto">
            <ProfileEditor user={user} onUpdate={onUserUpdate} />
          </TabsContent>
        </div>

        {/* Mobile Bottom Navigation — activo en amarillo de marca */}
        <div className="sm:hidden border-t border-white/10 bg-black/70 backdrop-blur-md pb-safe flex-shrink-0">
          <TabsList className="grid w-full grid-cols-5 h-16 landscape:h-10 bg-transparent p-0 rounded-none">
            {([
              ['home', Home, t('home')],
              ['map', MapPin, t('map')],
              ['contacts', Users, t('contacts')],
              ['messages', MessageSquare, t('chat')],
              ['profile', UserIcon, t('profile')],
            ] as const).map(([value, Icon, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="relative h-full flex-col space-y-0.5 rounded-none text-white/50 data-[state=active]:bg-transparent data-[state=active]:text-brand-yellow data-[state=active]:shadow-none"
              >
                <Icon size={18} />
                <span className="text-[10px] landscape:hidden">{label}</span>
                {value === 'contacts' && invitationsData.pendingCount > 0 && (
                  <span className="absolute top-1 right-3 h-4 w-4 rounded-full bg-brand-red text-[10px] text-white flex items-center justify-center font-bold">
                    {invitationsData.pendingCount}
                  </span>
                )}
                {value === 'messages' && unreadMessages > 0 && (
                  <span className="absolute top-1 right-3 h-4 min-w-4 px-0.5 rounded-full bg-brand-green text-[10px] text-brand-ink flex items-center justify-center font-bold">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
    </motion.div>

    {/* Pricing Plans overlay */}
    <AnimatePresence>
      {showPricing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50"
        >
          <PricingPlans
            userId={user.id}
            userName={user.displayName}
            currentTier={subscriptionTier}
            onClose={() => setShowPricing(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>

    {/* Company Setup overlay */}
    {showCompanySetup && (
      <CompanySetup
        userId={user.id}
        subscriptionTier={subscriptionTier}
        onClose={() => setShowCompanySetup(false)}
        onSaved={() => setShowCompanySetup(false)}
      />
    )}

    {/* Fleet Manager overlay */}
    {showFleetManager && company && (
      <FleetManager
        companyId={company.id}
        subscriptionTier={subscriptionTier}
        onClose={() => setShowFleetManager(false)}
      />
    )}

    {/* Driver Manager overlay */}
    {showDriverManager && company && (
      <DriverManager
        companyId={company.id}
        subscriptionTier={subscriptionTier}
        onClose={() => setShowDriverManager(false)}
      />
    )}

    {/* Maintenance Scheduler overlay */}
    {showMaintenanceScheduler && company && (
      <MaintenanceScheduler
        companyId={company.id}
        onClose={() => setShowMaintenanceScheduler(false)}
      />
    )}

    {/* Documents Dashboard overlay */}
    {showDocumentsDashboard && company && (
      <DocumentsDashboard
        companyId={company.id}
        userId={user.id}
        onClose={() => setShowDocumentsDashboard(false)}
      />
    )}

    {/* Fleet Analytics overlay */}
    {showFleetAnalytics && company && (
      <FleetAnalytics
        companyId={company.id}
        userId={user.id}
        subscriptionTier={subscriptionTier}
        onClose={() => setShowFleetAnalytics(false)}
        onUpgrade={() => setShowPricing(true)}
      />
    )}
  </>
  );
};

export default PortableInterface;
