-- CONFIGURACIÓN SIMPLIFICADA PARA SUPABASE
-- Ejecutar paso a paso para evitar errores

-- 1. CREAR TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  displayName TEXT,
  username TEXT UNIQUE,
  phone TEXT,
  userType TEXT DEFAULT 'user',
  isVisible BOOLEAN DEFAULT true,
  location JSONB,
  contacts TEXT[] DEFAULT '{}',
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW(),
  _lastSync TIMESTAMPTZ DEFAULT NOW(),
  _syncVersion INTEGER DEFAULT 1,
  _source TEXT DEFAULT 'supabase'
);

-- 2. CREAR TABLA DE INVITACIONES
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  inviterEmail TEXT NOT NULL,
  inviterName TEXT,
  inviterPhone TEXT,
  recipientPhone TEXT,
  used BOOLEAN DEFAULT false,
  expiresAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  _lastSync TIMESTAMPTZ DEFAULT NOW(),
  _syncVersion INTEGER DEFAULT 1,
  _source TEXT DEFAULT 'supabase'
);

-- 3. CREAR TABLA DE VIAJES
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id) ON DELETE CASCADE,
  driverId TEXT REFERENCES users(id) ON DELETE SET NULL,
  origin JSONB NOT NULL,
  destination JSONB NOT NULL,
  currentLocation JSONB,
  status TEXT DEFAULT 'pending',
  price DECIMAL(10,2),
  estimatedDuration INTEGER,
  actualDuration INTEGER,
  distance DECIMAL(10,2),
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  acceptedAt TIMESTAMPTZ,
  startedAt TIMESTAMPTZ,
  completedAt TIMESTAMPTZ,
  _lastSync TIMESTAMPTZ DEFAULT NOW(),
  _syncVersion INTEGER DEFAULT 1,
  _source TEXT DEFAULT 'supabase'
);

-- 4. CREAR TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  readAt TIMESTAMPTZ,
  _lastSync TIMESTAMPTZ DEFAULT NOW(),
  _syncVersion INTEGER DEFAULT 1,
  _source TEXT DEFAULT 'supabase'
);

-- 5. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(userType);
CREATE INDEX IF NOT EXISTS idx_users_visible ON users(isVisible);
CREATE INDEX IF NOT EXISTS idx_users_sync ON users(_lastSync);

CREATE INDEX IF NOT EXISTS idx_invitations_phone ON invitations(recipientPhone);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(inviterEmail);
CREATE INDEX IF NOT EXISTS idx_invitations_used ON invitations(used);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expiresAt);

CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(userId);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driverId);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_created ON trips(createdAt);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);