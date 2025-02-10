// src/services/StepCountingService.ts
import { Accelerometer } from 'expo-sensors';
import {
  setForegroundSteps,
  getForegroundSteps,
  removeForegroundSteps,
  setBackgroundSteps,
  getBackgroundSteps,
  removeBackgroundSteps,
} from './AsyncStorageService';

class StepCountingService {
  // Mappa per gestire le sottoscrizioni (activityId -> subscription)
  private foregroundStepSubscriptions: { [key: number]: any } = {};
  private backgroundStepSubscriptions: { [key: number]: any } = {};
  private stepThreshold: number = 1.2;

  /** Avvia il conteggio passi in foreground per una specifica attività */
  public startStepCountingForeground(activityId: number, callback: (steps: number) => void) {
    if (this.foregroundStepSubscriptions[activityId]) {
      console.warn(`Il conteggio dei passi in foreground per attività ${activityId} è già attivo.`);
      return;
    }
    Accelerometer.setUpdateInterval(200);

    // Inizializza il conteggio passi
    setForegroundSteps(activityId, 0).catch(err => {
      console.error(`Errore inizializzando passi foreground per attività ${activityId}:`, err);
    });

    this.foregroundStepSubscriptions[activityId] = Accelerometer.addListener(async ({ x, y, z }) => {
      if (this.detectStep(x, y, z)) {
        try {
          const steps = await getForegroundSteps(activityId);
          const newSteps = steps + 1;
          await setForegroundSteps(activityId, newSteps);
          callback(newSteps);
        } catch (err) {
          console.error(`Errore aggiornando passi foreground per attività ${activityId}:`, err);
        }
      }
    });
    console.log(`[Foreground] Conteggio passi avviato per attività ${activityId}`);
  }

  /** Ferma il conteggio passi in foreground e restituisce i passi accumulati */
  public async stopStepCountingForeground(activityId: number): Promise<number> {
    const subscription = this.foregroundStepSubscriptions[activityId];
    if (subscription) {
      subscription.remove();
      delete this.foregroundStepSubscriptions[activityId];
      console.log(`[Foreground] Conteggio passi fermato per attività ${activityId}`);
      try {
        const steps = await getForegroundSteps(activityId);
        await removeForegroundSteps(activityId);
        return steps;
      } catch (err) {
        console.error(`Errore recuperando passi foreground per attività ${activityId}:`, err);
        return 0;
      }
    } else {
      console.warn(`Il conteggio dei passi in foreground per attività ${activityId} non era attivo.`);
      return 0;
    }
  }

  /** Avvia il conteggio passi in background per una specifica attività */
  public async startStepCountingBackground(activityId: number) {
    if (this.backgroundStepSubscriptions[activityId]) {
      console.warn(`Il conteggio dei passi in background per attività ${activityId} è già attivo.`);
      return;
    }
    try {
      const steps = await getBackgroundSteps(activityId);
      if (steps === null || steps === undefined) {
        await setBackgroundSteps(activityId, 0);
      }
    } catch (err) {
      console.error(`Errore inizializzando passi background per attività ${activityId}:`, err);
    }
    Accelerometer.setUpdateInterval(200);
    this.backgroundStepSubscriptions[activityId] = Accelerometer.addListener(async ({ x, y, z }) => {
      if (this.detectStep(x, y, z)) {
        try {
          const steps = await getBackgroundSteps(activityId);
          const newSteps = steps + 1;
          await setBackgroundSteps(activityId, newSteps);
        } catch (err) {
          console.error(`Errore salvando passi background per attività ${activityId}:`, err);
        }
      }
    });
    console.log(`[Background] Conteggio passi avviato per attività ${activityId}`);
  }

  /** Ferma il conteggio passi in background e restituisce i passi accumulati */
  public async stopStepCountingBackground(activityId: number): Promise<number> {
    const subscription = this.backgroundStepSubscriptions[activityId];
    if (subscription) {
      subscription.remove();
      delete this.backgroundStepSubscriptions[activityId];
      console.log(`[Background] Conteggio passi fermato per attività ${activityId}`);
      try {
        const steps = await getBackgroundSteps(activityId);
        await removeBackgroundSteps(activityId);
        return steps;
      } catch (err) {
        console.error(`Errore recuperando passi background per attività ${activityId}:`, err);
        return 0;
      }
    } else {
      console.warn(`Il conteggio dei passi in background per attività ${activityId} non era attivo.`);
      return 0;
    }
  }

  /** Logica per rilevare un passo basata sulla magnitudine dell'accelerazione */
  private detectStep(x: number, y: number, z: number): boolean {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    return magnitude > this.stepThreshold;
  }

  /** Cleanup: ferma tutte le sottoscrizioni attive */
  public async cleanup() {
    for (const activityId of Object.keys(this.foregroundStepSubscriptions).map(Number)) {
      await this.stopStepCountingForeground(activityId);
    }
    for (const activityId of Object.keys(this.backgroundStepSubscriptions).map(Number)) {
      await this.stopStepCountingBackground(activityId);
    }
  }
}

export default StepCountingService;
