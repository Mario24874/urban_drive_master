import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
type Lang = 'en' | 'es';

interface AppContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Navigation tabs
    home: 'Home',
    map: 'Map',
    contacts: 'Contacts',
    messages: 'Messages',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Log out',
    language: 'Language',
    appearance: 'Appearance',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    addContact: 'Add Contact',
    sendInvitation: 'Send',
    cancel: 'Cancel',
    accept: 'Accept',
    reject: 'Decline',
    noContacts: 'No contacts yet',
    noInvitations: 'No invitations yet',
    checkUpdates: 'Check for updates',
    appVersion: 'App version',
    invitationSent: 'Invitation sent!',
    alreadyInContacts: 'Already in contacts',
    duplicateInvitation: 'Invitation already pending',
    cancelInvitation: 'Cancel invitation',
    account: 'Account',
    app: 'App',
    chat: 'Chat',

    // Home tab (PortableInterfaceNew)
    welcome: 'Welcome',
    subtitleDriver: 'Start your day as a driver',
    subtitleUser: 'Find available drivers near you',
    location: 'Location',
    status: 'Status',
    visible: 'Visible',
    hidden: 'Hidden',
    quickActions: 'Quick Actions',
    refreshLocation: 'Refresh Location',
    viewMap: 'View Map',
    browseContacts: 'Browse Contacts',
    editProfile: 'Edit Profile',
    accuracy: 'Accuracy',
    alreadyHaveAccount: 'Already have an account? Sign in',
    dontHaveAccount: "Don't have an account? Sign up",

    // ProfileEditor
    tapAvatarToChange: 'Tap avatar to change photo',
    maxPhotoSize: 'Max 2 MB · compressed to 200×200',
    displayName: 'Display Name',
    usernameOptional: 'Username (optional)',
    usernameDesc: 'Your unique username for the platform',
    phoneOptional: 'Phone (optional)',
    bioOptional: 'Bio (optional)',
    bioMaxChars: 'Max 160 characters',
    accountType: 'Account Type',
    typeUser: 'User',
    typeDriver: 'Driver',
    visibility: 'Visibility',
    visibilityDesc: 'Make your profile visible to other users',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    photoUpdated: 'Photo updated successfully',
    photoError: 'Error uploading photo',
    profileUpdated: 'Profile updated successfully',
    profileError: 'Failed to update profile',
    selectImage: 'Select an image file',
    imageTooLarge: 'Image must be less than 2 MB',

    // ContactList
    searchContacts: 'Search contacts…',
    enterEmailOrPhone: 'Enter the email or phone number of the person you want to add.',
    emailOrPhone: 'Email or phone number',
    invitationsTab: 'Invitations',
    sentInvitations: 'Sent',
    receivedInvitations: 'Received',
    noContactsSearch: 'No contacts match your search',
    addFirstContact: '+ Add your first contact',
    removeContact: 'Remove contact?',
    removeContactDesc: 'will be removed from your contacts and you\'ll be removed from theirs. You can invite them again later.',
    remove: 'Remove',
    sendMessage: 'Send message',
    navigateHere: 'Navigate here',
    hideLocation: 'Hide my location',
    showLocation: 'Show my location',
    contactCount: 'contact',
    contactCountPlural: 'contacts',
    inMap: 'In map',

    // NavigationInterface
    navigating: 'Navigating',
    toDestination: 'Toward: ',
    distanceLabel: 'Distance',
    timeLabel: 'Time',
    endNavigation: 'End',
    calculating: 'Calculating route...',
    searchAddress: 'Search address or place...',
    startNavigation: 'Start Navigation',
    changeDestination: 'Change destination',
    chooseContact: 'or choose a contact',
    noContactsGPS: 'No contact has an active location.',
    noContactsGPSHint: 'Search an address above or wait for a contact to share their GPS.',
    waitingGPS: 'Waiting for GPS signal...',
    gpsActive: 'GPS Active',
    muteVoice: 'Disable voice',
    unmuteVoice: 'Enable voice',
    repeatInstruction: 'Repeat instruction',

    // GPSMapComponent
    gpsInactive: 'GPS Inactive',
    driversLabel: 'Drivers',
    usersLabel: 'Users',
    openGpsNav: 'Open GPS navigation',
    active: 'Active',
    inactive: 'Inactive',

    // ChatInterface
    selectContactToChat: 'Select a contact to start chatting',
    noMessagesYet: 'No messages yet',
    sendFirstMessage: 'Send the first message to start the conversation',
    searchConversation: 'Search in conversation...',
    typeMessage: 'Type a message...',
    online: 'Online',
    driverBadge: '🚗 Driver',
    userBadge: '👤 User',
    search: 'Search',

    // PWAUpdateNotification
    newVersion: '🆕 New version available',
    updateDescription: 'A new Urban Drive update is ready to install. Do you want to apply it now?',
    updateDescriptionLater: 'If you choose Later, the update will stay pending and you can apply it from Settings → Check for updates.',
    updateLater: 'Later',
    updateNow: 'Update now',

    // SettingsSheet
    updateAvailable: 'New version available',
    update: 'Update',
    lookingForUpdates: 'Looking for updates…',
    alreadyUpToDate: '✓ You already have the latest version',

    // Subscription plan display
    planFree: 'Free Plan',
    planBronce: 'Bronce',
    planPlata: 'Plata',
    planOro: 'Oro',
    planActive: 'Active plan',
    planChangePlan: 'Change plan',
    planUpgrade: 'Upgrade',
    planContactsLimit: 'contacts',

    // Contact limit
    contactLimitTitle: 'Contact Limit Reached',
    contactLimitDesc: 'You have reached the limit of {max} contacts on the {plan} plan. Upgrade to add more.',
    upgradePlan: 'Upgrade Plan',
    // Portal
    manageSubscription: 'Manage Subscription',
    openingPortal: 'Opening portal...',
    portalError: 'Could not open the subscription portal. Please try again.',
    // Post-payment success
    subscriptionActivated: 'Subscription activated!',
    subscriptionActivatedDesc: 'Welcome to the {plan} plan. Enjoy your new features.',
    subscriptionCanceled: 'Checkout canceled',
    // Contacts count with limit
    contactsOf: '{n} of {max}',

    // Enterprise — Company & Fleet
    myCompany: 'My Company',
    setupCompany: 'Set Up Company',
    manageFleet: 'Manage Fleet',
    manageDrivers: 'Manage Drivers',
    companyName: 'Company Name',
    legalName: 'Legal Name',
    taxId: 'Tax ID / NIT',
    transportModalities: 'Transport Modalities',
    noCompanyYet: 'No company registered yet',
    companyCreated: 'Company created!',
    companyUpdated: 'Company updated',
    addVehicle: 'Add Vehicle',
    editVehicle: 'Edit Vehicle',
    plate: 'Plate',
    makeModel: 'Make / Model',
    vehicleYear: 'Year',
    vehicleCategory: 'Category',
    vehicleFuelType: 'Fuel Type',
    passengerCapacity: 'Passenger Capacity',
    vehicleAdded: 'Vehicle added',
    vehicleUpdated: 'Vehicle updated',
    vehicleRemoved: 'Vehicle removed',
    fleetEmpty: 'No vehicles yet. Add your first vehicle.',
    addDriver: 'Add Driver',
    editDriver: 'Edit Driver',
    licenseNumber: 'License Number',
    licenseCategory: 'License Category',
    assignedVehicle: 'Assigned Vehicle',
    noVehicleAssigned: 'No vehicle assigned',
    driverAdded: 'Driver added',
    driverRemoved: 'Driver removed',
    driversEmpty: 'No drivers yet. Add your first driver.',
    companySetupTitle: 'Set Up Your Company',
    stepOf: 'Step {step} of {total}',
    enterpriseOnlyBronce: 'Available from Bronce plan',
    deleteVehicle: 'Delete Vehicle',
    deleteDriver: 'Delete Driver',
    confirmDelete: 'Are you sure? This action cannot be undone.',
    contactName: 'Contact Name',
    contactEmail: 'Contact Email',
    contactPhone: 'Contact Phone',
    description: 'Description',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    make: 'Make',
    model: 'Model',
  },
  es: {
    // Navigation tabs
    home: 'Inicio',
    map: 'Mapa',
    contacts: 'Contactos',
    messages: 'Mensajes',
    profile: 'Perfil',
    settings: 'Ajustes',
    logout: 'Cerrar sesión',
    language: 'Idioma',
    appearance: 'Apariencia',
    darkMode: 'Modo oscuro',
    lightMode: 'Modo claro',
    addContact: 'Añadir contacto',
    sendInvitation: 'Enviar',
    cancel: 'Cancelar',
    accept: 'Aceptar',
    reject: 'Rechazar',
    noContacts: 'Sin contactos aún',
    noInvitations: 'Sin invitaciones aún',
    checkUpdates: 'Buscar actualizaciones',
    appVersion: 'Versión de la app',
    invitationSent: '¡Invitación enviada!',
    alreadyInContacts: 'Ya está en tus contactos',
    duplicateInvitation: 'Invitación ya pendiente',
    cancelInvitation: 'Cancelar invitación',
    account: 'Cuenta',
    app: 'App',
    chat: 'Chat',

    // Home tab (PortableInterfaceNew)
    welcome: 'Bienvenido/a',
    subtitleDriver: 'Comienza tu jornada como conductor',
    subtitleUser: 'Encuentra conductores disponibles cerca de ti',
    location: 'Ubicación',
    status: 'Estado',
    visible: 'Visible',
    hidden: 'Oculto',
    quickActions: 'Acciones rápidas',
    refreshLocation: 'Actualizar ubicación',
    viewMap: 'Ver mapa',
    browseContacts: 'Ver contactos',
    editProfile: 'Editar perfil',
    accuracy: 'Precisión',
    alreadyHaveAccount: '¿Ya tienes cuenta? Inicia sesión',
    dontHaveAccount: '¿No tienes cuenta? Regístrate',

    // ProfileEditor
    tapAvatarToChange: 'Toca el avatar para cambiar foto',
    maxPhotoSize: 'Máx 2 MB · se comprime a 200×200',
    displayName: 'Nombre',
    usernameOptional: 'Nombre de usuario (opcional)',
    usernameDesc: 'Tu nombre de usuario único en la plataforma',
    phoneOptional: 'Teléfono (opcional)',
    bioOptional: 'Biografía (opcional)',
    bioMaxChars: 'Máx 160 caracteres',
    accountType: 'Tipo de cuenta',
    typeUser: 'Usuario',
    typeDriver: 'Conductor',
    visibility: 'Visibilidad',
    visibilityDesc: 'Haz tu perfil visible para otros usuarios',
    saving: 'Guardando...',
    saveChanges: 'Guardar cambios',
    photoUpdated: 'Foto actualizada correctamente',
    photoError: 'Error al subir la foto',
    profileUpdated: 'Perfil actualizado correctamente',
    profileError: 'Error al actualizar el perfil',
    selectImage: 'Selecciona un archivo de imagen',
    imageTooLarge: 'La imagen debe ser menor a 2 MB',

    // ContactList
    searchContacts: 'Buscar contactos…',
    enterEmailOrPhone: 'Ingresa el email o número de teléfono de la persona que quieres agregar.',
    emailOrPhone: 'Email o número de teléfono',
    invitationsTab: 'Invitaciones',
    sentInvitations: 'Enviadas',
    receivedInvitations: 'Recibidas',
    noContactsSearch: 'Ningún contacto coincide con tu búsqueda',
    addFirstContact: '+ Añade tu primer contacto',
    removeContact: '¿Eliminar contacto?',
    removeContactDesc: 'será eliminado de tus contactos y tú serás eliminado de los suyos. Puedes invitarlo de nuevo más tarde.',
    remove: 'Eliminar',
    sendMessage: 'Enviar mensaje',
    navigateHere: 'Navegar aquí',
    hideLocation: 'Ocultar mi ubicación',
    showLocation: 'Mostrar mi ubicación',
    contactCount: 'contacto',
    contactCountPlural: 'contactos',
    inMap: 'En mapa',

    // NavigationInterface
    navigating: 'Navegando',
    toDestination: 'Hacia: ',
    distanceLabel: 'Distancia',
    timeLabel: 'Tiempo',
    endNavigation: 'Finalizar',
    calculating: 'Calculando ruta...',
    searchAddress: 'Buscar dirección o lugar...',
    startNavigation: 'Iniciar Navegación',
    changeDestination: 'Cambiar destino',
    chooseContact: 'o elige un contacto',
    noContactsGPS: 'Ningún contacto tiene ubicación activa.',
    noContactsGPSHint: 'Busca una dirección arriba o espera a que un contacto comparta su GPS.',
    waitingGPS: 'Esperando señal GPS...',
    gpsActive: 'GPS Activo',
    muteVoice: 'Desactivar voz',
    unmuteVoice: 'Activar voz',
    repeatInstruction: 'Repetir instrucción',

    // GPSMapComponent
    gpsInactive: 'GPS Inactivo',
    driversLabel: 'Conductores',
    usersLabel: 'Usuarios',
    openGpsNav: 'Abrir navegación GPS',
    active: 'Activo',
    inactive: 'Inactivo',

    // ChatInterface
    selectContactToChat: 'Selecciona un contacto para chatear',
    noMessagesYet: 'Sin mensajes aún',
    sendFirstMessage: 'Envía el primer mensaje para iniciar la conversación',
    searchConversation: 'Buscar en la conversación...',
    typeMessage: 'Escribe un mensaje...',
    online: 'En línea',
    driverBadge: '🚗 Conductor',
    userBadge: '👤 Usuario',
    search: 'Buscar',

    // PWAUpdateNotification
    newVersion: '🆕 Nueva versión disponible',
    updateDescription: 'Hay una actualización de Urban Drive lista para instalarse. ¿Quieres aplicarla ahora?',
    updateDescriptionLater: 'Si eliges Más tarde, la actualización quedará pendiente y podrás aplicarla desde Ajustes → Buscar actualizaciones.',
    updateLater: 'Más tarde',
    updateNow: 'Actualizar ahora',

    // SettingsSheet
    updateAvailable: 'Nueva versión disponible',
    update: 'Actualizar',
    lookingForUpdates: 'Buscando actualizaciones…',
    alreadyUpToDate: '✓ Ya tienes la última versión',

    // Subscription plan display
    planFree: 'Plan Gratuito',
    planBronce: 'Bronce',
    planPlata: 'Plata',
    planOro: 'Oro',
    planActive: 'Plan activo',
    planChangePlan: 'Cambiar plan',
    planUpgrade: 'Mejorar plan',
    planContactsLimit: 'contactos',

    // Contact limit
    contactLimitTitle: 'Límite de contactos alcanzado',
    contactLimitDesc: 'Has alcanzado el límite de {max} contactos del plan {plan}. Actualiza tu plan para agregar más.',
    upgradePlan: 'Actualizar plan',
    // Portal
    manageSubscription: 'Gestionar suscripción',
    openingPortal: 'Abriendo portal...',
    portalError: 'No se pudo abrir el portal de suscripción. Por favor intenta de nuevo.',
    // Post-payment success
    subscriptionActivated: '¡Suscripción activada!',
    subscriptionActivatedDesc: 'Bienvenido al plan {plan}. Disfruta tus nuevas funciones.',
    subscriptionCanceled: 'Pago cancelado',
    // Contacts count with limit
    contactsOf: '{n} de {max}',

    // Enterprise — Empresa y Flota
    myCompany: 'Mi Empresa',
    setupCompany: 'Configurar Empresa',
    manageFleet: 'Gestionar Flota',
    manageDrivers: 'Gestionar Conductores',
    companyName: 'Nombre de la Empresa',
    legalName: 'Razón Social',
    taxId: 'NIT / RUT',
    transportModalities: 'Modalidades de Transporte',
    noCompanyYet: 'Aún no tienes empresa registrada',
    companyCreated: '¡Empresa creada!',
    companyUpdated: 'Empresa actualizada',
    addVehicle: 'Agregar Vehículo',
    editVehicle: 'Editar Vehículo',
    plate: 'Placa',
    makeModel: 'Marca / Modelo',
    vehicleYear: 'Año',
    vehicleCategory: 'Categoría',
    vehicleFuelType: 'Combustible',
    passengerCapacity: 'Capacidad de Pasajeros',
    vehicleAdded: 'Vehículo agregado',
    vehicleUpdated: 'Vehículo actualizado',
    vehicleRemoved: 'Vehículo eliminado',
    fleetEmpty: 'Sin vehículos. Agrega tu primer vehículo.',
    addDriver: 'Agregar Conductor',
    editDriver: 'Editar Conductor',
    licenseNumber: 'Número de Licencia',
    licenseCategory: 'Categoría de Licencia',
    assignedVehicle: 'Vehículo Asignado',
    noVehicleAssigned: 'Sin vehículo asignado',
    driverAdded: 'Conductor agregado',
    driverRemoved: 'Conductor eliminado',
    driversEmpty: 'Sin conductores. Agrega tu primer conductor.',
    companySetupTitle: 'Configura Tu Empresa',
    stepOf: 'Paso {step} de {total}',
    enterpriseOnlyBronce: 'Disponible desde el plan Bronce',
    deleteVehicle: 'Eliminar Vehículo',
    deleteDriver: 'Eliminar Conductor',
    confirmDelete: '¿Estás seguro? Esta acción no se puede deshacer.',
    contactName: 'Nombre de Contacto',
    contactEmail: 'Email de Contacto',
    contactPhone: 'Teléfono de Contacto',
    description: 'Descripción',
    next: 'Siguiente',
    previous: 'Anterior',
    finish: 'Finalizar',
    make: 'Marca',
    model: 'Modelo',
  },
};

const AppContext = createContext<AppContextValue | null>(null);

function detectLang(): Lang {
  const stored = localStorage.getItem('lang') as Lang | null;
  if (stored === 'en' || stored === 'es') return stored;
  return navigator.language.startsWith('es') ? 'es' : 'en';
}

function detectTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored === 'dark' || stored === 'light') return stored;
  return 'dark';
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(detectTheme);
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const t = (key: string): string => {
    return translations[lang][key] ?? key;
  };

  return (
    <AppContext.Provider value={{ theme, setTheme, lang, setLang, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
