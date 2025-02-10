// src/services/SensorService.ts
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import {
  addActivity,
  updateActivity,
  getLoggedUser,
  getAllGeofences,
  getGeofenceStates,
  setGeofenceStates,
  setCurrentGeofenceActivity,
  getCurrentGeofenceActivity,
  removeCurrentGeofenceActivity,
  removeGeofencePath,
  getGeofencePath,
} from './AsyncStorageService';

import { Activity, Geofence, User, activityTypesWithSteps } from '../types';
import NotificationService from './NotificationService';
import UtilsService from './UtilsService';
import StepCountingService from './StepCountingService';
import LocationService from './LocationService';
import GeofenceService from './GeofenceService';

const BACKGROUND_TRACKING_TASK = 'BACKGROUND_TRACKING_TASK';
const GEOFENCE_MONITORING_TASK = 'GEOFENCE_MONITORING_TASK';

class SensorService {
  // Istanze dei sottoservizi
  private stepCountingService = new StepCountingService();
  private locationService = new LocationService();
  private geofenceService = new GeofenceService();

  /** METODI STEP COUNTING */
  public startStepCountingForeground(activityId: number, callback: (steps: number) => void) {
    return this.stepCountingService.startStepCountingForeground(activityId, callback);
  }
  public stopStepCountingForeground(activityId: number): Promise<number> {
    return this.stepCountingService.stopStepCountingForeground(activityId);
  }
  public startStepCountingBackground(activityId: number) {
    return this.stepCountingService.startStepCountingBackground(activityId);
  }
  public stopStepCountingBackground(activityId: number): Promise<number> {
    return this.stepCountingService.stopStepCountingBackground(activityId);
  }

  /** METODI LOCATION TRACKING */
  public startForegroundLocationTracking(
    activityId: number,
    onUpdate: (coords: Location.LocationObjectCoords[]) => void
  ) {
    return this.locationService.startForegroundLocationTracking(activityId, onUpdate);
  }
  public stopForegroundLocationTracking(activityId: number) {
    return this.locationService.stopForegroundLocationTracking(activityId);
  }
  public startBackgroundLocationTracking(activityId: number) {
    return this.locationService.startBackgroundLocationTracking(activityId);
  }
  public stopBackgroundLocationTracking(activityId: number) {
    return this.locationService.stopBackgroundLocationTracking(activityId);
  }

  /** METODI GEOFENCE */
  public startGeofenceMonitoring(geofences: Geofence[]) {
    return this.geofenceService.startGeofenceMonitoring(geofences);
  }
  public stopGeofenceMonitoring() {
    return this.geofenceService.stopGeofenceMonitoring();
  }

  /** CLEANUP: ferma tutti i sottoservizi */
  public async cleanup() {
    console.log('Pulizia SensorService: fermando tutti i servizi');
    await this.locationService.cleanup();
    await this.stepCountingService.cleanup();
    await this.geofenceService.cleanup();
    console.log('Pulizia completata');
  }
}

/* ---------------------------------------------------------------
 *   DEFINIZIONE DEI TASK DI BACKGROUND
 * --------------------------------------------------------------- */

// Task per il salvataggio del percorso in background
TaskManager.defineTask(BACKGROUND_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Errore BACKGROUND_TRACKING_TASK:', error);
    return;
  }
  if (!data) return;

  const { locations } = data as any;
  try {
    // Recupera l'activityId corrente
    const activityId = await import('./AsyncStorageService').then(mod => mod.getCurrentBackgroundActivityId());
    if (activityId === null) {
      console.warn('Nessuna attività di background corrente trovata.');
      return;
    }
    const currentPath = await import('./AsyncStorageService').then(mod => mod.getBackgroundPath(activityId));
    locations.forEach((loc: Location.LocationObject) => {
      currentPath.push(loc.coords);
    });
    await import('./AsyncStorageService').then(mod => mod.setBackgroundPath(activityId, currentPath));
    console.log(`Aggiornato percorso in background per attività ${activityId}:`, currentPath.length, 'punti salvati');
  } catch (err) {
    console.error('Errore nel salvataggio del percorso in background:', err);
  }
});

// Task per il monitoraggio delle geofence
TaskManager.defineTask(GEOFENCE_MONITORING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Errore GEOFENCE_MONITORING_TASK:', error);
    return;
  }
  if (!data) return;

  const { locations } = data as any;
  console.log('Geofence Monitoring - locations:', locations);
  try {
    const user: User | null = await getLoggedUser();
    if (!user) {
      console.warn('Nessun utente trovato, impossibile gestire geofence.');
      return;
    }
    const userId = user._id;
    const geofences: Geofence[] = await getAllGeofences();
    const geofenceStates = await getGeofenceStates();

    for (const loc of locations) {
      const coords = loc.coords;
      for (const gf of geofences) {
        const distance = UtilsService.calculateDistance(
          coords.latitude,
          coords.longitude,
          gf.latitude,
          gf.longitude
        );
        const isInside = distance <= gf.radius;
        const wasInside = geofenceStates[gf._id] || false;

        if (isInside && !wasInside) {
          // Entrato nella geofence
          geofenceStates[gf._id] = true;
          console.log(`> Entrato nella geofence: ${gf.name}`);
          await NotificationService.sendNotification(
            'Geofence',
            `Sei entrato nella geofence: ${gf.name}`
          );
          // Inizia una nuova attività associata a questa geofence
          const newActivity: Activity = {
            _id: Date.now(),
            type: gf.activityType,
            startTime: new Date(),
            userId,
            startLocation: coords,
            geofenceId: gf._id,
          };
          await addActivity(newActivity);
          await setCurrentGeofenceActivity(gf._id, newActivity);
          if (activityTypesWithSteps.includes(gf.activityType)) {
            await sensorService.startStepCountingBackground(newActivity._id);
          }
          await sensorService.startBackgroundLocationTracking(newActivity._id);
        } else if (!isInside && wasInside) {
          // Uscito dalla geofence
          geofenceStates[gf._id] = false;
          console.log(`> Uscito dalla geofence: ${gf.name}`);
          await NotificationService.sendNotification(
            'Geofence',
            `Hai lasciato la geofence: ${gf.name}`
          );
          const currentActivity = await getCurrentGeofenceActivity(gf._id);
          if (currentActivity) {
            const backgroundPath = await sensorService.stopBackgroundLocationTracking(currentActivity._id);
            let backgroundSteps = 0;
            if (activityTypesWithSteps.includes(currentActivity.type)) {
              backgroundSteps = await sensorService.stopStepCountingBackground(currentActivity._id);
            }
            const gfPath = await getGeofencePath(gf._id);
            const stoppedActivity = {
              ...currentActivity,
              endTime: new Date(),
              endLocation: coords,
              steps: backgroundSteps,
              path: backgroundPath.length > 0 ? backgroundPath : undefined,
            };
            await updateActivity(currentActivity._id, stoppedActivity);
            console.log('Attività terminata in geofence:', stoppedActivity);
            await removeCurrentGeofenceActivity(gf._id);
            await removeGeofencePath(gf._id);
          }
        }
      }
    }
    await setGeofenceStates(geofenceStates);
  } catch (err) {
    console.error('Errore in GEOFENCE_MONITORING_TASK:', err);
  }
});

/* ---------------------------------------------------------------
 *   ISTANZA UNICA DI SENSOR SERVICE
 * --------------------------------------------------------------- */
const sensorService = new SensorService();
export default sensorService;
