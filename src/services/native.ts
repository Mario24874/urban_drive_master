// Native device services integration for Urban Drive
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Toast } from '@capacitor/toast';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { PushNotifications } from '@capacitor/push-notifications';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface DeviceInfo {
  model: string;
  platform: string;
  operatingSystem: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  webViewVersion: string;
}

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

class NativeService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  // Check if running on native platform
  public isNativePlatform(): boolean {
    return this.isNative;
  }

  // Geolocation Services
  public async getCurrentPosition(): Promise<GeolocationPosition | null> {
    try {
      if (!this.isNative) {
        // Web fallback using browser geolocation
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
            },
            (error) => reject(error),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            }
          );
        });
      }

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
      };
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }

  public async watchPosition(callback: (position: GeolocationPosition | null) => void): Promise<string | null> {
    try {
      if (!this.isNative) {
        // Web fallback
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            callback({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            callback(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          }
        );
        return watchId.toString();
      }

      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
        (position, err) => {
          if (err) {
            console.error('Geolocation error:', err);
            callback(null);
            return;
          }

          if (position) {
            callback({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          }
        }
      );

      return watchId;
    } catch (error) {
      console.error('Error watching position:', error);
      return null;
    }
  }

  public async clearWatch(watchId: string): Promise<void> {
    try {
      if (!this.isNative) {
        navigator.geolocation.clearWatch(parseInt(watchId));
        return;
      }
      
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing geolocation watch:', error);
    }
  }

  // Device Information
  public async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      if (!this.isNative) {
        return {
          model: 'Web Browser',
          platform: 'web',
          operatingSystem: navigator.platform,
          osVersion: '',
          manufacturer: '',
          isVirtual: false,
          webViewVersion: '',
        };
      }

      const info = await Device.getInfo();
      return {
        model: info.model,
        platform: info.platform,
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        isVirtual: info.isVirtual,
        webViewVersion: info.webViewVersion,
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  }

  // Network Status
  public async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      if (!this.isNative) {
        return {
          connected: navigator.onLine,
          connectionType: 'unknown',
        };
      }

      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType,
      };
    } catch (error) {
      console.error('Error getting network status:', error);
      return { connected: true, connectionType: 'unknown' };
    }
  }

  public addNetworkListener(callback: (status: NetworkStatus) => void): void {
    if (!this.isNative) {
      window.addEventListener('online', () => callback({ connected: true, connectionType: 'unknown' }));
      window.addEventListener('offline', () => callback({ connected: false, connectionType: 'none' }));
      return;
    }

    Network.addListener('networkStatusChange', (status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType,
      });
    });
  }

  // Status Bar
  public async setStatusBarStyle(style: 'light' | 'dark' = 'dark'): Promise<void> {
    try {
      if (!this.isNative) return;
      
      await StatusBar.setStyle({
        style: style === 'light' ? Style.Light : Style.Dark,
      });
    } catch (error) {
      console.error('Error setting status bar style:', error);
    }
  }

  public async hideStatusBar(): Promise<void> {
    try {
      if (!this.isNative) return;
      await StatusBar.hide();
    } catch (error) {
      console.error('Error hiding status bar:', error);
    }
  }

  public async showStatusBar(): Promise<void> {
    try {
      if (!this.isNative) return;
      await StatusBar.show();
    } catch (error) {
      console.error('Error showing status bar:', error);
    }
  }

  // Toast Messages
  public async showToast(text: string, duration: 'short' | 'long' = 'short'): Promise<void> {
    try {
      if (!this.isNative) {
        // Web fallback - you could implement a custom toast here
        console.log('Toast:', text);
        return;
      }

      await Toast.show({
        text,
        duration: duration,
        position: 'bottom',
      });
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  }

  // Haptic Feedback
  public async vibrate(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    try {
      if (!this.isNative) {
        // Web fallback
        if (navigator.vibrate) {
          const duration = style === 'light' ? 50 : style === 'medium' ? 100 : 200;
          navigator.vibrate(duration);
        }
        return;
      }

      const impactStyle = 
        style === 'light' ? ImpactStyle.Light :
        style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy;

      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  }

  // Push Notifications
  public async requestNotificationPermissions(): Promise<boolean> {
    try {
      if (!this.isNative) {
        // Web fallback
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      }

      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  public async registerForPushNotifications(): Promise<void> {
    try {
      if (!this.isNative) return;

      await PushNotifications.register();
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  public addPushNotificationListeners(
    onReceived: (notification: any) => void,
    onActionPerformed: (notification: any) => void
  ): void {
    if (!this.isNative) return;

    PushNotifications.addListener('pushNotificationReceived', onReceived);
    PushNotifications.addListener('pushNotificationActionPerformed', onActionPerformed);
  }
}

// Export singleton instance
export const nativeService = new NativeService();
export default nativeService;