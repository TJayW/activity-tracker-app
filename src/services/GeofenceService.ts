// src/services/GeofenceService.ts
import * as Location from 'expo-location';
import {
  setAllGeofences,
  getAllGeofences,
  getGeofenceStates,
  setGeofenceStates,
} from './AsyncStorageService';

const GEOFENCE_MONITORING_TASK = 'GEOFENCE_MONITORING_TASK';

class GeofenceService {
  /** Avvia il monitoraggio delle geofence */
  public async startGeofenceMonitoring(geofences: any[]): Promise<void> {
    try {
      // Salva le geofence per l'accesso nei task di background
      await setAllGeofences(geofences);
      const running = await Location.hasStartedLocationUpdatesAsync(GEOFENCE_MONITORING_TASK);
      if (!running) {
        await Location.startLocationUpdatesAsync(GEOFENCE_MONITORING_TASK, {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1,
          foregroundService: {
            notificationTitle: 'Monitoraggio Geofence',
            notificationBody: 'L\'app sta monitorando le geofence in background.',
            notificationColor: '#00FF00',
          },
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
        });
        console.log('[Geofence] Monitoraggio geofence avviato');
      } else {
        console.log('[Geofence] Monitoraggio geofence già attivo');
      }
    } catch (err) {
      console.error('Errore avviando il monitoraggio delle geofence:', err);
    }
  }

  /** Ferma il monitoraggio delle geofence */
  public async stopGeofenceMonitoring(): Promise<void> {
    try {
      const running = await Location.hasStartedLocationUpdatesAsync(GEOFENCE_MONITORING_TASK);
      if (running) {
        await Location.stopLocationUpdatesAsync(GEOFENCE_MONITORING_TASK);
        console.log('[Geofence] Monitoraggio geofence fermato');
      } else {
        console.warn('Il monitoraggio delle geofence non era attivo.');
      }
    } catch (err) {
      console.error('Errore fermando il monitoraggio delle geofence:', err);
    }
  }

  /** Cleanup (se necessario) */
  public async cleanup() {
    await this.stopGeofenceMonitoring();
  }
}

export default GeofenceService;
