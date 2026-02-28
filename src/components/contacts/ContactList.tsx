import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import {
  Search, UserPlus, Check, X, Trash2,
  Eye, EyeOff, MessageSquare, MapPin, Clock,
  MoreVertical, Navigation, Car, UserRound,
  Lock, Sparkles,
} from 'lucide-react';
import type { Contact, Invitation } from '../../types';
import { useContacts } from '../../hooks/useContacts';

// Shadcn UI
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface InvitationsData {
  received: Invitation[];
  sent: Invitation[];
  isSending: boolean;
  pendingCount: number;
  sendInvitation: (currentUser: any, identifier: string) => Promise<void>;
  acceptInvitation: (invitation: Invitation, userType: 'user' | 'driver') => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  deleteInvitation: (invitationId: string) => Promise<void>;
}

interface ContactListProps {
  userId: string;
  userType: 'user' | 'driver';
  currentUser: any;
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  onNavigateToContact?: (contact: Contact) => void;
  invitationsData: InvitationsData;
  maxContacts?: number;    // -1 = unlimited; default -1
  planName?: string;       // human-readable plan name for upgrade dialog
  onUpgrade?: () => void;  // callback to open PricingPlans
}

const getInitials = (name: string, email?: string) =>
  name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (email?.[0]?.toUpperCase() ?? '?');

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// ─── Contact Item ────────────────────────────────────────────────────────────
const ContactItem: React.FC<{
  contact: Contact;
  isSelected: boolean;
  isVisible: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onNavigate?: () => void;
}> = ({ contact, isSelected, isVisible, onSelect, onToggleVisibility, onRemove, onNavigate }) => {
  const { t } = useApp();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.18 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/5'
      }`}
    >
      {/* Avatar — clicking opens chat */}
      <div onClick={onSelect} className="flex-shrink-0 cursor-pointer">
        <Avatar>
          <AvatarImage src={contact.photoURL} alt={contact.displayName} />
          <AvatarFallback>{getInitials(contact.displayName, contact.email)}</AvatarFallback>
        </Avatar>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{contact.displayName}</p>
          {isVisible && (
            <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-xs py-0 flex items-center gap-1">
            {contact.userType === 'driver'
              ? <><Car size={10} />{t('typeDriver')}</>
              : <><UserRound size={10} />{t('typeUser')}</>}
          </Badge>
          {contact.phone && (
            <span className="text-xs text-muted-foreground truncate">{contact.phone}</span>
          )}
          {contact.location && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <MapPin size={10} />
              {contact.location.accuracy ? `${Math.round(contact.location.accuracy)}m` : 'Located'}
            </span>
          )}
        </div>
      </div>

      {/* Actions — Sheet (bottom sheet) is the most reliable on mobile */}
      <Sheet open={actionSheetOpen} onOpenChange={setActionSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={18} />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={contact.photoURL} />
                <AvatarFallback>{getInitials(contact.displayName, contact.email)}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-left">{contact.displayName}</SheetTitle>
                <SheetDescription className="text-left text-xs flex items-center gap-1">
                  {contact.userType === 'driver'
                    ? <><Car size={10} />{t('typeDriver')}</>
                    : <><UserRound size={10} />{t('typeUser')}</>}
                  {contact.phone ? ` · ${contact.phone}` : ''}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-1">
            {/* Message */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-base"
              onClick={() => { onSelect(); setActionSheetOpen(false); }}
            >
              <MessageSquare size={20} />
              {t('sendMessage')}
            </Button>

            {/* Navigate — only if contact has a location */}
            {onNavigate && contact.location && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-base"
                onClick={() => { onNavigate(); setActionSheetOpen(false); }}
              >
                <Navigation size={20} className="text-blue-400" />
                {t('navigateHere')}
              </Button>
            )}

            <Separator className="my-2" />

            {/* Visibility */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-base"
              onClick={() => { onToggleVisibility(); setActionSheetOpen(false); }}
            >
              {isVisible
                ? <><EyeOff size={20} /><span>{t('hideLocation')}</span></>
                : <><Eye size={20} className="text-green-400" /><span>{t('showLocation')}</span></>
              }
            </Button>

            <Separator className="my-2" />

            {/* Remove */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-base text-destructive hover:text-destructive"
              onClick={() => { onRemove(); setActionSheetOpen(false); }}
            >
              <Trash2 size={20} />
              {t('removeContact')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

// ─── Invitation Item ──────────────────────────────────────────────────────────
const InvitationItem: React.FC<{
  invitation: Invitation;
  type: 'received' | 'sent';
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}> = ({ invitation, type, onAccept, onReject, onCancel, onDelete }) => {
  const { t } = useApp();
  return (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="flex items-start gap-3 px-4 py-3 rounded-lg bg-white/5"
  >
    <Avatar className="flex-shrink-0">
      <AvatarFallback>
        {getInitials(type === 'received' ? invitation.fromName : invitation.toIdentifier)}
      </AvatarFallback>
    </Avatar>

    <div className="flex-1 min-w-0">
      {type === 'received' ? (
        <>
          <p className="text-sm font-medium">{invitation.fromName || invitation.fromEmail}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {invitation.fromType === 'driver'
              ? <><Car size={10} />{t('typeDriver')}</>
              : <><UserRound size={10} />{t('typeUser')}</>}
            {' '}•{' '}{invitation.fromPhone || invitation.fromEmail}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium">{invitation.toIdentifier}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Badge
              variant={
                invitation.status === 'accepted'
                  ? 'default'
                  : invitation.status === 'rejected'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-xs py-0"
            >
              {invitation.status}
            </Badge>
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
        <Clock size={10} />
        {formatDate(invitation.createdAt)}
      </p>
    </div>

    {/* Received pending: accept / reject / delete */}
    {type === 'received' && (
      <div className="flex gap-1 flex-shrink-0">
        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:text-green-300" onClick={onAccept} title={t('accept')}>
          <Check size={14} />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onReject} title={t('reject')}>
          <X size={14} />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete} title={t('deleteInvitation')}>
          <Trash2 size={14} />
        </Button>
      </div>
    )}

    {/* Sent: show cancel (X) for pending, trash for accepted/rejected */}
    {type === 'sent' && invitation.status === 'pending' && onCancel && (
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
        title={t('cancelInvitation')}
        onClick={onCancel}
      >
        <X size={14} />
      </Button>
    )}
    {type === 'sent' && invitation.status !== 'pending' && onDelete && (
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
        title={t('deleteInvitation')}
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </Button>
    )}
  </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ContactList: React.FC<ContactListProps> = ({
  userId,
  userType,
  currentUser,
  selectedContact,
  onSelectContact,
  onNavigateToContact,
  invitationsData,
  maxContacts = -1,
  planName,
  onUpgrade,
}) => {
  const { t } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Contact | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const {
    contacts,
    loading,
    contactVisibility,
    removeContact,
    toggleContactVisibility,
  } = useContacts(userId, userType);

  const isAtLimit = maxContacts !== -1 && contacts.length >= maxContacts;

  const {
    received,
    sent,
    isSending,
    pendingCount,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    deleteInvitation,
  } = invitationsData;

  const filtered = contacts.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.displayName.toLowerCase().includes(q) ||
      (c.email?.toLowerCase() || '').includes(q) ||
      (c.phone || '').includes(q)
    );
  });

  const handleSendInvite = async () => {
    if (!inviteInput.trim()) return;
    await sendInvitation(currentUser, inviteInput);
    setInviteInput('');
    setAddSheetOpen(false);
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    await removeContact(removeTarget.id, removeTarget.userType as 'user' | 'driver');
    setRemoveTarget(null);
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{t('contacts')}</h2>
          <p className="text-xs text-white/60">
            {maxContacts !== -1
              ? t('contactsOf').replace('{n}', String(contacts.length)).replace('{max}', String(maxContacts))
              : `${contacts.length} ${contacts.length !== 1 ? t('contactCountPlural') : t('contactCount')}`}
          </p>
        </div>

        {/* Add Contact Sheet / Limit button */}
        <Sheet open={addSheetOpen} onOpenChange={setAddSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={isAtLimit ? (e) => { e.preventDefault(); setUpgradeDialogOpen(true); } : undefined}
            >
              {isAtLimit ? <Lock size={16} /> : <UserPlus size={16} />}
              {t('addContact')}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader className="text-left mb-4">
              <SheetTitle>{t('addContact')}</SheetTitle>
              <SheetDescription>
                {t('enterEmailOrPhone')}
              </SheetDescription>
            </SheetHeader>

            <div className="flex gap-2">
              <Input
                placeholder={t('emailOrPhone')}
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                autoFocus
              />
              <Button onClick={handleSendInvite} disabled={isSending || !inviteInput.trim()}>
                {isSending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  />
                ) : (
                  t('sendInvitation')
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Tabs: Contacts / Invitations */}
      <Tabs defaultValue="contacts" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="contacts">
            {t('contacts')} {contacts.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{contacts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            {t('invitationsTab')}{' '}
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">{pendingCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Contacts Tab ── */}
        <TabsContent value="contacts" className="flex-1 min-h-0 mt-2 flex flex-col">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder={t('searchContacts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="flex-1">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-white/50"
              >
                <p className="text-sm">
                  {searchTerm ? t('noContactsSearch') : t('noContacts')}
                </p>
                {!searchTerm && (
                  <Button
                    variant="link"
                    className="mt-2 text-xs"
                    onClick={() => setAddSheetOpen(true)}
                  >
                    {t('addFirstContact')}
                  </Button>
                )}
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((contact) => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContact?.id === contact.id}
                    isVisible={contactVisibility[contact.id] !== false}
                    onSelect={() => onSelectContact(contact)}
                    onToggleVisibility={() =>
                      toggleContactVisibility(contact.id, contactVisibility[contact.id] === false)
                    }
                    onRemove={() => setRemoveTarget(contact)}
                    onNavigate={
                      onNavigateToContact && contact.location
                        ? () => onNavigateToContact(contact)
                        : undefined
                    }
                  />
                ))}
              </AnimatePresence>
            )}
          </ScrollArea>
        </TabsContent>

        {/* ── Invitations Tab ── */}
        <TabsContent value="invitations" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full">
            {received.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider px-1 mb-2">
                  {t('receivedInvitations')}
                </p>
                <AnimatePresence>
                  {received.map((inv) => (
                    <InvitationItem
                      key={inv.id}
                      invitation={inv}
                      type="received"
                      onAccept={() => acceptInvitation(inv, userType)}
                      onReject={() => rejectInvitation(inv.id)}
                      onDelete={() => deleteInvitation(inv.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {sent.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider px-1 mb-2">
                  {t('sentInvitations')}
                </p>
                <AnimatePresence>
                  {sent.map((inv) => (
                    <InvitationItem
                      key={inv.id}
                      invitation={inv}
                      type="sent"
                      onCancel={() => cancelInvitation(inv.id)}
                      onDelete={() => deleteInvitation(inv.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {received.length === 0 && sent.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-12 text-white/50"
              >
                <p className="text-sm">{t('noInvitations')}</p>
              </motion.div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Remove confirmation dialog */}
      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('removeContact')}</DialogTitle>
            <DialogDescription>
              {removeTarget?.displayName} {t('removeContactDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleRemoveConfirm}>
              {t('remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade dialog — shown when contact limit is reached */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contactLimitTitle')}</DialogTitle>
            <DialogDescription>
              {t('contactLimitDesc')
                .replace('{max}', String(maxContacts))
                .replace('{plan}', planName ?? String(maxContacts))}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() => { setUpgradeDialogOpen(false); onUpgrade?.(); }}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Sparkles size={15} className="mr-2" />
              {t('upgradePlan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(ContactList);
