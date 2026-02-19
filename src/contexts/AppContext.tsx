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
  },
  es: {
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
