/**
 * Sistema de sincronización dual Firebase + Supabase
 * Garantiza respaldo automático y failover
 */

import { createClient } from '@supabase/supabase-js';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db as firestore } from './firebase';

// Configuración Supabase (RESPALDO)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jdsojfcdcxumgwbgvsxt.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkc29qZmNkY3h1bWd3Ymd2c3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MjE1NDIsImV4cCI6MjA0MTQ5NzU0Mn0.1rI0OUsm4Xi4NqXdMHXF6dUyC4UA7XPyfOjMN7tJPvs';

// Inicializar Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Estado de conexión
let primaryDB: 'firebase' | 'supabase' = 'firebase';
let isFirebaseOnline = true;
let isSyncEnabled = false; // Deshabilitado temporalmente

/**
 * Monitor de conexión Firebase
 */
export const monitorFirebaseConnection = () => {
  const connectedRef = doc(firestore, '.info/connected');
  
  onSnapshot(connectedRef, (snapshot) => {
    isFirebaseOnline = snapshot.exists() && snapshot.data()?.connected === true;
    
    if (!isFirebaseOnline && primaryDB === 'firebase') {
      console.warn('⚠️ Firebase offline, switching to Supabase...');
      primaryDB = 'supabase';
    } else if (isFirebaseOnline && primaryDB === 'supabase') {
      console.log('✅ Firebase back online, switching back...');
      primaryDB = 'firebase';
      syncPendingData();
    }
  });
};

/**
 * Escribir datos con sincronización dual
 */
export const writeData = async (
  collection: string,
  docId: string,
  data: any
): Promise<boolean> => {
  const timestamp = new Date().toISOString();
  const dataWithMeta = {
    ...data,
    _lastSync: timestamp,
    _syncVersion: 1
  };

  try {
    // Intentar escribir en Firebase primero
    if (primaryDB === 'firebase' && isFirebaseOnline) {
      await setDoc(doc(firestore, collection, docId), dataWithMeta);
      
      // Sincronizar a Supabase en background
      if (isSyncEnabled) {
        syncToSupabase(collection, docId, dataWithMeta).catch(console.error);
      }
      
      return true;
    }
    
    // Si Firebase falla, usar Supabase
    const tableName = collection === 'users' ? 'app_users' : collection;
    const { error } = await supabase
      .from(tableName)
      .upsert({ id: docId, ...dataWithMeta });
    
    if (error) throw error;
    
    // Marcar para sincronización posterior con Firebase
    await markForSync(collection, docId, dataWithMeta);
    
    return true;
  } catch (error) {
    console.error('❌ Error writing data:', error);
    return false;
  }
};

/**
 * Leer datos con failover automático
 */
export const readData = async (
  collection: string,
  docId: string
): Promise<any | null> => {
  try {
    // Intentar leer de Firebase primero
    if (primaryDB === 'firebase' && isFirebaseOnline) {
      const docSnap = await getDoc(doc(firestore, collection, docId));
      if (docSnap.exists()) {
        return docSnap.data();
      }
    }
    
    // Failover a Supabase
    const tableName = collection === 'users' ? 'app_users' : collection;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', docId)
      .single();
    
    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error('❌ Error reading data:', error);
    return null;
  }
};

/**
 * Sincronizar a Supabase (background)
 */
const syncToSupabase = async (
  collection: string,
  docId: string,
  data: any
): Promise<void> => {
  try {
    const tableName = collection === 'users' ? 'app_users' : collection;
    const { error } = await supabase
      .from(tableName)
      .upsert({ id: docId, ...data });
    
    if (error) throw error;
    console.log('✅ Synced to Supabase:', collection, docId);
  } catch (error) {
    console.error('⚠️ Supabase sync failed:', error);
    // No bloquear operación principal
  }
};

/**
 * Marcar datos para sincronización posterior
 */
const markForSync = async (
  collection: string,
  docId: string,
  data: any
): Promise<void> => {
  const pendingSync = {
    collection,
    docId,
    data,
    timestamp: new Date().toISOString(),
    synced: false
  };
  
  // Guardar en localStorage para sincronización posterior
  const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
  pending.push(pendingSync);
  localStorage.setItem('pendingSync', JSON.stringify(pending));
};

/**
 * Sincronizar datos pendientes cuando Firebase vuelve
 */
const syncPendingData = async (): Promise<void> => {
  const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
  
  for (const item of pending) {
    if (!item.synced) {
      try {
        await setDoc(
          doc(firestore, item.collection, item.docId),
          item.data
        );
        item.synced = true;
        console.log('✅ Synced pending:', item.docId);
      } catch (error) {
        console.error('❌ Failed to sync:', item.docId, error);
      }
    }
  }
  
  // Limpiar sincronizados
  const remaining = pending.filter((item: any) => !item.synced);
  localStorage.setItem('pendingSync', JSON.stringify(remaining));
};

/**
 * Configurar tablas en Supabase (ejecutar una vez)
 */
export const setupSupabaseTables = async (): Promise<void> => {
  // SQL para crear tablas espejo en Supabase
  const sql = `
    -- Tabla de usuarios
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      phone TEXT,
      location JSONB,
      isVisible BOOLEAN DEFAULT false,
      contacts TEXT[],
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      updatedAt TIMESTAMPTZ DEFAULT NOW(),
      _lastSync TIMESTAMPTZ,
      _syncVersion INTEGER DEFAULT 1
    );

    -- Tabla de invitaciones
    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      inviterEmail TEXT,
      inviterPhone TEXT,
      recipientPhone TEXT,
      used BOOLEAN DEFAULT false,
      expiresAt TIMESTAMPTZ,
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      _lastSync TIMESTAMPTZ,
      _syncVersion INTEGER DEFAULT 1
    );

    -- Tabla de viajes
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      userId TEXT REFERENCES users(id),
      origin JSONB,
      destination JSONB,
      status TEXT,
      price DECIMAL,
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      completedAt TIMESTAMPTZ,
      _lastSync TIMESTAMPTZ,
      _syncVersion INTEGER DEFAULT 1
    );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(userId);
    CREATE INDEX IF NOT EXISTS idx_invitations_phone ON invitations(recipientPhone);
  `;
  
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.error('❌ Error setting up Supabase tables:', error);
  } else {
    console.log('✅ Supabase tables ready');
  }
};

/**
 * Estado de sincronización para UI
 */
export const getSyncStatus = () => ({
  primaryDB,
  isFirebaseOnline,
  isSyncEnabled,
  pendingCount: JSON.parse(localStorage.getItem('pendingSync') || '[]').length
});

/**
 * Activar/desactivar sincronización
 */
export const toggleSync = (enabled: boolean) => {
  isSyncEnabled = enabled;
  if (enabled) {
    syncPendingData();
  }
};

// Iniciar monitoreo al cargar
monitorFirebaseConnection();

export default {
  writeData,
  readData,
  getSyncStatus,
  toggleSync,
  setupSupabaseTables
};