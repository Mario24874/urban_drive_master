import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useLocation } from '../hooks/useLocation';
import { useInvitations } from '../hooks/useInvitations';
import { useApp } from '../contexts/AppContext';
import type { UserData, Contact } from '../types';

// Components
import GPSMapComponent from './GPSMapComponent';
import ChatInterface from './ChatInterface';
import ProfileEditor from './profile/ProfileEditor';
import ContactList from './contacts/ContactList';
import SettingsSheet from './SettingsSheet';
import Login from './Login';
import Register from './Register';

// Shadcn UI Components
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { Home, MapPin, Users, MessageSquare, User as UserIcon } from './Icons';

interface PortableInterfaceProps {
  user: UserData | null;
  isAuthenticated: boolean;
  handleLogin?: (data: any) => void;
  handleRegister?: () => void;
}

const PortableInterface: React.FC<PortableInterfaceProps> = ({
  user,
  isAuthenticated,
  handleLogin,
  handleRegister,
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const { t } = useApp();

  // Custom hooks
  const { location, loading: locationLoading, refreshLocation } = useLocation(user);

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

  // Show login/register if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {showRegister ? (
          <div className="w-full">
            <Register handleRegister={handleRegister || (() => {})} />
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setShowRegister(false)}
                className="text-sm"
              >
                Already have an account? Sign in
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <Login handleLogin={handleLogin || (() => {})} />
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setShowRegister(true)}
                className="text-sm"
              >
                Don't have an account? Sign up
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col"
    >
      {/* ── App Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-black/50 backdrop-blur-md border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src="/assets/UrbanDrive.png" alt="Urban Drive" className="h-8 w-8 rounded-xl" />
          <span className="font-bold text-white text-base hidden sm:inline">Urban Drive</span>
        </div>
        <SettingsSheet user={user} onLogout={handleLogout} />
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Desktop Tabs List */}
        <div className="hidden sm:block border-b bg-black/50 backdrop-blur-md">
          <div className="container-responsive py-3">
            <TabsList className="grid w-full max-w-2xl grid-cols-5 mx-auto">
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
              <TabsTrigger value="messages" className="flex items-center space-x-2">
                <MessageSquare size={18} />
                <span className="hidden md:inline">{t('messages')}</span>
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
                <h1 className="text-3xl font-bold mb-2">
                  Welcome, {user.displayName || user.email}!
                </h1>
                <p className="text-muted-foreground">
                  {user.userType === 'driver'
                    ? 'Start your day as a driver'
                    : 'Find available drivers near you'}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card p-6 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Contacts</p>
                      <p className="text-2xl font-bold">{user.contacts?.length ?? 0}</p>
                    </div>
                    <Users className="text-muted-foreground" size={32} />
                  </div>
                </div>

                <div className="bg-card p-6 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-2xl font-bold">
                        {location ? '📍' : '❌'}
                      </p>
                    </div>
                    <MapPin className="text-muted-foreground" size={32} />
                  </div>
                  {location && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Accuracy: {Math.round(location.accuracy || 0)}m
                    </p>
                  )}
                </div>

                <div className="bg-card p-6 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-2xl font-bold">
                        {user.isVisible ? '🟢' : '⚫'}
                      </p>
                    </div>
                    <UserIcon className="text-muted-foreground" size={32} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {user.isVisible ? 'Visible' : 'Hidden'}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
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
                    Refresh Location
                  </Button>
                  <Button
                    onClick={() => setActiveTab('map')}
                    variant="outline"
                    className="h-auto py-4"
                  >
                    <MapPin size={20} className="mr-2" />
                    View Map
                  </Button>
                  <Button
                    onClick={() => setActiveTab('contacts')}
                    variant="outline"
                    className="h-auto py-4"
                  >
                    <Users size={20} className="mr-2" />
                    Browse Contacts
                  </Button>
                  <Button
                    onClick={() => setActiveTab('profile')}
                    variant="outline"
                    className="h-auto py-4"
                  >
                    <UserIcon size={20} className="mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="h-full m-0">
            <GPSMapComponent
              userLocation={location}
              user={user}
              userId={user.id}
              userType={user.userType}
              isActive={activeTab === 'map'}
            />
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
                invitationsData={invitationsData}
              />
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="h-full m-0">
            <ChatInterface
              currentUserId={user.id}
              currentUserName={user.displayName || user.email || 'User'}
              selectedContact={selectedContact}
              onBack={() => setActiveTab('contacts')}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="h-full m-0 overflow-y-auto">
            <ProfileEditor user={user} />
          </TabsContent>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="sm:hidden border-t bg-black/70 backdrop-blur-md pb-safe">
          <TabsList className="grid w-full grid-cols-5 h-16">
            <TabsTrigger value="home" className="flex-col space-y-1">
              <Home size={20} />
              <span className="text-xs">{t('home')}</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex-col space-y-1">
              <MapPin size={20} />
              <span className="text-xs">{t('map')}</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex-col space-y-1 relative">
              <Users size={20} />
              <span className="text-xs">{t('contacts')}</span>
              {invitationsData.pendingCount > 0 && (
                <span className="absolute top-1 right-3 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                  {invitationsData.pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-col space-y-1">
              <MessageSquare size={20} />
              <span className="text-xs">{t('chat')}</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-col space-y-1">
              <UserIcon size={20} />
              <span className="text-xs">{t('profile')}</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </motion.div>
  );
};

export default PortableInterface;
