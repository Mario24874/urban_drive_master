import React, { useState, useEffect } from 'react';
import { Download, Share, Smartphone, ExternalLink } from 'lucide-react';
import { getDeviceInfo, getDownloadAction, getShareMessage } from '../utils/deviceDetection';
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
import { toast } from 'sonner';

interface DownloadAPKProps {
  isOpen: boolean;
  onClose: () => void;
  showInline?: boolean;
}

const DownloadAPK: React.FC<DownloadAPKProps> = ({ isOpen, onClose, showInline = false }) => {
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());
  const [downloadAction, setDownloadAction] = useState(getDownloadAction(deviceInfo));
  const [loading, setLoading] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    const info = getDeviceInfo();
    setDeviceInfo(info);
    setDownloadAction(getDownloadAction(info));
  }, []);

  const handleMainAction = async () => {
    setLoading(true);

    try {
      switch (downloadAction.action) {
        case 'download':
          await downloadAPK();
          toast.success('Download started', {
            description: 'Check your downloads folder',
          });
          break;
        case 'pwa':
          toast.info('Install instructions', {
            description: '1. Tap the share button (↗️)\n2. Select "Add to Home Screen"\n3. Confirm installation',
            duration: 10000,
          });
          break;
        case 'share':
          setShowShareOptions(true);
          break;
      }
    } catch (error) {
      console.error('Error in main action:', error);
      toast.error('Action failed', {
        description: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (type: 'whatsapp' | 'email' | 'generic' | 'download') => {
    setLoading(true);

    try {
      const message = getShareMessage(deviceInfo);
      const options = { message };

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
          await downloadAPK();
          toast.success('Download started');
          break;
      }
    } catch (error) {
      console.error(`Error sharing via ${type}:`, error);
      toast.error(`Share failed via ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => (
    <div className="space-y-6">
      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <strong>Debug:</strong> {deviceInfo.isMobile ? 'Mobile' : 'Desktop'} -
          {deviceInfo.isAndroid && ' Android'}
          {deviceInfo.isIOS && ' iOS'}
          {deviceInfo.isWindows && ' Windows'}
          {deviceInfo.isMac && ' Mac'}
          {deviceInfo.isLinux && ' Linux'}
        </div>
      )}

      {!showShareOptions ? (
        <>
          {/* Main icon */}
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              {downloadAction.icon}
            </div>
            <h3 className="text-lg font-bold mb-2">{downloadAction.title}</h3>
            <p className="text-sm text-muted-foreground">{downloadAction.subtitle}</p>
          </div>

          {/* Description */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-center text-muted-foreground">
              {downloadAction.description}
            </p>
          </div>

          {/* Main action button */}
          <Button
            onClick={handleMainAction}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                {downloadAction.action === 'download' && <Download className="mr-2" size={20} />}
                {downloadAction.action === 'pwa' && <Smartphone className="mr-2" size={20} />}
                {downloadAction.action === 'share' && <Share className="mr-2" size={20} />}
                {downloadAction.buttonText}
              </>
            )}
          </Button>

          {/* Additional options */}
          <div className="space-y-2">
            {deviceInfo.isDesktop && (
              <Button
                onClick={() => handleShare('download')}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2" size={18} />
                Download APK
              </Button>
            )}

            {deviceInfo.isMobile && deviceInfo.isAndroid && (
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <a
                  href="http://localhost:8080/urban-drive-portable.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2" size={18} />
                  Open in browser
                </a>
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Share options */}
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2">How do you want to share?</h3>
            <p className="text-sm text-muted-foreground">
              Choose how to send Urban Drive to your contacts
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleShare('whatsapp')}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600"
            >
              <span className="mr-2">💬</span>
              WhatsApp
            </Button>

            <Button
              onClick={() => handleShare('email')}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <span className="mr-2">📧</span>
              Email
            </Button>

            <Button
              onClick={() => handleShare('generic')}
              disabled={loading}
              variant="secondary"
            >
              <Share className="mr-2" size={18} />
              More options
            </Button>

            <Button
              onClick={() => handleShare('download')}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Download className="mr-2" size={18} />
              Download
            </Button>
          </div>

          <Button
            onClick={() => setShowShareOptions(false)}
            variant="outline"
            className="w-full"
          >
            ← Back
          </Button>
        </>
      )}

      {/* Footer info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Urban Drive • Safe and reliable urban transport
        </p>
      </div>
    </div>
  );

  if (showInline) {
    return (
      <div className="bg-card rounded-lg shadow-lg border p-6">
        {renderContent()}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Urban Drive</DialogTitle>
          <DialogDescription>
            Get the Urban Drive app on your device
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default DownloadAPK;
