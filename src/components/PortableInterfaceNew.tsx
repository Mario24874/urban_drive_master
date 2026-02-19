import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from '../hooks/useLocation';
import { useContacts } from '../hooks/useContacts';
import type { UserData, Contact } from '../types';

// Components
import GPSMapComponent from './GPSMapComponent';
import ChatInterface from './ChatInterface';
import ProfileEditor from './profile/ProfileEditor';
import ContactList from './contacts/ContactList';
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

  // Custom hooks for location and contacts
  const { location, loading: locationLoading, refreshLocation } = useLocation(user);
  const { contacts, loading: contactsLoading } = useContacts(
    user?.id || null,
    user?.userType
  );

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Desktop Tabs List */}
        <div className="hidden sm:block border-b bg-black/50 backdrop-blur-md">
          <div className="container-responsive py-4">
            <TabsList className="grid w-full max-w-2xl grid-cols-5 mx-auto">
              <TabsTrigger value="home" className="flex items-center space-x-2">
                <Home size={18} />
                <span className="hidden md:inline">Home</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center space-x-2">
                <MapPin size={18} />
                <span className="hidden md:inline">Map</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center space-x-2">
                <Users size={18} />
                <span className="hidden md:inline">Contacts</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center space-x-2">
                <MessageSquare size={18} />
                <span className="hidden md:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <UserIcon size={18} />
                <span className="hidden md:inline">Profile</span>
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
                      <p className="text-2xl font-bold">{contacts.length}</p>
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
          <TabsContent value="contacts" className="h-full m-0 p-4">
            <div className="h-full max-w-4xl mx-auto">
              <ContactList
                contacts={contacts}
                selectedContact={selectedContact}
                onSelectContact={(contact) => {
                  setSelectedContact(contact);
                  setActiveTab('messages');
                }}
                loading={contactsLoading}
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
        <div className="sm:hidden border-t bg-black/70 backdrop-blur-md">
          <TabsList className="grid w-full grid-cols-5 h-16">
            <TabsTrigger value="home" className="flex-col space-y-1">
              <Home size={20} />
              <span className="text-xs">Home</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex-col space-y-1">
              <MapPin size={20} />
              <span className="text-xs">Map</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex-col space-y-1">
              <Users size={20} />
              <span className="text-xs">Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-col space-y-1">
              <MessageSquare size={20} />
              <span className="text-xs">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-col space-y-1">
              <UserIcon size={20} />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </motion.div>
  );
};

export default PortableInterface;
