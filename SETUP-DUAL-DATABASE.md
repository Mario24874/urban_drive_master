# Configuración Sistema Dual Firebase + Supabase

## 🔄 SISTEMA DE RESPALDO AUTOMÁTICO

Este sistema garantiza:
- ✅ **Respaldo automático** de Firebase a Supabase
- ✅ **Failover automático** si Firebase no está disponible
- ✅ **Sincronización** cuando Firebase vuelve online
- ✅ **Datos locales** mientras no hay conexión

## 📋 PASOS DE CONFIGURACIÓN

### 1. **Crear proyecto Supabase (GRATIS)**

1. Ve a https://supabase.com
2. Crear cuenta/proyecto nuevo
3. Obtener credenciales:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJhbGc...`

### 2. **Configurar credenciales**

Editar `src/services/database-sync.ts`:

```typescript
// Reemplazar con tus credenciales Supabase
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY';
```

### 3. **Crear tablas en Supabase**

Ejecutar en Supabase SQL Editor:

```sql
-- Tabla de usuarios
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
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
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  inviterEmail TEXT,
  inviterPhone TEXT,
  recipientPhone TEXT,
  used BOOLEAN DEFAULT false,
  expiresAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de viajes
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id),
  origin JSONB,
  destination JSONB,
  status TEXT,
  price DECIMAL,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  completedAt TIMESTAMPTZ
);

-- Índices para mejor rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_trips_user ON trips(userId);
```

### 4. **Implementar en la aplicación**

```typescript
// Ejemplo de uso
import db from './services/database-sync';

// Escribir datos (se sincronizan automáticamente)
await db.writeData('users', userId, {
  email: 'usuario@email.com',
  name: 'Juan Pérez',
  location: { lat: 4.710989, lng: -74.072092 }
});

// Leer datos (failover automático)
const user = await db.readData('users', userId);

// Ver estado de sincronización
const status = db.getSyncStatus();
console.log('Base de datos activa:', status.primaryDB);
console.log('Firebase online:', status.isFirebaseOnline);
console.log('Datos pendientes:', status.pendingCount);
```

## 💰 LÍMITES GRATUITOS

### **Firebase (Spark Plan)**
- 50K lecturas/día
- 20K escrituras/día
- 1GB almacenamiento
- 10GB transferencia/mes

### **Supabase (Free Tier)**
- 500MB base de datos
- 2GB transferencia/mes
- 50K operaciones/mes
- Sin límite de usuarios

## 🎯 BENEFICIOS DEL SISTEMA DUAL

1. **Alta disponibilidad** - Si Firebase falla, Supabase toma el control
2. **Respaldo automático** - Todos los datos en 2 lugares
3. **Sin pérdida de datos** - Cola local para sincronización
4. **Costos controlados** - Distribuir carga entre servicios
5. **Migración fácil** - Si necesitas cambiar de proveedor

## 🔍 MONITOREO DE COSTOS

### **Firebase Console**
```
https://console.firebase.google.com
→ urbandrive-1082b
→ Settings → Usage and billing
```

### **Supabase Dashboard**
```
https://app.supabase.com
→ Tu proyecto
→ Settings → Billing & Usage
```

## ⚙️ CONFIGURACIÓN RECOMENDADA

1. **Desarrollo**: Solo Firebase (más simple)
2. **Producción**: Sistema dual activado
3. **Alertas**: Configurar avisos al 80% de cuota

## 🚨 ALERTAS DE CUOTA

Agregar en Firebase Console:
- Budget alerts al 50%, 80% y 90%
- Email notifications
- Considerar upgrade si creces

## 📊 DASHBOARD DE MONITOREO

Crear vista en la app para admins:

```typescript
// Componente de monitoreo
const DatabaseStatus = () => {
  const status = db.getSyncStatus();
  
  return (
    <div>
      <h3>Estado de Base de Datos</h3>
      <p>DB Principal: {status.primaryDB}</p>
      <p>Firebase: {status.isFirebaseOnline ? '✅' : '❌'}</p>
      <p>Sincronización: {status.isSyncEnabled ? 'ON' : 'OFF'}</p>
      <p>Pendientes: {status.pendingCount}</p>
      <button onClick={() => db.toggleSync(!status.isSyncEnabled)}>
        {status.isSyncEnabled ? 'Pausar Sync' : 'Activar Sync'}
      </button>
    </div>
  );
};
```

## 🛡️ SEGURIDAD

1. **No exponer keys** en código público
2. **Usar variables de entorno** para producción
3. **Configurar reglas** en ambas bases de datos
4. **Auditar accesos** regularmente

## 📝 NOTAS IMPORTANTES

- Supabase es **100% compatible** con PostgreSQL
- Ambos servicios tienen **SDKs oficiales** para React/React Native
- La sincronización es **asíncrona** para no afectar rendimiento
- Los datos se **comprimen** automáticamente en transferencia