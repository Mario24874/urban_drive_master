# 📱 INSTRUCCIONES COMPLETAS PARA REFACTORIZAR URBAN DRIVE APK

**Proyecto:** urban-drive-expo-standalone  
**Objetivo:** Refactorizar la versión APK para que funcione exactamente igual que la versión web

## 🎯 CONTEXTO CRÍTICO

Estás trabajando en la versión APK móvil del proyecto Urban Drive. Esta versión DEBE:
- Usar la MISMA base de datos Firebase que la versión web
- Implementar TODAS las funcionalidades de la versión web
- Mantener el mismo diseño adaptado a móvil
- Generar un APK funcional instalable en dispositivos Android

## 🔄 SINCRONIZACIÓN OBLIGATORIA - BASE DE DATOS DUAL

### ⚠️ CONCEPTO CRÍTICO: BASE DE DATOS UNIFICADA

**ATENCIÓN:** Este proyecto utiliza un sistema de **BASE DE DATOS DUAL** donde:

#### **🎯 REQUISITOS OBLIGATORIOS:**

1. **BASE DE DATOS UNIFICADA**
   - ✅ **OBLIGATORIO:** Ambas versiones (web y APK) DEBEN usar la MISMA instancia Firebase
   - ✅ **OBLIGATORIO:** Mismas credenciales y configuración Firebase
   - ✅ **OBLIGATORIO:** Esquema de datos IDÉNTICO (usuarios, viajes, ubicaciones)
   - ✅ **OBLIGATORIO:** Autenticación COMPARTIDA (mismo login en ambas)

2. **FUNCIONALIDADES ESPEJO**
   - ✅ **OBLIGATORIO:** Todas las funciones de la web DEBEN existir en APK
   - ✅ **OBLIGATORIO:** Todas las funciones del APK DEBEN existir en web
   - ✅ **OBLIGATORIO:** UX consistente pero optimizada por plataforma
   - ✅ **OBLIGATORIO:** Estados sincronizados (sesión, preferencias, datos)

3. **PROTOCOLO DE VALIDACIÓN DUAL**
   Cuando implementes una funcionalidad:
   
   - **ANTES:** Verifica cómo funciona en la versión web
   - **DURANTE:** Documenta CADA cambio funcional realizado
   - **DESPUÉS:** Prueba que los datos se vean igual en ambas versiones

### Base de Datos Firebase Compartida
```javascript
// Configuración EXACTA que debes usar (ya está en app.json):
// ⚠️ CRÍTICO: Esta DEBE ser la MISMA configuración que usa la versión web
const firebaseConfig = {
  apiKey: "AIzaSyD_zQMqs8o3evjEtjkuXybPW-sdH4c573M",
  authDomain: "urbandrive-1082b.firebaseapp.com",
  projectId: "urbandrive-1082b",
  storageBucket: "urbandrive-1082b.appspot.com",
  messagingSenderId: "470229432792",
  appId: "1:470229432792:web:defaultappid"
};
```

### 🔄 PRUEBAS DE SINCRONIZACIÓN OBLIGATORIAS

**DESPUÉS de cada implementación, DEBES verificar:**

1. **Crear un usuario en la versión web** → Debe poder hacer login en APK
2. **Crear un viaje en APK** → Debe aparecer en el historial web
3. **Modificar perfil en web** → Debe reflejarse en APK
4. **Cerrar sesión en APK** → No debe estar logueado en web

### 🚨 ALERTAS CRÍTICAS DE BASE DE DATOS DUAL

- **❌ NUNCA** uses una configuración Firebase diferente
- **❌ NUNCA** crees esquemas de datos distintos
- **❌ NUNCA** implementes funciones solo en una versión
- **✅ SIEMPRE** verifica sincronización después de cambios
- **✅ SIEMPRE** usa los mismos nombres de colecciones y campos

## 🏗️ ARQUITECTURA Y ESTRUCTURA DEL PROYECTO

### Estructura de Carpetas Recomendada
```
urban-drive-expo-standalone/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── ErrorBoundary.js
│   │   │   └── LoadingOverlay.js
│   │   ├── ui/
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── Card.js
│   │   ├── map/
│   │   │   ├── MapView.js
│   │   │   ├── UserMarker.js
│   │   │   ├── DriverMarker.js
│   │   │   └── RouteOverlay.js
│   │   └── trip/
│   │       ├── TripRequest.js
│   │       ├── TripStatus.js
│   │       └── TripRating.js
│   ├── constants/
│   │   ├── theme.js
│   │   ├── config.js
│   │   └── mapStyles.js
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── location.js
│   │   └── formatters.js
│   └── hooks/
│       ├── useLocation.js
│       ├── useFirestore.js
│       └── useAuth.js
├── screens/
├── services/
└── navigation/
```

## 📝 CÓDIGO DETALLADO POR COMPONENTE

### 1. Constantes de Tema (src/constants/theme.js)
```javascript
export const COLORS = {
  // Colores principales
  primary: '#000000',
  secondary: '#FFFFFF',
  background: '#000000',
  surface: '#1a1a1a',
  
  // Textos
  text: '#FFFFFF',
  textSecondary: '#aaaaaa',
  textMuted: '#666666',
  
  // Estados
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Utilidad
  border: '#333333',
  divider: '#222222',
  overlay: 'rgba(0, 0, 0, 0.8)',
  
  // Mapa
  routeLine: '#4285F4',
  userLocation: '#4285F4',
  driverLocation: '#FFC107',
};

export const SIZES = {
  // Texto
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  body: 16,
  caption: 14,
  small: 12,
  
  // Espaciado
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  
  // Bordes
  radius: 8,
  radiusLg: 12,
  radiusXl: 16,
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};
```

### 2. Configuración (src/constants/config.js)
```javascript
export const APP_CONFIG = {
  name: 'Urban Drive',
  description: 'Transporte urbano seguro y confiable',
  version: '1.0.0',
  supportEmail: 'soporte@urbandrive.com',
};

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_zQMqs8o3evjEtjkuXybPW-sdH4c573M",
  authDomain: "urbandrive-1082b.firebaseapp.com",
  projectId: "urbandrive-1082b",
  storageBucket: "urbandrive-1082b.appspot.com",
  messagingSenderId: "470229432792",
  appId: "1:470229432792:web:defaultappid"
};

export const MAP_CONFIG = {
  defaultRegion: {
    latitude: 4.7110,
    longitude: -74.0721,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  defaultZoom: 12,
  animationDuration: 1000,
};

export const TRIP_CONFIG = {
  baseFare: 3500,
  perKmRate: 1200,
  perMinuteRate: 200,
  minFare: 5000,
  maxSearchRadius: 5, // km
  driverSearchTimeout: 30, // segundos
};
```

### 3. Componente Button Personalizado (src/components/ui/Button.js)
```javascript
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const isDisabled = disabled || loading;
  
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    isDisabled && styles.disabled,
    style,
  ];
  
  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? COLORS.primary : COLORS.secondary} 
          size="small" 
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SIZES.sm,
  },
  // Variantes
  primary: {
    backgroundColor: COLORS.secondary,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Tamaños
  small: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
  },
  medium: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
  },
  large: {
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.xl,
  },
  // Estados
  disabled: {
    opacity: 0.5,
  },
  // Textos
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: COLORS.primary,
  },
  secondaryText: {
    color: COLORS.text,
  },
  outlineText: {
    color: COLORS.secondary,
  },
  ghostText: {
    color: COLORS.text,
  },
  smallText: {
    fontSize: SIZES.caption,
  },
  mediumText: {
    fontSize: SIZES.body,
  },
  largeText: {
    fontSize: SIZES.h5,
  },
});

export default Button;
```

### 4. Componente Input (src/components/ui/Input.js)
```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  icon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const showPasswordToggle = secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        {icon && (
          <View style={styles.leftIcon}>
            {icon}
          </View>
        )}
        
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !showPasswordToggle && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
  },
  inputContainerFocused: {
    borderColor: COLORS.secondary,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  leftIcon: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  rightIcon: {
    marginLeft: SIZES.sm,
    padding: SIZES.xs,
  },
  errorText: {
    fontSize: SIZES.caption,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
});

export default Input;
```

### 5. Componente Card (src/components/ui/Card.js)
```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const Card = ({ children, style, shadow = 'medium', ...props }) => {
  return (
    <View
      style={[
        styles.card,
        SHADOWS[shadow],
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default Card;
```

### 6. Servicios Firestore (services/firestore.js)
```javascript
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  GeoPoint,
} from 'firebase/firestore';
import { db } from './firebase';
import { TRIP_CONFIG } from '../src/constants/config';

// Usuarios
export const saveUserProfile = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error guardando perfil:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    throw error;
  }
};

// Viajes
export const requestTrip = async (tripData) => {
  try {
    const trip = {
      ...tripData,
      status: 'requested',
      createdAt: serverTimestamp(),
      fare: calculateFare(tripData.distance, tripData.duration),
    };
    
    const docRef = await addDoc(collection(db, 'trips'), trip);
    
    // Buscar conductor disponible
    const driver = await findAvailableDriver(tripData.origin);
    
    if (driver) {
      await updateDoc(docRef, {
        driverId: driver.id,
        driver: driver,
        status: 'accepted',
      });
      
      return { id: docRef.id, ...trip, driver };
    }
    
    return { id: docRef.id, ...trip };
  } catch (error) {
    console.error('Error solicitando viaje:', error);
    throw error;
  }
};

export const getUserTrips = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'trips'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error obteniendo viajes:', error);
    throw error;
  }
};

export const subscribeToTrip = (tripId, callback) => {
  return onSnapshot(doc(db, 'trips', tripId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

// Conductores
export const getNearbyDrivers = async (location, radiusKm = 5) => {
  try {
    // Simulación - En producción usar geoqueries reales
    const driversSnapshot = await getDocs(
      query(
        collection(db, 'drivers'),
        where('available', '==', true),
        limit(10)
      )
    );
    
    return driversSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(driver => {
        // Filtrar por distancia
        const distance = calculateDistance(location, driver.location);
        return distance <= radiusKm;
      });
  } catch (error) {
    console.error('Error obteniendo conductores:', error);
    throw error;
  }
};

const findAvailableDriver = async (userLocation) => {
  const drivers = await getNearbyDrivers(userLocation);
  return drivers.length > 0 ? drivers[0] : null;
};

// Utilidades
const calculateFare = (distanceKm, durationMin) => {
  const { baseFare, perKmRate, perMinuteRate, minFare } = TRIP_CONFIG;
  const fare = baseFare + (distanceKm * perKmRate) + (durationMin * perMinuteRate);
  return Math.max(fare, minFare);
};

const calculateDistance = (point1, point2) => {
  // Fórmula de Haversine para calcular distancia
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI/180);

// Lugares guardados
export const savePlace = async (userId, place) => {
  try {
    await addDoc(collection(db, 'users', userId, 'savedPlaces'), {
      ...place,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error guardando lugar:', error);
    throw error;
  }
};

export const getSavedPlaces = async (userId) => {
  try {
    const snapshot = await getDocs(
      collection(db, 'users', userId, 'savedPlaces')
    );
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error obteniendo lugares:', error);
    throw error;
  }
};

// Métodos de pago
export const savePaymentMethod = async (userId, paymentMethod) => {
  try {
    await addDoc(collection(db, 'users', userId, 'paymentMethods'), {
      ...paymentMethod,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error guardando método de pago:', error);
    throw error;
  }
};

export const getPaymentMethods = async (userId) => {
  try {
    const snapshot = await getDocs(
      collection(db, 'users', userId, 'paymentMethods')
    );
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    throw error;
  }
};
```

### 7. Pantalla Principal HomeScreen (screens/HomeScreen.js)
```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';

// Components
import Card from '../src/components/ui/Card';
import Button from '../src/components/ui/Button';

// Services & Utils
import { auth } from '../services/firebase';
import { getCurrentLocation } from '../src/utils/location';

// Constants
import { COLORS, SIZES, SHADOWS } from '../src/constants/theme';

const HomeScreen = ({ navigation, user }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [stats, setStats] = useState({
    totalTrips: 0,
    lastTrip: null,
    savedAddresses: 0,
  });

  useEffect(() => {
    loadUserData();
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  };

  const loadUserData = async () => {
    // TODO: Cargar datos del usuario desde Firestore
    setStats({
      totalTrips: 15,
      lastTrip: '2 días atrás',
      savedAddresses: 3,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await getUserLocation();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const QuickAction = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={24} color={COLORS.secondary} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.secondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.displayName || 'Usuario'} 👋</Text>
            <Text style={styles.subGreeting}>¿A dónde vamos hoy?</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.profileButton}>
              <Ionicons name="person-circle" size={40} color={COLORS.secondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Botón principal de viaje */}
        <Card style={styles.mainCard}>
          <Button
            title="Solicitar Viaje"
            size="large"
            onPress={() => navigation.navigate('Map')}
            icon={<Ionicons name="car" size={24} color={COLORS.primary} />}
            style={styles.mainButton}
          />
          {location && (
            <Text style={styles.locationText}>
              📍 Tu ubicación actual ha sido detectada
            </Text>
          )}
        </Card>

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          
          <QuickAction
            icon="time"
            title="Historial de Viajes"
            subtitle={`${stats.totalTrips} viajes realizados`}
            onPress={() => navigation.navigate('History')}
          />
          
          <QuickAction
            icon="location"
            title="Lugares Guardados"
            subtitle={`${stats.savedAddresses} direcciones`}
            onPress={() => {/* TODO: Implementar */}}
          />
          
          <QuickAction
            icon="card"
            title="Métodos de Pago"
            subtitle="Gestiona tus tarjetas"
            onPress={() => navigation.navigate('Payment')}
          />
        </View>

        {/* Estadísticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu Actividad</Text>
          <Card style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>Viajes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>$125k</Text>
              <Text style={styles.statLabel}>Ahorrado</Text>
            </View>
          </Card>
        </View>

        {/* Botón de cerrar sesión */}
        <Button
          title="Cerrar Sesión"
          variant="ghost"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SIZES.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  greeting: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  subGreeting: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  profileButton: {
    padding: SIZES.xs,
  },
  mainCard: {
    margin: SIZES.lg,
    padding: SIZES.xl,
    alignItems: 'center',
  },
  mainButton: {
    width: '100%',
    marginBottom: SIZES.md,
  },
  locationText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginTop: SIZES.xl,
    paddingHorizontal: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.lg,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.md,
    ...SHADOWS.light,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  quickActionSubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  statsCard: {
    flexDirection: 'row',
    padding: SIZES.xl,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  statLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.divider,
  },
  logoutButton: {
    margin: SIZES.lg,
    marginTop: SIZES.xxl,
  },
});

export default HomeScreen;
```

### 8. Pantalla de Historial (screens/HistoryScreen.js)
```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Components
import Card from '../src/components/ui/Card';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';

// Services
import { getUserTrips } from '../services/firestore';
import { auth } from '../services/firebase';

// Utils
import { formatDate, formatCurrency } from '../src/utils/formatters';

// Constants
import { COLORS, SIZES } from '../src/constants/theme';

const HistoryScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const userTrips = await getUserTrips(auth.currentUser.uid);
      setTrips(userTrips);
    } catch (error) {
      console.error('Error cargando viajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      case 'in_progress':
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      case 'in_progress':
        return 'En progreso';
      case 'requested':
        return 'Solicitado';
      default:
        return status;
    }
  };

  const TripItem = ({ trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigation.navigate('TripDetails', { tripId: trip.id })}
    >
      <Card style={styles.tripCardContent}>
        <View style={styles.tripHeader}>
          <View style={styles.tripInfo}>
            <Text style={styles.tripDate}>
              {formatDate(trip.createdAt?.toDate())}
            </Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(trip.status) }
              ]} />
              <Text style={[
                styles.statusText,
                { color: getStatusColor(trip.status) }
              ]}>
                {getStatusText(trip.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.tripFare}>
            {formatCurrency(trip.fare)}
          </Text>
        </View>

        <View style={styles.tripRoute}>
          <View style={styles.routePoint}>
            <Ionicons name="radio-button-on" size={12} color={COLORS.success} />
            <Text style={styles.routeText} numberOfLines={1}>
              {trip.originAddress || 'Ubicación de origen'}
            </Text>
          </View>
          
          <View style={styles.routeLine} />
          
          <View style={styles.routePoint}>
            <Ionicons name="location" size={12} color={COLORS.error} />
            <Text style={styles.routeText} numberOfLines={1}>
              {trip.destinationAddress || 'Ubicación de destino'}
            </Text>
          </View>
        </View>

        {trip.driver && (
          <View style={styles.driverInfo}>
            <Ionicons name="person" size={16} color={COLORS.textSecondary} />
            <Text style={styles.driverName}>{trip.driver.name}</Text>
            {trip.rating && (
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.ratingText}>{trip.rating}</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner text="Cargando historial..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TripItem trip={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.secondary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No hay viajes aún</Text>
            <Text style={styles.emptyText}>
              Tus viajes aparecerán aquí una vez que solicites tu primer viaje
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  tripCard: {
    marginBottom: SIZES.md,
  },
  tripCardContent: {
    padding: SIZES.lg,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
  },
  tripInfo: {
    flex: 1,
  },
  tripDate: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SIZES.xs,
  },
  statusText: {
    fontSize: SIZES.caption,
    fontWeight: '600',
  },
  tripFare: {
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tripRoute: {
    marginBottom: SIZES.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  routeText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginLeft: SIZES.sm,
    flex: 1,
  },
  routeLine: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 6,
    marginVertical: SIZES.xs,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  driverName: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
    flex: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xxl * 2,
  },
  emptyTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SIZES.xl,
  },
});

export default HistoryScreen;
```

### 9. Utilidades y Helpers (src/utils/formatters.js)
```javascript
export const formatCurrency = (amount, currency = 'COP') => {
  if (typeof amount !== 'number') return '$0';
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return new Intl.DateTimeFormat('es-CO', {
    ...defaultOptions,
    ...options,
  }).format(date);
};

export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Formato colombiano: +57 300 123 4567
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+57 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone;
};

export const formatRating = (rating) => {
  if (!rating) return '0.0';
  return parseFloat(rating).toFixed(1);
};

export const getTimeAgo = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays > 0) {
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return 'Ahora mismo';
  }
};
```

### 10. Validadores (src/utils/helpers.js)
```javascript
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const isValidCoordinate = (coord) => {
  return coord && 
         typeof coord.latitude === 'number' && 
         typeof coord.longitude === 'number' &&
         coord.latitude >= -90 && coord.latitude <= 90 &&
         coord.longitude >= -180 && coord.longitude <= 180;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
```

## 🔧 COMANDOS Y SCRIPTS

### Dependencias a Instalar
```bash
# Dependencias principales
npm install react-native-maps expo-location @react-navigation/bottom-tabs
npm install @expo/vector-icons react-native-safe-area-context
npm install expo-notifications expo-permissions

# Dependencias de Firebase
npm install firebase

# Dependencias de navegación
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-gesture-handler
```

### Scripts de Desarrollo (package.json)
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android --profile preview",
    "build:ios": "eas build --platform ios --profile preview",
    "submit:android": "eas submit --platform android",
    "submit:ios": "eas submit --platform ios"
  }
}
```

### Comandos de Desarrollo
```bash
# Verificar configuración
npx expo config

# Iniciar servidor de desarrollo
npx expo start

# Limpiar cache
npx expo start --clear

# Generar APK
npx eas build --platform android --profile preview

# Ver builds
npx eas build:list

# Descargar APK
npx eas build:download --platform android --latest
```

## ✅ CHECKLIST DE IMPLEMENTACIÓN COMPLETO - BASE DE DATOS DUAL

### ⚠️ VALIDACIÓN DE BASE DE DATOS DUAL - OBLIGATORIO EN CADA FASE

**IMPORTANTE:** Después de completar cada fase, DEBES verificar que la sincronización dual funcione:

### Fase 1: Estructura Base
- [ ] Crear carpeta src/ con subcarpetas
- [ ] Implementar constants/theme.js
- [ ] Implementar constants/config.js
- [ ] Crear components/ui/ básicos (Button, Input, Card)
- [ ] Configurar navegación principal

### Fase 2: Servicios Core - CONFIGURACIÓN DUAL
- [ ] **CRÍTICO:** Completar services/firebase.js con configuración EXACTA de la web
- [ ] **OBLIGATORIO:** Implementar services/firestore.js con esquemas IDÉNTICOS
- [ ] **VALIDAR:** Probar conexión a Firebase con mismas credenciales
- [ ] Crear utils/helpers.js
- [ ] Crear utils/formatters.js
- [ ] **PRUEBA DUAL:** Crear documento de prueba en APK y verificar en consola Firebase

### Fase 3: Pantallas Principales - AUTENTICACIÓN DUAL
- [ ] **CRÍTICO:** Refactorizar AuthScreen con autenticación compartida
- [ ] **PRUEBA DUAL:** Crear usuario en APK y verificar login en web
- [ ] **PRUEBA DUAL:** Login en web y verificar sesión activa en APK
- [ ] Implementar HomeScreen funcional
- [ ] Crear MapScreen con react-native-maps
- [ ] **OBLIGATORIO:** Implementar HistoryScreen que muestre datos de ambas versiones
- [ ] Crear ProfileScreen con datos sincronizados

### Fase 4: Funcionalidades Avanzadas - DATOS SINCRONIZADOS
- [ ] **CRÍTICO:** Sistema de solicitud de viajes con datos compartidos
- [ ] **PRUEBA DUAL:** Crear viaje en APK y verificar en historial web
- [ ] **PRUEBA DUAL:** Modificar estado de viaje en web y verificar en APK
- [ ] Tracking en tiempo real sincronizado
- [ ] Notificaciones push
- [ ] Métodos de pago sincronizados entre versiones
- [ ] Sistema de rating con datos compartidos

### Fase 5: Testing y Deploy - VALIDACIÓN DUAL
- [ ] **CRÍTICO:** Probar sincronización de base de datos dual
- [ ] **OBLIGATORIO:** Crear usuario en web y verificar login en APK
- [ ] **OBLIGATORIO:** Crear viaje en APK y verificar en historial web
- [ ] **OBLIGATORIO:** Modificar datos en una versión y verificar en la otra
- [ ] Probar en dispositivos reales
- [ ] Optimizar rendimiento
- [ ] Generar APK final
- [ ] **FINAL:** Validación completa de base de datos dual funcionando

## 🚀 COMANDOS PARA EMPEZAR INMEDIATAMENTE

```bash
# 1. Crear estructura de carpetas
mkdir -p src/{components/{common,ui,map,trip},constants,utils,hooks}

# 2. Instalar dependencias críticas
npm install react-native-maps expo-location @react-navigation/bottom-tabs @expo/vector-icons

# 3. Verificar configuración actual
npx expo config

# 4. Iniciar desarrollo
npx expo start
```

Estas instrucciones proporcionan todo el código necesario para refactorizar completamente la aplicación APK con la misma funcionalidad que la versión web.