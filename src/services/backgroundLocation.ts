// Background geolocation for Android: keeps GPS updates flowing while the
// app is backgrounded, via a foreground service with a persistent notification.
// No-op on web — callers should fall back to navigator.geolocation there.
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { BackgroundGeolocationPlugin, Location, CallbackError } from '@capacitor-community/background-geolocation';
import type { GeolocationPosition } from './native';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

class BackgroundLocationService {
  private isNative: boolean;
  private watcherId: string | null = null;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  public isSupported(): boolean {
    return this.isNative;
  }

  public async startWatching(
    callback: (position: GeolocationPosition | null) => void,
  ): Promise<void> {
    if (!this.isNative) return;

    if (this.watcherId !== null) {
      await this.stopWatching();
    }

    this.watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: 'Urban Drive está compartiendo tu ubicación',
        backgroundTitle: 'Urban Drive',
        requestPermissions: true,
        stale: false,
        distanceFilter: 0,
      },
      (position?: Location, error?: CallbackError) => {
        if (error) {
          console.error('Background geolocation error:', error);
          callback(null);
          return;
        }
        if (position) {
          callback({
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
          });
        }
      },
    );
  }

  public async stopWatching(): Promise<void> {
    if (!this.isNative || this.watcherId === null) return;
    await BackgroundGeolocation.removeWatcher({ id: this.watcherId });
    this.watcherId = null;
  }
}

export const backgroundLocationService = new BackgroundLocationService();
export default backgroundLocationService;
