// Types for the Urban Drive application

export interface UserData {
  id: string;
  displayName: string;
  username: string;
  phone: string;
  email: string;
  userType: 'user' | 'driver';
  isVisible?: boolean;
  location?: Location;
  contacts?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  bio?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  message?: string;
  timestamp: string | Date;
  read?: boolean;
}

export interface Location {
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: Date;
  method?: string;
  city?: string;
  country?: string;
}

export interface Contact {
  id: string;
  displayName: string;
  username?: string;
  phone?: string;
  email?: string;
  userType?: 'user' | 'driver';
  isOnline?: boolean;
  lastSeen?: Date;
  location?: Location;
  isVisible?: boolean;
  contacts?: string[];
}

export interface FirebaseError {
  code: string;
  message: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  uid: string;
}