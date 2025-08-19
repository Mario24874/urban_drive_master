import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { writeData } from '../services/database-sync';
import { 
  Home, MapPin, Users, MessageSquare, User, Share, LogOut, 
  Eye, EyeOff, Send, X 
} from '../components/Icons';
import MapComponent from './MapComponent';
import type { UserData, Message, Location, Contact, FirebaseError } from '../types';

interface PortableInterfaceProps {
  user: UserData | null;
  isAuthenticated: boolean;
}

const PortableInterface: React.FC<PortableInterfaceProps> = ({ user, isAuthenticated }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Estados para registro/login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'user' | 'driver'>('user');
  
  // Estados para la app
  const [isVisible, setIsVisible] = useState(true);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // Estados para contactos
  const [searchPhone, setSearchPhone] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  
  // Estados para perfil editable
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    username: '',
    phone: '',
    email: '',
    userType: 'user' as 'user' | 'driver',
    bio: ''
  });

  // Obtener ubicación del usuario
  const getLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalización no soportada');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        method: 'GPS/WiFi',
        timestamp: new Date()
      };

      setUserLocation(location);

      if (user) {
        await writeData('users', user.id, {
          ...user,
          location: location,
          lastLocationUpdate: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error obteniendo ubicación GPS:', error);
      // Fallback a ubicación por IP
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
          const location = {
            lat: data.latitude,
            lng: data.longitude,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: 5000,
            method: 'IP',
            city: data.city,
            country: data.country_name,
            timestamp: new Date()
          };
          
          setUserLocation(location);
          
          if (user) {
            await writeData('users', user.id, {
              ...user,
              location: location,
              lastLocationUpdate: new Date().toISOString()
            });
          }
        }
      } catch (ipError) {
        setLocationError('No se pudo obtener ubicación');
        console.error('Error obteniendo ubicación por IP:', ipError);
      }
    }
  };

  // Cargar ubicación cuando el usuario se loguea
  useEffect(() => {
    if (user && !userLocation) {
      getLocation();
    }
  }, [user]);

  // Cargar contactos del usuario
  useEffect(() => {
    if (user) {
      const contactsQuery = query(
        collection(db, 'users'),
        where('isVisible', '==', true)
      );
      
      const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
        const contactsList = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Contact))
          .filter(contact => contact.id !== user.id);
        setContacts(contactsList);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Cargar mensajes cuando se selecciona un contacto
  useEffect(() => {
    if (selectedContact && user) {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('senderId', 'in', [user.id, selectedContact.id]),
        where('receiverId', 'in', [user.id, selectedContact.id])
      );
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesList = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Message))
          .filter(msg => 
            (msg.senderId === user.id && msg.receiverId === selectedContact.id) ||
            (msg.senderId === selectedContact.id && msg.receiverId === user.id)
          )
          .sort((a, b) => {
            const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : (a.timestamp as Date).getTime();
            const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : (b.timestamp as Date).getTime();
            return timeA - timeB;
          });
        setMessages(messagesList);
      });

      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [selectedContact, user]);

  // Funciones de autenticación
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage('¡Login exitoso!');
      setCurrentPage('home');
    } catch (error) {
      const firebaseError = error as FirebaseError;
      setMessage(`Error: ${firebaseError.message}`);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      
      const userData = {
        displayName,
        username,
        email,
        phone,
        userType,
        isVisible: true,
        isActive: userType === 'driver' ? false : true,
        contacts: [],
        visibleTo: [],
        location: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Usar sistema dual para guardar datos
      await writeData('users', result.user.uid, userData);
      
      setMessage('¡Registro exitoso!');
      setCurrentPage('home');
    } catch (error) {
      const firebaseError = error as FirebaseError;
      setMessage(`Error: ${firebaseError.message}`);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    signOut(auth);
    setCurrentPage('home');
  };

  // Toggle de visibilidad
  const toggleVisibility = async () => {
    if (user) {
      const newVisibility = !isVisible;
      await writeData('users', user.id, {
        ...user,
        isVisible: newVisibility,
        updatedAt: new Date().toISOString()
      });
      setIsVisible(newVisibility);
    }
  };

  // Enviar mensaje
  const sendMessage = async () => {
    if (!selectedContact || !newMessage.trim() || !user) return;

    try {
      const messageId = `msg_${Date.now()}_${user.id}`;
      await writeData('messages', messageId, {
        senderId: user.id,
        senderName: user.displayName || user.email || '',
        receiverId: selectedContact.id,
        receiverName: selectedContact.displayName,
        message: newMessage,
        timestamp: new Date().toISOString(),
        read: false
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  // Función para compartir app
  const handleAPKAction = () => {
    // Detectar tipo de dispositivo
    const deviceInfo = getDeviceInfo();
    const downloadAction = getDownloadAction(deviceInfo);
    
    if (downloadAction.action === 'download') {
      downloadAPKDirect();
    } else if (downloadAction.action === 'share') {
      shareAPK();
    } else {
      alert('Funcionalidad de compartir no disponible en este dispositivo');
    }
  };

  // Detectar información del dispositivo
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || '';
    
    return {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isAndroid: /Android/i.test(userAgent),
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      platform: /Android/i.test(userAgent) ? 'android' : /iPad|iPhone|iPod/.test(userAgent) ? 'ios' : 'desktop'
    };
  };

  // Obtener acción recomendada según dispositivo
  const getDownloadAction = (deviceInfo: any) => {
    if (deviceInfo.isAndroid) {
      return {
        action: 'download',
        icon: '📱',
        text: 'Descargar APK',
        description: 'Instalar Urban Drive en tu Android'
      };
    } else if (deviceInfo.isIOS) {
      return {
        action: 'share',
        icon: '📤',
        text: 'Compartir App',
        description: 'Enviar enlace de descarga'
      };
    } else {
      return {
        action: 'share',
        icon: '💻',
        text: 'Compartir App',
        description: 'Enviar APK por WhatsApp/Email'
      };
    }
  };

  // Descargar APK directamente
  const downloadAPKDirect = async () => {
    try {
      const response = await fetch('http://localhost:3001/apk-info');
      if (!response.ok) {
        throw new Error(`Servidor respondió con estado: ${response.status}`);
      }
      const apkInfo = await response.json();
      if (apkInfo.available) {
        const link = document.createElement('a');
        link.href = apkInfo.directUrl || apkInfo.downloadUrl;
        link.download = apkInfo.filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }
    } catch (error) {
      console.error('Error downloading APK:', error);
      alert('Error al descargar el APK. Verifica que el servidor esté ejecutándose.');
      return false;
    }
  };

  // Compartir APK
  const shareAPK = async () => {
    const shareData = {
      title: 'Urban Drive - App de Transporte',
      text: '¡Descarga Urban Drive! Conecta con conductores en tiempo real.',
      url: `${window.location.origin}/downloads/urban-drive.apk`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error compartiendo:', error);
        copyAPKLink();
      }
    } else {
      copyAPKLink();
    }
  };

  // Copiar enlace del APK
  const copyAPKLink = async () => {
    const apkUrl = `${window.location.origin}/downloads/urban-drive.apk`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(apkUrl);
        alert('¡Enlace del APK copiado al portapapeles!');
      } else {
        prompt('Copia este enlace:', apkUrl);
      }
    } catch (error) {
      prompt('Copia este enlace:', apkUrl);
    }
  };

  // Generar enlace de invitación
  const generateInvitationLink = async () => {
    if (!user) {
      alert('Debes estar logueado para generar invitaciones');
      return null;
    }
    
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Guardar invitación en la base de datos
      await writeData('invitations', invitationId, {
        inviterId: user.id,
        inviterName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        inviterEmail: user.email,
        inviterPhone: user.phone || 'No especificado',
        createdAt: new Date().toISOString(),
        used: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
      });
      
      const baseUrl = window.location.origin + window.location.pathname;
      const inviteUrl = `${baseUrl}?invite=${invitationId}`;
      
      return inviteUrl;
    } catch (error) {
      console.error('Error generando invitación:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo generar la invitación';
      alert(`Error: ${errorMessage}`);
      return null;
    }
  };

  // Buscar contacto por teléfono
  const searchContact = async () => {
    if (!searchPhone.trim()) return;
    
    setLoading(true);
    try {
      // Buscar en Firebase/Supabase todos los usuarios
      const allUsers = await getDocs(query(collection(db, 'users')));
      const foundUser = allUsers.docs.find(doc => 
        doc.data().phone === searchPhone.trim()
      );
      
      if (foundUser) {
        const contactData = { id: foundUser.id, ...foundUser.data() } as Contact;
        
        // Verificar si ya es contacto
        if (contacts.find(c => c.id === contactData.id)) {
          alert('Este usuario ya está en tus contactos');
          setLoading(false);
          return;
        }
        
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Agregar a contactos mutuamente usando sistema dual
        const userContacts = user.contacts || [];
        const contactContacts = contactData.contacts || [];
        
        await Promise.all([
          writeData('users', user.id, {
            ...user,
            contacts: [...userContacts, contactData.id]
          }),
          writeData('users', contactData.id, {
            ...contactData,
            contacts: [...contactContacts, user.id]
          })
        ]);
        
        setContacts(prev => [...prev, contactData]);
        setSearchPhone('');
        alert(`${contactData.displayName} agregado a tus contactos`);
      } else {
        alert('Usuario no encontrado. ¿Quieres enviarle una invitación?');
      }
    } catch (error) {
      console.error('Error buscando contacto:', error);
      alert('Error al buscar contacto');
    }
    setLoading(false);
  };

  // Crear y compartir invitación
  const createInvitation = async () => {
    setLoading(true);
    try {
      const link = await generateInvitationLink();
      
      if (link) {
        setInviteLink(link);
        
        // Copiar al portapapeles
        try {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(link);
            alert('¡Enlace de invitación copiado al portapapeles!');
          } else {
            alert('Enlace generado. Cópialo manualmente desde la caja de texto.');
          }
        } catch (clipboardError) {
          console.log('Error copiando al portapapeles:', clipboardError);
          alert('Enlace generado. Cópialo manualmente desde la caja de texto.');
        }
      }
    } catch (error) {
      console.error('Error creando invitación:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error creando invitación: ${errorMessage}`);
    }
    setLoading(false);
  };

  // Compartir invitación
  const shareInvitation = async () => {
    if (!inviteLink) {
      await createInvitation();
      return;
    }

    const shareData = {
      title: 'Únete a Urban Drive',
      text: `${user?.displayName || 'Un usuario'} te invita a usar Urban Drive para ubicación y transporte en tiempo real`,
      url: inviteLink
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error compartiendo:', error);
      }
    } else {
      // Fallback: copiar al portapapeles
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteLink);
        alert('Enlace copiado al portapapeles');
      }
    }
  };

  // Cargar datos del perfil
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        username: user.username || '',
        phone: user.phone || '',
        email: user.email || '',
        userType: user.userType || 'user',
        bio: user.bio || ''
      });
    }
  }, [user]);

  // Guardar cambios del perfil
  const saveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Actualizar datos en Firebase Auth si es necesario
      if (profileData.displayName !== user.displayName) {
        await updateProfile(auth.currentUser!, { 
          displayName: profileData.displayName 
        });
      }
      
      // Actualizar datos en Firestore usando sistema dual
      await writeData('users', user.id, {
        ...user,
        ...profileData,
        updatedAt: new Date().toISOString()
      });
      
      setIsEditingProfile(false);
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      alert('Error al actualizar el perfil');
    }
    setLoading(false);
  };

  // Cambiar contraseña
  const changePassword = async () => {
    const newPassword = prompt('Ingresa tu nueva contraseña (mínimo 6 caracteres):');
    if (!newPassword || newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      // Esto requeriría re-autenticación en una app real
      // Por simplicidad, solo mostramos un mensaje
      alert('Funcionalidad de cambio de contraseña requiere re-autenticación. Implementar según necesidades de seguridad.');
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      alert('Error al cambiar la contraseña');
    }
  };

  // Navegación
  const navigation = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'map', label: 'Mapa', icon: MapPin },
    { id: 'contacts', label: 'Contactos', icon: Users },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  // Renderizar contenido basado en la página actual
  const renderContent = () => {
    if (!isAuthenticated) {
      if (currentPage === 'login') {
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Iniciar Sesión</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <span className="spinner mr-2"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>
            {message && (
              <div className={`mt-4 p-3 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message}
              </div>
            )}
            <div className="mt-4 text-center">
              <button
                onClick={() => setCurrentPage('register')}
                className="text-black hover:underline"
              >
                ¿No tienes cuenta? Regístrate
              </button>
            </div>
          </div>
        );
      }

      if (currentPage === 'register') {
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear Cuenta</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="+1234567890"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('user')}
                    className={`p-3 border rounded-lg text-center transition-all ${
                      userType === 'user' 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <User size={20} className="mx-auto mb-1" />
                    <span className="text-sm font-medium">Usuario</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('driver')}
                    className={`p-3 border rounded-lg text-center transition-all ${
                      userType === 'driver' 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <MapPin size={20} className="mx-auto mb-1" />
                    <span className="text-sm font-medium">Conductor</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <span className="spinner mr-2"></span>
                    Creando cuenta...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>
            {message && (
              <div className={`mt-4 p-3 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message}
              </div>
            )}
            <div className="mt-4 text-center">
              <button
                onClick={() => setCurrentPage('login')}
                className="text-black hover:underline"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          </div>
        );
      }

      // Página de bienvenida (no autenticado)
      return (
        <div className="max-w-md mx-auto text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-900">Bienvenido a Urban Drive</h1>
          <p className="text-xl text-gray-700">Conecta con conductores en tiempo real</p>
          <div className="space-y-4">
            <button
              onClick={() => setCurrentPage('login')}
              className="w-full btn-primary"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setCurrentPage('register')}
              className="w-full btn-primary"
            >
              Crear Cuenta
            </button>
          </div>
        </div>
      );
    }

    // Usuario autenticado - renderizar contenido según la página
    switch (currentPage) {
      case 'home':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">¡Bienvenido!</h2>
            
            {/* Modo de Operación */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">🚀 Modo de Operación</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="p-3 border-2 border-blue-500 bg-blue-50 rounded-lg text-center"
                >
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-sm font-medium text-blue-800">Personal</div>
                  <div className="text-xs text-blue-600">Uso individual</div>
                </button>
                <button
                  className="p-3 border border-gray-300 bg-gray-50 rounded-lg text-center opacity-60"
                  disabled
                >
                  <div className="text-2xl mb-1">🏢</div>
                  <div className="text-sm font-medium text-gray-600">Empresarial</div>
                  <div className="text-xs text-gray-500">Próximamente</div>
                </button>
              </div>
            </div>

            {/* Switch de Visibilidad */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isVisible ? <Eye size={20} className="text-green-600" /> : <EyeOff size={20} className="text-red-600" />}
                  <span className="font-medium text-gray-900">
                    Estado: {isVisible ? 'Visible' : 'Invisible'}
                  </span>
                </div>
                <button
                  onClick={toggleVisibility}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isVisible ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {isVisible 
                  ? 'Tus contactos pueden verte en el mapa' 
                  : 'Estás oculto para todos tus contactos'
                }
              </p>
            </div>

            {/* Información de Ubicación */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">📍 Tu Ubicación</h4>
                <button
                  onClick={getLocation}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Actualizar
                </button>
              </div>
              
              {userLocation ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      userLocation.method === 'GPS/WiFi' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></span>
                    <span className="text-sm font-medium">
                      {userLocation.method === 'GPS/WiFi' ? 'GPS/WiFi' : 'IP Aproximada'}
                    </span>
                    <span className="text-xs text-gray-500">
                      (±{(userLocation.accuracy || 0) < 100 ? Math.round(userLocation.accuracy || 0) + 'm' : Math.round((userLocation.accuracy || 0)/1000) + 'km'})
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <p>Lat: {(userLocation.latitude || userLocation.lat).toFixed(6)}</p>
                    <p>Lng: {(userLocation.longitude || userLocation.lng).toFixed(6)}</p>
                    {userLocation.city && <p>📍 {userLocation.city}, {userLocation.country}</p>}
                    <p>🕒 {userLocation.timestamp ? new Date(userLocation.timestamp).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              ) : locationError ? (
                <div className="flex items-center space-x-2 text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-sm">{locationError}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  <span className="text-sm">Obteniendo ubicación...</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Usuario:</strong> {user?.displayName || user?.email}
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong> {user?.email}
              </p>
            </div>
          </div>
        );

      case 'map':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Mapa</h2>
            <div className="bg-white p-4 rounded-lg">
              <MapComponent 
                userLocation={userLocation} 
                contacts={contacts}
                user={user}
              />
            </div>
            
            {userLocation && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">📍 Tu ubicación actual</h3>
                <p className="text-sm text-blue-700">
                  Lat: {(userLocation.latitude || userLocation.lat).toFixed(6)}, Lng: {(userLocation.longitude || userLocation.lng).toFixed(6)}
                </p>
                <p className="text-sm text-blue-700">
                  Precisión: ±{(userLocation.accuracy || 0) < 100 ? Math.round(userLocation.accuracy || 0) + 'm' : Math.round((userLocation.accuracy || 0)/1000) + 'km'}
                </p>
                {userLocation.city && (
                  <p className="text-sm text-blue-700">📍 {userLocation.city}, {userLocation.country}</p>
                )}
              </div>
            )}
            
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">👥 Contactos visibles: {contacts.filter(c => c.location).length}</h3>
              <div className="space-y-2">
                {contacts.filter(c => c.location).map(contact => (
                  <div key={contact.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-green-800">{contact.displayName}</span>
                      <span className="text-xs text-green-600 ml-2">
                        ({contact.userType === 'driver' ? 'Conductor' : 'Usuario'})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setCurrentPage('messages');
                      }}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Mensaje
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'contacts':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Contactos</h2>
              <button
                onClick={shareInvitation}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Share size={18} />
                <span>Invitar</span>
              </button>
            </div>
            
            {/* Sección de Invitaciones Rápidas */}
            {inviteLink && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">🚀 Enlace de Invitación Listo</h3>
                <div className="bg-white p-3 rounded-lg border mb-3">
                  <p className="text-xs text-gray-600 mb-1">Copia este enlace y envíalo:</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs bg-gray-50 p-2 rounded border break-all flex-1">{inviteLink}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(inviteLink)}
                      className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('¡Únete a Urban Drive! ' + inviteLink)}`, '_blank')}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <span>📱</span>
                    <span>WhatsApp</span>
                  </button>
                  
                  <button
                    onClick={() => window.open(`sms:?body=${encodeURIComponent('¡Únete a Urban Drive! ' + inviteLink)}`, '_blank')}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>💬</span>
                    <span>SMS</span>
                  </button>
                </div>
              </div>
            )}

            {/* Buscar Contactos */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">📱 Buscar Contacto</h3>
              <div className="flex space-x-2">
                <input
                  type="tel"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="+57 300 123 4567"
                />
                <button
                  onClick={searchContact}
                  disabled={loading}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? <div className="spinner"></div> : 'Buscar'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Busca usuarios por su número de teléfono registrado
              </p>
            </div>

            {/* Lista de Contactos */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">👥 Mis Contactos ({contacts.length})</h3>
              <div className="space-y-2">
                {contacts.length > 0 ? (
                  contacts.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {contact.displayName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{contact.displayName}</h4>
                          <p className="text-sm text-gray-600">{contact.phone}</p>
                          <p className="text-xs text-gray-500">
                            {contact.userType === 'driver' ? '🚗 Conductor' : '👤 Usuario'}
                            {contact.isVisible && contact.location ? ' • 🟢 En línea' : ' • ⚫ Desconectado'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setCurrentPage('messages');
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Mensaje
                        </button>
                        {contact.location && (
                          <button
                            onClick={() => {
                              setCurrentPage('map');
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Ver Mapa
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">No tienes contactos aún</p>
                    <p className="text-sm text-gray-500">Usa el buscador arriba o invita amigos con el botón "Invitar"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="h-full flex flex-col">
            {selectedContact ? (
              // Chat activo
              <div className="flex flex-col h-full">
                {/* Header del chat */}
                <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedContact(null)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X size={20} />
                    </button>
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedContact.displayName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedContact.displayName}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedContact.isVisible && selectedContact.location ? '🟢 En línea' : '⚫ Desconectado'}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-600 hover:text-gray-900">
                    <User size={20} />
                  </button>
                </div>

                {/* Área de mensajes */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                  <div className="space-y-3">
                    {messages.length > 0 ? (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              msg.senderId === user?.id
                                ? 'bg-black text-white rounded-br-none'
                                : 'bg-white text-gray-900 border rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${
                              msg.senderId === user?.id ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-2">No hay mensajes aún</p>
                        <p className="text-sm text-gray-400">Inicia una conversación enviando un mensaje</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input de mensaje */}
                <div className="bg-white border-t border-gray-200 p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Escribe un mensaje..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Lista de chats
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Mensajes</h2>
                
                <div className="bg-white rounded-lg border divide-y">
                  {contacts.length > 0 ? (
                    contacts.map(contact => (
                      <div
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-700">
                              {contact.displayName?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 truncate">
                                {contact.displayName}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {contact.isVisible && contact.location ? '🟢' : '⚫'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{contact.phone}</p>
                            <p className="text-xs text-gray-500">
                              {contact.userType === 'driver' ? '🚗 Conductor' : '👤 Usuario'}
                            </p>
                          </div>
                          <div className="text-gray-400">
                            <MessageSquare size={16} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 mb-2">No tienes contactos para enviar mensajes</p>
                      <p className="text-sm text-gray-500">Ve a "Contactos" para agregar amigos</p>
                      <button
                        onClick={() => setCurrentPage('contacts')}
                        className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                      >
                        Ir a Contactos
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                <User size={18} />
                <span>{isEditingProfile ? 'Cancelar' : 'Editar'}</span>
              </button>
            </div>

            {/* Foto de perfil */}
            <div className="bg-white p-6 rounded-lg border text-center">
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{user?.displayName || 'Sin nombre'}</h3>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                {user?.userType === 'driver' ? '🚗 Conductor' : '👤 Usuario'}
              </p>
              <button className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                📷 Cambiar foto (Próximamente)
              </button>
            </div>

            {/* Información del perfil */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
              
              {isEditingProfile ? (
                // Modo edición
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Como quieres que te vean"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      rows={3}
                      placeholder="Cuéntanos algo sobre ti..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de usuario</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setProfileData({...profileData, userType: 'user'})}
                        className={`p-3 border rounded-lg text-center transition-all ${
                          profileData.userType === 'user' 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <User size={20} className="mx-auto mb-1" />
                        <span className="text-sm font-medium">Usuario</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileData({...profileData, userType: 'driver'})}
                        className={`p-3 border rounded-lg text-center transition-all ${
                          profileData.userType === 'driver' 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <MapPin size={20} className="mx-auto mb-1" />
                        <span className="text-sm font-medium">Conductor</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={saveProfile}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? <div className="spinner mx-auto"></div> : 'Guardar Cambios'}
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo vista
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                      <p className="text-gray-900 py-2">{user?.displayName || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre de usuario</label>
                      <p className="text-gray-900 py-2">@{user?.username || 'sin-usuario'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900 py-2">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <p className="text-gray-900 py-2">{user?.phone || 'No especificado'}</p>
                    </div>
                  </div>
                  
                  {user?.bio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Biografía</label>
                      <p className="text-gray-900 py-2">{user.bio}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de cuenta</label>
                    <p className="text-gray-900 py-2">
                      {user?.userType === 'driver' ? '🚗 Conductor' : '👤 Usuario'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Configuraciones adicionales */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Cuenta</h3>
              <div className="space-y-3">
                <button
                  onClick={changePassword}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔒</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Cambiar contraseña</p>
                      <p className="text-sm text-gray-600">Actualiza tu contraseña de acceso</p>
                    </div>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
                
                <button
                  onClick={() => setCurrentPage('home')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👁️</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Privacidad</p>
                      <p className="text-sm text-gray-600">Controla tu visibilidad</p>
                    </div>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔔</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Notificaciones</p>
                      <p className="text-sm text-gray-600">Configura alertas y avisos</p>
                    </div>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{contacts.length}</p>
                  <p className="text-sm text-gray-600">Contactos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {user?.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : '0'}
                  </p>
                  <p className="text-sm text-gray-600">Días activo</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {isVisible ? '🟢' : '🔴'}
                  </p>
                  <p className="text-sm text-gray-600">Estado</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Página no encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-black bg-opacity-40 relative">
      {/* Header */}
      <header className="bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/assets/UrbanDrive.png" alt="Urban Drive" className="w-10 h-10 rounded-lg object-contain" />
              <h1 className="text-xl font-bold text-gray-900">Urban Drive</h1>
            </div>
            
            <nav className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {navigation.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setCurrentPage(id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === id
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                  <button
                    onClick={handleAPKAction}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Compartir Urban Drive"
                  >
                    <Share size={18} />
                    <span className="hidden sm:inline">Compartir</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage('login')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 'login'
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => setCurrentPage('register')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 'register'
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortableInterface;