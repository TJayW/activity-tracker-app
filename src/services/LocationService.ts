// src/services/LocationService.ts
import * as Location from 'expo-location';
import {
  removeForegroundPath,
  setForegroundPath,
  getForegroundPath,
  removeBackgroundPath,
  setBackgroundPath,
  getBackgroundPath,
  setCurrentBackgroundActivityId,
  getCurrentBackgroundActivityId,
  removeCurrentBackgroundActivityId,
} from './AsyncStorageService';

class LocationService {
  // Mappa per gestire le sottoscrizioni per il tracciamento della posizione
  private foregroundLocationSubscriptions: { [key: number]: Location.LocationSubscription } = {};
  private backgroundLocationSubscriptions: { [key: number]: Location.LocationSubscription } = {};

  /** Avvia il tracciamento della posizione in foreground per una specifica attività */
  public async startForegroundLocationTracking(
    activityId: number,
    onUpdate: (coords: Location.LocationObjectCoords[]) => void
  ): Promise<void> {
    if (this.foregroundLocationSubscriptions[activityId]) {
      console.warn(`Il tracciamento posizione foreground per attività ${activityId} è già attivo.`);
      return;
    }
    try {
      // Resetta il percorso
      await removeForegroundPath(activityId);
      await setForegroundPath(activityId, []);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        async (location) => {
          try {
            const currentPath = await getForegroundPath(activityId);
            currentPath.push(location.coords);
            await setForegroundPath(activityId, currentPath);
            onUpdate([...currentPath]);
          } catch (err) {
            console.error(`Errore aggiornando percorso foreground per attività ${activityId}:`, err);
          }
        }
      );

      this.foregroundLocationSubscriptions[activityId] = subscription;
      console.log(`[Foreground] Tracciamento posizione avviato per attività ${activityId}`);
    } catch (err) {
      console.error(`Errore avviando il tracciamento posizione foreground per attività ${activityId}:`, err);
    }
  }

  /** Ferma il tracciamento della posizione in foreground e restituisce il percorso */
  public async stopForegroundLocationTracking(activityId: number): Promise<Location.LocationObjectCoords[]> {
    const subscription = this.foregroundLocationSubscriptions[activityId];
    if (subscription) {
      subscription.remove();
      delete this.foregroundLocationSubscriptions[activityId];
      console.log(`[Foreground] Tracciamento posizione fermato per attività ${activityId}`);
      try {
        const path = await getForegroundPath(activityId);
        await removeForegroundPath(activityId);
        return path;
      } catch (err) {
        console.error(`Errore recuperando percorso foreground per attività ${activityId}:`, err);
        return [];
      }
    } else {
      console.warn(`Il tracciamento foreground per attività ${activityId} non era attivo.`);
      return [];
    }
  }

  /** Avvia il tracciamento della posizione in background per una specifica attività */
  public async startBackgroundLocationTracking(activityId: number) {
    if (this.backgroundLocationSubscriptions[activityId]) {
      console.warn(`Il tracciamento della posizione in background per attività ${activityId} è già attivo.`);
      return;
    }
    try {
      // Salva l'activityId corrente per i task di background
      await setCurrentBackgroundActivityId(activityId);
      // Resetta il percorso
      await removeBackgroundPath(activityId);
      await setBackgroundPath(activityId, []);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        async (location) => {
          try {
            const currentPath = await getBackgroundPath(activityId);
            currentPath.push(location.coords);
            await setBackgroundPath(activityId, currentPath);
          } catch (err) {
            console.error(`Errore aggiornando percorso background per attività ${activityId}:`, err);
          }
        }
      );

      this.backgroundLocationSubscriptions[activityId] = subscription;
      console.log(`[Background] Tracciamento posizione avviato per attività ${activityId}`);
    } catch (err) {
      console.error(`Errore avviando il tracciamento posizione background per attività ${activityId}:`, err);
    }
  }

  /** Ferma il tracciamento della posizione in background e restituisce il percorso */
  public async stopBackgroundLocationTracking(activityId: number): Promise<Location.LocationObjectCoords[]> {
    const subscription = this.backgroundLocationSubscriptions[activityId];
    if (subscription) {
      subscription.remove();
      delete this.backgroundLocationSubscriptions[activityId];
      console.log(`[Background] Tracciamento posizione fermato per attività ${activityId}`);

      // Rimuove l'activityId corrente se corrisponde
      const storedActivityId = await getCurrentBackgroundActivityId();
      if (storedActivityId !== null && storedActivityId === activityId) {
        await removeCurrentBackgroundActivityId();
      }

      try {
        const path = await getBackgroundPath(activityId);
        await removeBackgroundPath(activityId);
        return path;
      } catch (err) {
        console.error(`Errore recuperando percorso background per attività ${activityId}:`, err);
        return [];
      }
    } else {
      console.warn(`Il tracciamento background per attività ${activityId} non era attivo.`);
      return [];
    }
  }

  /** Cleanup: ferma tutti i tracciamenti attivi */
  public async cleanup() {
    for (const activityId of Object.keys(this.foregroundLocationSubscriptions).map(Number)) {
      await this.stopForegroundLocationTracking(activityId);
    }
    for (const activityId of Object.keys(this.backgroundLocationSubscriptions).map(Number)) {
      await this.stopBackgroundLocationTracking(activityId);
    }
  }
}

export default LocationService;
