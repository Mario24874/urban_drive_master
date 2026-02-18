import React, { useState } from 'react';
import { Share, MessageCircle, Mail, Download } from 'lucide-react';
import { shareViaWhatsApp, shareViaEmail, shareGeneric, downloadAPK } from '../utils/shareAPK';

// Shadcn UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ShareAPKProps {
  isOpen: boolean;
  onClose: () => void;
  apkUrl?: string;
}

const ShareAPK: React.FC<ShareAPKProps> = ({ isOpen, onClose, apkUrl }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const handleShare = async (type: 'whatsapp' | 'email' | 'generic' | 'download') => {
    setLoading(type);

    try {
      const options = {
        recipientPhone: recipientPhone || undefined,
        recipientEmail: recipientEmail || undefined,
        message: customMessage || undefined,
        apkUrl,
      };

      switch (type) {
        case 'whatsapp':
          await shareViaWhatsApp(options);
          toast.success('Shared via WhatsApp');
          break;
        case 'email':
          await shareViaEmail(options);
          toast.success('Shared via Email');
          break;
        case 'generic':
          await shareGeneric(options);
          toast.success('Share options opened');
          break;
        case 'download':
          await downloadAPK(apkUrl);
          toast.success('Download started');
          break;
      }
    } catch (error) {
      console.error(`Error sharing via ${type}:`, error);
      toast.error(`Share failed via ${type}`, {
        description: 'Please try again',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Urban Drive</DialogTitle>
          <DialogDescription>
            Send Urban Drive app to your contacts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Optional fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. +573001234567"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Custom message (optional)</Label>
              <textarea
                id="message"
                placeholder="Write a custom message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="w-full p-3 border border-input rounded-md focus:ring-2 focus:ring-ring focus:outline-none resize-none text-sm"
              />
            </div>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleShare('whatsapp')}
              disabled={loading === 'whatsapp'}
              className="bg-green-500 hover:bg-green-600"
            >
              {loading === 'whatsapp' ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <MessageCircle className="mr-2" size={20} />
              )}
              WhatsApp
            </Button>

            <Button
              onClick={() => handleShare('email')}
              disabled={loading === 'email'}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading === 'email' ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Mail className="mr-2" size={20} />
              )}
              Email
            </Button>

            <Button
              onClick={() => handleShare('generic')}
              disabled={loading === 'generic'}
              variant="secondary"
            >
              {loading === 'generic' ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Share className="mr-2" size={20} />
              )}
              Share
            </Button>

            <Button
              onClick={() => handleShare('download')}
              disabled={loading === 'download'}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {loading === 'download' ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="mr-2" size={20} />
              )}
              Download
            </Button>
          </div>

          {/* Tip */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> All fields are optional. If you don't fill them,
              the system will let you choose the contact when sharing.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareAPK;
