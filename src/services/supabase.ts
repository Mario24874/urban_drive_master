// Supabase integration for Urban Drive
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for Urban Drive database
export interface SupabaseUser {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  userType: 'user' | 'driver';
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseDriver extends SupabaseUser {
  userType: 'driver';
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  isActive: boolean;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    plate: string;
    color: string;
  };
}

export interface SupabaseRide {
  id: string;
  userId: string;
  driverId: string;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  estimatedDuration?: number;
  estimatedDistance?: number;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

// Database helper functions
export class SupabaseService {
  // User management
  static async createUser(userData: Partial<SupabaseUser>) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select();
    
    if (error) throw error;
    return data;
  }

  static async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUser(id: string, updates: Partial<SupabaseUser>) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  }

  // Driver management
  static async createDriver(driverData: Partial<SupabaseDriver>) {
    const { data, error } = await supabase
      .from('drivers')
      .insert([driverData])
      .select();
    
    if (error) throw error;
    return data;
  }

  static async getActiveDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('isActive', true)
      .eq('isVisible', true);
    
    if (error) throw error;
    return data;
  }

  static async updateDriverLocation(driverId: string, location: { latitude: number; longitude: number }) {
    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        currentLocation: location,
        updatedAt: new Date().toISOString()
      })
      .eq('id', driverId)
      .select();
    
    if (error) throw error;
    return data;
  }

  // Ride management
  static async createRide(rideData: Partial<SupabaseRide>) {
    const { data, error } = await supabase
      .from('rides')
      .insert([rideData])
      .select();
    
    if (error) throw error;
    return data;
  }

  static async getRidesByUser(userId: string) {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        driver:drivers(*),
        user:users(*)
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getRidesByDriver(driverId: string) {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        driver:drivers(*),
        user:users(*)
      `)
      .eq('driverId', driverId)
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async updateRideStatus(rideId: string, status: SupabaseRide['status']) {
    const { data, error } = await supabase
      .from('rides')
      .update({ 
        status,
        updatedAt: new Date().toISOString()
      })
      .eq('id', rideId)
      .select();
    
    if (error) throw error;
    return data;
  }

  // Real-time subscriptions
  static subscribeToDriverUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('drivers')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'drivers' },
        callback
      )
      .subscribe();
  }

  static subscribeToRideUpdates(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('rides')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'rides',
          filter: `userId=eq.${userId}` 
        },
        callback
      )
      .subscribe();
  }

  // Location helpers
  static calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static findNearbyDrivers(
    userLat: number, 
    userLon: number, 
    drivers: SupabaseDriver[], 
    maxDistance: number = 5
  ): SupabaseDriver[] {
    return drivers.filter(driver => {
      if (!driver.currentLocation) return false;
      
      const distance = this.calculateDistance(
        userLat, userLon,
        driver.currentLocation.latitude,
        driver.currentLocation.longitude
      );
      
      return distance <= maxDistance;
    });
  }
}

export default SupabaseService;