#!/bin/bash

echo "🚀 Creando proyecto Expo para Urban Drive..."
echo "============================================"

# Crear directorio para el proyecto Expo
EXPO_DIR="urban-drive-expo"
mkdir -p "$EXPO_DIR"
cd "$EXPO_DIR"

# Crear package.json básico para Expo
cat > package.json << 'EOF'
{
  "name": "urban-drive-expo",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "build:all": "eas build --platform all"
  },
  "dependencies": {
    "expo": "~51.0.28",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-web": "~0.19.10",
    "react-dom": "18.2.0",
    "@expo/vector-icons": "^14.0.2",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "@react-navigation/native": "^6.0.2",
    "@react-navigation/stack": "^6.0.2",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-reanimated": "~3.10.1",
    "expo-location": "~17.0.1",
    "expo-constants": "~16.0.2",
    "expo-status-bar": "~1.12.1",
    "react-native-maps": "1.14.0",
    "firebase": "^10.14.1",
    "expo-sharing": "~12.0.1",
    "expo-file-system": "~17.0.1"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
EOF

# Crear app.json de configuración
cat > app.json << 'EOF'
{
  "expo": {
    "name": "Urban Drive",
    "slug": "urban-drive",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.urbandrive.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.urbandrive.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "INTERNET"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-location"
    ]
  }
}
EOF

# Crear eas.json para builds
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF

# Crear babel.config.js
cat > babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
EOF

# Crear estructura de carpetas
mkdir -p assets
mkdir -p components
mkdir -p screens
mkdir -p services
mkdir -p utils
mkdir -p constants

# Crear App.js principal
cat > App.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import HomeScreen from './screens/HomeScreen';
import AuthScreen from './screens/AuthScreen';
import MapScreen from './screens/MapScreen';

// Services
import { initializeFirebase } from './services/firebase';

const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializar Firebase
    initializeFirebase();
    
    // Simular verificación de autenticación
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>🚗 Urban Drive</Text>
        <Text style={styles.subtitle}>Cargando...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'Urban Drive' }}
            />
            <Stack.Screen 
              name="Map" 
              component={MapScreen}
              options={{ title: 'Mapa' }}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Auth" 
            options={{ headerShown: false }}
          >
            {(props) => <AuthScreen {...props} onAuth={() => setIsAuthenticated(true)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
  },
});
EOF

# Crear pantalla de autenticación
cat > screens/AuthScreen.js << 'EOF'
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Simulamos autenticación exitosa
    Alert.alert(
      'Éxito',
      isLogin ? 'Sesión iniciada correctamente' : 'Cuenta creada correctamente',
      [{ text: 'OK', onPress: onAuth }]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>🚗</Text>
        <Text style={styles.appName}>Urban Drive</Text>
        <Text style={styles.subtitle}>Transporte urbano seguro y confiable</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin 
              ? '¿No tienes cuenta? Créala aquí' 
              : '¿Ya tienes cuenta? Inicia sesión'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
});
EOF

# Crear pantalla principal
cat > screens/HomeScreen.js << 'EOF'
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function HomeScreen({ navigation }) {
  const menuItems = [
    { title: 'Ver Mapa', screen: 'Map', icon: '🗺️' },
    { title: 'Mis Viajes', screen: 'Trips', icon: '🚗' },
    { title: 'Perfil', screen: 'Profile', icon: '👤' },
    { title: 'Configuración', screen: 'Settings', icon: '⚙️' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>¡Bienvenido!</Text>
        <Text style={styles.subtitle}>¿A dónde quieres ir hoy?</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  welcome: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
  },
  menu: {
    padding: 20,
  },
  menuItem: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
});
EOF

# Crear pantalla de mapa
cat > screens/MapScreen.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permisos de ubicación denegados');
        Alert.alert('Error', 'Se necesitan permisos de ubicación para mostrar el mapa');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      // Ubicación por defecto (Bogotá)
      setLocation({
        latitude: 4.710989,
        longitude: -74.072092,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={location}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Tu ubicación"
            description="Estás aquí"
          />
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
EOF

# Crear configuración de Firebase
cat > services/firebase.js << 'EOF'
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Configuración de Firebase (reemplazar con tu configuración)
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};

let app;
let auth;
let db;

export const initializeFirebase = () => {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('✅ Firebase inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
  }
};

export { auth, db };
export default app;
EOF

# Crear archivos de assets básicos (iconos placeholders)
echo "Creando assets básicos..."

# Crear un README con instrucciones
cat > README.md << 'EOF'
# Urban Drive - Expo Project

Este es el proyecto Expo de Urban Drive, convertido desde la versión web.

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Instalar Expo CLI globalmente (si no lo tienes):
```bash
npm install -g expo-cli @expo/cli
```

3. Iniciar el proyecto:
```bash
expo start
```

## Builds con EAS

1. Instalar EAS CLI:
```bash
npm install -g eas-cli
```

2. Configurar EAS (primera vez):
```bash
eas login
eas build:configure
```

3. Generar APK:
```bash
eas build --platform android --profile preview
```

## Configuración Firebase

Reemplaza la configuración en `services/firebase.js` con tu configuración real de Firebase.

## Estructura del Proyecto

- `App.js` - Componente principal y navegación
- `screens/` - Pantallas de la aplicación
- `components/` - Componentes reutilizables
- `services/` - Servicios (Firebase, APIs)
- `utils/` - Utilidades y helpers
- `assets/` - Imágenes, iconos, etc.

## Scripts Disponibles

- `npm start` - Iniciar en modo desarrollo
- `npm run android` - Abrir en Android
- `npm run ios` - Abrir en iOS
- `npm run web` - Abrir en navegador
- `npm run build:android` - Crear build Android con EAS
EOF

cd ..

echo ""
echo "🎉 ¡Proyecto Expo creado exitosamente!"
echo "======================================"
echo ""
echo "📁 Directorio: $EXPO_DIR/"
echo "📱 Configurado para Android/iOS"
echo "🔥 Firebase integrado (requiere configuración)"
echo "🗺️ Mapbox/Maps nativo incluido"
echo ""
echo "📋 Próximos pasos:"
echo "   1. cd $EXPO_DIR"
echo "   2. npm install"
echo "   3. Configurar Firebase en services/firebase.js"
echo "   4. expo start"
echo "   5. eas build --platform android --profile preview"
echo ""
echo "💡 Para generar APK real:"
echo "   - Instala: npm install -g eas-cli"
echo "   - Configura: eas login && eas build:configure"
echo "   - Construye: eas build --platform android --profile preview"
echo ""
echo "✅ Este proyecto se puede abrir en Visual Studio Code"
echo "✅ Compatible con EAS Build para APKs reales"
EOF