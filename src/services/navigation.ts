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

  constructor() {
    this.mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
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
    if (!this.state.voiceEnabled || !('speechSynthesis' in window)) return;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);

      // Timeout por seguridad
      setTimeout(() => resolve(), 5000);
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
}

// Instancia singleton
export const navigationService = new NavigationService();
export default navigationService;