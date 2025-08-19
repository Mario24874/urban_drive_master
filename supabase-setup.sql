-- Configuración inicial de Supabase para Urban Drive
-- Este script crea tablas IDÉNTICAS a las de Firebase

-- 1. TABLA DE USUARIOS (basada en tu estructura Firebase)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  displayName TEXT,
  username TEXT UNIQUE,
  phone TEXT,
  userType TEXT DEFAULT 'user' CHECK (userType IN ('user', 'driver')),
  isVisible BOOLEAN DEFAULT true,
  
  -- Ubicación como JSON (igual que Firebase)
  location JSONB,
  
  -- Array de contactos (IDs de otros usuarios)
  contacts TEXT[] DEFAULT '{}',
  
  -- Timestamps
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW(),
  
  -- Campos de sincronización
  _lastSync TIMESTAMPTZ DEFAULT NOW(),
  _syncVersion INTEGER DEFAULT 1,
  _source TEXT DEFAULT 'supabase' -- 'firebase' o 'supabase'
);

-- 2. TABLA DE INVITACIONES
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  inviterEmail TEXT NOT NULL,
  inviterName TEXT,
  inviterPhone TEXT,
  recipientPhone TEXT,
  
  -- Estado de la invitación
  used BOOLEAN DEFAULT false,
  expiresAt TIMESTAMPTZ,
  
  -- Timestamps
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  
  -- Campos de sincronización
  _lastSync TIMESTAMPTZ DEFAULT NOW(),
  _syncVersion INTEGER DEFAULT 1,
  _source TEXT DEFAULT 'supabase'
);

-- 3. TABLA DE VIAJES (para futuro)
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id) ON DELETE CASCADE,
  driverId TEXT REFERENCES users(id) ON DELETE SET NULL,
  
  -- Ubicaciones como JSON
  origin JSONB NOT NULL,
  destination JSONB NOT NULL,
  currentLocation JSONB,
  
  -- Estado del viaje
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  
  -- Información del viaje
  price DECIMAL(10,2),
  estimatedDuration INTEGER, -- minutos
  actualDuration INTEGER,    -- minutos
  distance DECIMAL(10,2),    -- kilómetros
  
  -- Timestamps
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  acceptedAt TIMESTAMPTZ,
  startedAt TIMESTAMPTZ,
  completedAt TIMESTAMPTZ,
  
  -- Campos de sincronización
  _lastSync TIMESTAMPTZ DEFAULT NOW(),
  _syncVersion INTEGER DEFAULT 1,
  _source TEXT DEFAULT 'supabase'
);

-- 4. TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contenido de la notificación
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'trip', 'invitation', 'system')),
  
  -- Estado
  read BOOLEAN DEFAULT false,
  
  -- Metadatos como JSON
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  readAt TIMESTAMPTZ,
  
  -- Campos de sincronización
  _lastSync TIMESTAMPTZ DEFAULT NOW(),
  _syncVersion INTEGER DEFAULT 1,
  _source TEXT DEFAULT 'supabase'
);

-- ÍNDICES para mejor rendimiento
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

-- FUNCIONES ÚTILES

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    NEW._lastSync = NOW();
    NEW._syncVersion = OLD._syncVersion + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar automáticamente updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para buscar usuarios por proximidad (para futuro)
CREATE OR REPLACE FUNCTION find_nearby_users(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km DECIMAL DEFAULT 5
)
RETURNS TABLE(
    id TEXT,
    displayName TEXT,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.displayName,
        (
            6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians((u.location->>'lat')::DECIMAL)) * 
                cos(radians((u.location->>'lng')::DECIMAL) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians((u.location->>'lat')::DECIMAL))
            )
        )::DECIMAL as distance_km
    FROM users u
    WHERE u.location IS NOT NULL
      AND u.isVisible = true
      AND u.id != (SELECT id FROM users WHERE location->>'lat' = user_lat::TEXT LIMIT 1)
    HAVING distance_km <= radius_km
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) para seguridad
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (puedes ajustar según necesidades)
CREATE POLICY "Users can view their own data" ON users
    FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (isVisible = true);

CREATE POLICY "Users can manage their trips" ON trips
    FOR ALL USING (auth.uid()::text = userId OR auth.uid()::text = driverId);

CREATE POLICY "Users can view their notifications" ON notifications
    FOR ALL USING (auth.uid()::text = userId);

-- VISTAS ÚTILES

-- Vista de usuarios activos
CREATE OR REPLACE VIEW active_users AS
SELECT 
    id,
    email,
    displayName,
    username,
    userType,
    isVisible,
    location,
    createdAt,
    updatedAt
FROM users
WHERE updatedAt > NOW() - INTERVAL '30 days';

-- Vista de estadísticas
CREATE OR REPLACE VIEW app_stats AS
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE userType = 'driver') as total_drivers,
    (SELECT COUNT(*) FROM users WHERE createdAt > NOW() - INTERVAL '24 hours') as new_users_today,
    (SELECT COUNT(*) FROM trips WHERE status = 'completed') as completed_trips,
    (SELECT COUNT(*) FROM trips WHERE createdAt > NOW() - INTERVAL '24 hours') as trips_today;

-- Comentarios en tablas
COMMENT ON TABLE users IS 'Usuarios de la aplicación Urban Drive';
COMMENT ON TABLE invitations IS 'Invitaciones enviadas por usuarios';
COMMENT ON TABLE trips IS 'Viajes solicitados y completados';
COMMENT ON TABLE notifications IS 'Notificaciones del sistema';

COMMENT ON COLUMN users._syncVersion IS 'Versión para control de sincronización';
COMMENT ON COLUMN users._source IS 'Origen del dato: firebase o supabase';
COMMENT ON COLUMN users.location IS 'Ubicación GPS: {lat: number, lng: number}';
COMMENT ON COLUMN users.contacts IS 'Array de IDs de usuarios en contactos';

-- Insertar datos de prueba (opcional)
-- INSERT INTO users (id, email, displayName, username, userType) VALUES
-- ('test-user-1', 'test@example.com', 'Usuario Prueba', 'testuser', 'user');

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Urban Drive database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, invitations, trips, notifications';
    RAISE NOTICE 'Indexes and functions created for optimal performance';
    RAISE NOTICE 'Row Level Security enabled for data protection';
END $$;