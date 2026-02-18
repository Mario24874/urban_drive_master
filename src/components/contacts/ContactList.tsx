import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import type { Contact } from '../../types';

// Shadcn UI Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ContactListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  loading?: boolean;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  selectedContact,
  onSelectContact,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.displayName.toLowerCase().includes(searchLower) ||
      (contact.email?.toLowerCase() || '').includes(searchLower) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchLower))
    );
  });

  const getContactInitials = (contact: Contact) => {
    if (contact.displayName) {
      return contact.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return contact.email?.[0]?.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} available
          </CardDescription>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {filteredContacts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-32 text-muted-foreground"
              >
                <p className="text-sm">
                  {searchTerm ? 'No contacts found' : 'No contacts available'}
                </p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredContacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant={selectedContact?.id === contact.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start h-auto py-3 px-4"
                      onClick={() => onSelectContact(contact)}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <Avatar>
                          <AvatarImage src={contact.photoURL} alt={contact.displayName} />
                          <AvatarFallback>{getContactInitials(contact)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium truncate">{contact.displayName}</p>
                            {contact.isVisible && (
                              <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full" />
                            )}
                          </div>

                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {contact.userType === 'driver' ? '🚗 Driver' : '👤 User'}
                            </Badge>

                            {contact.location && (
                              <span className="text-xs text-muted-foreground flex items-center">
                                <MapPin size={12} className="mr-1" />
                                {contact.location.accuracy ?
                                  `${Math.round(contact.location.accuracy)}m` :
                                  'Located'
                                }
                              </span>
                            )}
                          </div>

                          {contact.bio && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {contact.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(ContactList);
