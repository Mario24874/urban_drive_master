/**
 * Servicio de navegación GPS estilo Uber
 * Proporciona navegación turn-by-turn con instrucciones de voz
 */

export interface NavigationRoute {
  distance: number;
  duration: number;
  geometry: number[][];
  steps: NavigationStep[];
}

export interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    bearing_after: number;
    bearing_before: number;
    location: [number, number];
  };
  geometry: number[][];
}

export interface NavigationState {
  isNavigating: boolean;
  currentRoute: NavigationRoute | null;
  currentStepIndex: number;
  remainingDistance: number;
  remainingTime: number;
  nextInstruction: string;
  userLocation: [number, number] | null;
  destination: [number, number] | null;
  voiceEnabled: boolean;
}

class NavigationService {
  private state: NavigationState = {
    isNavigating: false,
    currentRoute: null,
    currentStepIndex: 0,
    remainingDistance: 0,
    remainingTime: 0,
    nextInstruction: '',
    userLocation: null,
    destination: null,
    voiceEnabled: true
  };

  private watchId: number | null = null;
  private listeners: ((state: NavigationState) => void)[] = [];
  private mapboxToken: string = '';
  private voicesLoaded: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
    this.initializeVoices();
  }

  /**
   * Inicializar voces de síntesis de voz
   */
  private initializeVoices(): void {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis API no soportada en este navegador');
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();

      if (voices.length === 0) return;

      // Buscar voz en español (prioridad: es-ES, es-MX, es-US, cualquier es-*)
      this.selectedVoice =
        voices.find(v => v.lang === 'es-ES') ||
        voices.find(v => v.lang === 'es-MX') ||
        voices.find(v => v.lang === 'es-US') ||
        voices.find(v => v.lang.startsWith('es-')) ||
        voices.find(v => v.lang.startsWith('es')) ||
        voices[0]; // Fallback a la primera voz disponible

      this.voicesLoaded = true;

      console.log('Voice system initialized:', {
        totalVoices: voices.length,
        selectedVoice: this.selectedVoice?.name,
        selectedLang: this.selectedVoice?.lang
      });
    };

    // Cargar voces inmediatamente
    loadVoices();

    // Escuchar evento de cambio de voces (necesario en algunos navegadores)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Intentar de nuevo después de un delay (fallback para Chrome en Android)
    setTimeout(loadVoices, 100);
  }

  /**
   * Iniciar navegación hacia un destino
   */
  async startNavigation(destination: [number, number], contactName?: string): Promise<boolean> {
    try {
      // Obtener ubicación actual
      const position = await this.getCurrentPosition();
      const origin: [number, number] = [position.coords.longitude, position.coords.latitude];

      // Calcular ruta
      const route = await this.calculateRoute(origin, destination);
      if (!route) {
        throw new Error('No se pudo calcular la ruta');
      }

      // Configurar estado de navegación
      this.state = {
        ...this.state,
        isNavigating: true,
        currentRoute: route,
        currentStepIndex: 0,
        remainingDistance: route.distance,
        remainingTime: route.duration,
        nextInstruction: route.steps[0]?.instruction || '',
        userLocation: origin,
        destination,
        voiceEnabled: true
      };

      // Iniciar seguimiento de GPS
      this.startLocationTracking();

      // Anunciar inicio de navegación
      if (contactName) {
        await this.speak(`Iniciando navegación hacia ${contactName}. ${this.state.nextInstruction}`);
      } else {
        await this.speak(`Iniciando navegación. ${this.state.nextInstruction}`);
      }

      this.notifyListeners();
      return true;

    } catch (error) {
      console.error('Error starting navigation:', error);
      await this.speak('Error al iniciar la navegación');
      return false;
    }
  }

  /**
   * Detener navegación
   */
  stopNavigation(): void {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // Cancelar cualquier síntesis de voz en progreso
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.state = {
      ...this.state,
      isNavigating: false,
      currentRoute: null,
      currentStepIndex: 0,
      remainingDistance: 0,
      remainingTime: 0,
      nextInstruction: '',
      destination: null
    };

    this.speak('Navegación finalizada');
    this.notifyListeners();
  }

  /**
   * Calcular ruta usando Mapbox Directions API
   */
  private async calculateRoute(origin: [number, number], destination: [number, number]): Promise<NavigationRoute | null> {
    if (!this.mapboxToken) {
      console.error('Mapbox token not configured');
      return null;
    }

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?` +
        `steps=true&geometries=geojson&access_token=${this.mapboxToken}&` +
        `voice_instructions=true&banner_instructions=true&language=es`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry.coordinates,
          steps: route.legs[0].steps.map((step: any) => ({
            instruction: step.maneuver.instruction || this.translateInstruction(step.maneuver),
            distance: step.distance,
            duration: step.duration,
            maneuver: step.maneuver,
            geometry: step.geometry.coordinates
          }))
        };
      }

      return null;
    } catch (error) {
      console.error('Error calculating route:', error);
      return null;
    }
  }

  /**
   * Traducir instrucciones de navegación al español
   */
  private translateInstruction(maneuver: any): string {
    const type = maneuver.type;
    const modifier = maneuver.modifier;

    const instructions: Record<string, string> = {
      'turn': modifier === 'right' ? 'Gira a la derecha' : 'Gira a la izquierda',
      'new name': 'Continúa por',
      'depart': 'Sal hacia',
      'arrive': 'Has llegado a tu destino',
      'merge': 'Incorpórate',
      'on ramp': 'Toma la rampa de entrada',
      'off ramp': 'Toma la salida',
      'fork': modifier === 'right' ? 'Mantente a la derecha' : 'Mantente a la izquierda',
      'continue': 'Continúa recto',
      'roundabout': 'En la rotonda, toma la salida',
      'rotary': 'En la rotonda, toma la salida',
      'roundabout turn': 'En la rotonda, gira',
      'notification': 'Continúa por la ruta actual',
      'exit roundabout': 'Sal de la rotonda'
    };

    return instructions[type] || 'Continúa por la ruta';
  }

  /**
   * Iniciar seguimiento de ubicación GPS
   */
  private startLocationTracking(): void {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handleLocationUpdate(position),
      (error) => this.handleLocationError(error),
      options
    );
  }

  /**
   * Manejar actualización de ubicación
   */
  private handleLocationUpdate(position: GeolocationPosition): void {
    const newLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
    this.state.userLocation = newLocation;

    if (!this.state.currentRoute || !this.state.isNavigating) return;

    // Verificar si hemos llegado al destino
    if (this.state.destination) {
      const distanceToDestination = this.calculateDistance(newLocation, this.state.destination);
      if (distanceToDestination < 50) { // 50 metros
        this.arrivedAtDestination();
        return;
      }
    }

    // Verificar progreso en la ruta actual
    this.updateNavigationProgress(newLocation);
    this.notifyListeners();
  }

  /**
   * Actualizar progreso de navegación
   */
  private updateNavigationProgress(currentLocation: [number, number]): void {
    if (!this.state.currentRoute) return;

    const currentStep = this.state.currentRoute.steps[this.state.currentStepIndex];
    if (!currentStep) return;

    // Calcular distancia al siguiente maneuver
    const distanceToManeuver = this.calculateDistance(
      currentLocation, 
      currentStep.maneuver.location
    );

    // Si estamos cerca del siguiente paso, avanzar
    if (distanceToManeuver < 30) { // 30 metros
      this.advanceToNextStep();
    }

    // Anunciar instrucción si estamos cerca
    if (distanceToManeuver < 100 && distanceToManeuver > 80) { // Entre 80-100m
      this.speak(currentStep.instruction);
    }
  }

  /**
   * Avanzar al siguiente paso de navegación
   */
  private advanceToNextStep(): void {
    if (!this.state.currentRoute) return;

    this.state.currentStepIndex++;
    
    if (this.state.currentStepIndex >= this.state.currentRoute.steps.length) {
      // Llegamos al final de la ruta
      this.arrivedAtDestination();
      return;
    }

    // Actualizar próxima instrucción
    const nextStep = this.state.currentRoute.steps[this.state.currentStepIndex];
    this.state.nextInstruction = nextStep.instruction;

    // Anunciar nueva instrucción
    this.speak(nextStep.instruction);
  }

  /**
   * Manejar llegada al destino
   */
  private arrivedAtDestination(): void {
    this.speak('Has llegado a tu destino');
    this.stopNavigation();
  }

  /**
   * Calcular distancia entre dos puntos (en metros)
   */
  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = point1[1] * Math.PI / 180;
    const φ2 = point2[1] * Math.PI / 180;
    const Δφ = (point2[1] - point1[1]) * Math.PI / 180;
    const Δλ = (point2[0] - point1[0]) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Síntesis de voz para instrucciones
   */
  private async speak(text: string): Promise<void> {
    if (!this.state.voiceEnabled || !('speechSynthesis' in window)) {
      console.log('Voice disabled or not supported');
      return;
    }

    // Si no se han cargado las voces todavía, esperar un momento
    if (!this.voicesLoaded) {
      console.log('Voices not loaded yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return new Promise((resolve) => {
      try {
        // Cancelar cualquier síntesis en progreso
        window.speechSynthesis.cancel();

        // Pequeña pausa para asegurar que se canceló
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);

          // Configurar voz seleccionada
          if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
            utterance.lang = this.selectedVoice.lang;
          } else {
            utterance.lang = 'es-ES';
          }

          // Configuración óptima para navegación
          utterance.rate = 0.95; // Velocidad ligeramente más lenta para claridad
          utterance.pitch = 1.0; // Tono normal
          utterance.volume = 1.0; // Volumen máximo

          let resolved = false;

          utterance.onstart = () => {
            console.log('Speech started:', text);
          };

          utterance.onend = () => {
            console.log('Speech ended successfully');
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };

          utterance.onerror = (event) => {
            console.error('Speech error:', event.error);
            if (!resolved) {
              resolved = true;
              // Intentar reiniciar speechSynthesis si falla
              window.speechSynthesis.cancel();
              resolve();
            }
          };

          // Hablar
          window.speechSynthesis.speak(utterance);
          console.log('Speech queued:', {
            text,
            voice: this.selectedVoice?.name,
            lang: utterance.lang
          });

          // Timeout de seguridad (aumentado para instrucciones largas)
          setTimeout(() => {
            if (!resolved) {
              console.warn('Speech timeout');
              window.speechSynthesis.cancel();
              resolved = true;
              resolve();
            }
          }, 8000);
        }, 50);

      } catch (error) {
        console.error('Error in speak():', error);
        resolve();
      }
    });
  }

  /**
   * Obtener posición actual
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  }

  /**
   * Manejar errores de geolocalización
   */
  private handleLocationError(error: GeolocationPositionError): void {
    console.error('Location error:', error);
    
    const messages: Record<number, string> = {
      1: 'Permiso de ubicación denegado',
      2: 'Ubicación no disponible',
      3: 'Tiempo de espera agotado'
    };

    const message = messages[error.code] || 'Error de ubicación';
    this.speak(message);
  }

  /**
   * Agregar listener para cambios de estado
   */
  addListener(callback: (state: NavigationState) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remover listener
   */
  removeListener(callback: (state: NavigationState) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * Notificar a todos los listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.state));
  }

  /**
   * Obtener estado actual
   */
  getState(): NavigationState {
    return { ...this.state };
  }

  /**
   * Alternar voz
   */
  toggleVoice(enabled: boolean): void {
    this.state.voiceEnabled = enabled;
    this.notifyListeners();
  }

  /**
   * Repetir última instrucción
   */
  repeatInstruction(): void {
    if (this.state.nextInstruction) {
      this.speak(this.state.nextInstruction);
    }
  }

  /**
   * Probar síntesis de voz (útil para debugging)
   */
  testVoice(): void {
    this.speak('Sistema de navegación por voz activo. Todo funciona correctamente.');
  }

  /**
   * Obtener información de voces disponibles
   */
  getVoiceInfo(): { voicesLoaded: boolean; selectedVoice: string | null; totalVoices: number } {
    const voices = 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : [];
    return {
      voicesLoaded: this.voicesLoaded,
      selectedVoice: this.selectedVoice?.name || null,
      totalVoices: voices.length
    };
  }
}

// Instancia singleton
export const navigationService = new NavigationService();
export default navigationService;