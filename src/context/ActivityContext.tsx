// src/context/ActivityContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useContext,
} from 'react';
import * as Location from 'expo-location';

import {
  Activity,
  ActivityType,
  ActivityTypes,
  activityTypesWithSteps
} from '../types';

import {
  getActivitiesByUser,
  getCustomActivityTypes,
  addActivity as addActivityToStorage,
  updateActivity as updateActivityInStorage,
  deleteActivity as deleteActivityFromStorage,
  addCustomActivityType as addCustomActivityTypeToStorage,
} from '../services/AsyncStorageService';

import SensorService from '../services/SensorService';
import { UserContext } from './UserContext';
import { PermissionContext } from './PermissionContext';

interface ActivityContextType {
  /** Stato liste e operazioni CRUD per le attività */
  activities: Activity[];
  allActivityTypes: ActivityType[];
  addActivity: (activity: Activity) => Promise<void>;
  updateActivity: (activityId: number, updatedData: Partial<Activity>) => Promise<void>;
  deleteActivity: (activityId: number) => Promise<void>;
  loadActivitiesByUser: (userId: string) => Promise<void>;

  /** Tipi di attività personalizzate */
  customActivityTypes: string[];
  addCustomActivityType: (type: string) => Promise<void>;

  /** Tracciamento del percorso attuale */
  currentPath: Location.LocationObjectCoords[];

  /** Gestione delle attività in corso */
  startNewActivity: (activityType: ActivityType, userId: string) => Promise<Activity>;
  stopCurrentActivity: () => Promise<Activity>;
}

export const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const userContext = useContext(UserContext);
  const permissionContext = useContext(PermissionContext);

  if (!userContext || !permissionContext) {
    console.error('ActivityProvider deve essere annidato all\'interno di UserProvider e PermissionProvider');
    return null;
  }

  const { user } = userContext;

  // Stato per le attività e i tipi di attività
  const [activities, setActivities] = useState<Activity[]>([]);
  const predefinedActivities: ActivityType[] = Object.values(ActivityTypes);
  const [allActivityTypes, setAllActivityTypes] = useState<ActivityType[]>(predefinedActivities);
  const [customActivityTypes, setCustomActivityTypes] = useState<string[]>([]);

  // Tracciamento del percorso attuale
  const [currentPath, setCurrentPath] = useState<Location.LocationObjectCoords[]>([]);
  const [stepCount, setStepCount] = useState<number>(0);

  // Attività corrente
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);

  /** Caricamento iniziale: Attività e tipi di attività personalizzati */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (!user) {
          return;
        }
        // 1) Carica tutte le attività da storage
        const allActivities = await getActivitiesByUser(user._id);
        const withDates = allActivities.map((activity) => ({
          ...activity,
          startTime: new Date(activity.startTime),
          endTime: activity.endTime ? new Date(activity.endTime) : undefined,
        }));
        setActivities(withDates);

        // 2) Carica i tipi di attività personalizzati
        const customTypes = await getCustomActivityTypes();
        setCustomActivityTypes(customTypes);
        setAllActivityTypes([...predefinedActivities, ...customTypes]);

      } catch (err) {
        console.error('Errore durante il caricamento iniziale delle attività:', err);
      }
    };

    loadInitialData();

    /** Cleanup (opzionale)
    // return () => {
    //   SensorService.cleanup();
    // };
    */
  }, [user]);

  /** Operazioni CRUD per le attività */
  const addActivity = useCallback(async (activity: Activity) => {
    const activityWithDate = {
      ...activity,
      startTime: new Date(activity.startTime),
      endTime: activity.endTime ? new Date(activity.endTime) : undefined,
    };
    await addActivityToStorage(activityWithDate);
    setActivities((prev) => [...prev, activityWithDate]);
  }, []);

  const updateActivity = useCallback(async (activityId: number, updatedData: Partial<Activity>) => {
    await updateActivityInStorage(activityId, updatedData);
    setActivities((prev) =>
      prev.map((act) => (act._id === activityId ? { ...act, ...updatedData } : act))
    );
  }, []);

  const deleteActivity = useCallback(async (activityId: number) => {
    await deleteActivityFromStorage(activityId);
    setActivities((prev) => prev.filter((act) => act._id !== activityId));
  }, []);

  const loadActivitiesByUser = useCallback(async (userId: string) => {
    const userActivities = await getActivitiesByUser(userId);
    const withDates = userActivities.map((activity) => ({
      ...activity,
      startTime: new Date(activity.startTime),
      endTime: activity.endTime ? new Date(activity.endTime) : undefined,
    }));
    setActivities(withDates);
  }, []);

  /** Gestione dei tipi di attività personalizzati */
  const addCustomActivityType = useCallback(async (type: string) => {
    await addCustomActivityTypeToStorage(type);
    setCustomActivityTypes((prev) => [...prev, type]);
    setAllActivityTypes((prevList) => [...prevList, type]);
  }, []);

  /** Avvio di una nuova attività */
  const startNewActivity = useCallback(
    async (activityType: ActivityType, userId: string): Promise<Activity> => {
      const newActivity: Activity = {
        _id: Date.now(),
        type: activityType,
        startTime: new Date(),
        userId,
      };

      // Avvio tracciamento percorso in foreground
      await SensorService.startForegroundLocationTracking(newActivity._id, (coords) => {
        setCurrentPath(coords);
      });

      // Se l’attività comporta passi, avvio conteggio in foreground
      if (activityTypesWithSteps.includes(activityType)) {
        SensorService.startStepCountingForeground(newActivity._id, (steps: number) => {
          setStepCount(steps);
        });
      }

      // Avvio tracciamento in background
      await SensorService.startBackgroundLocationTracking(newActivity._id);

      // Se l’attività comporta passi, avvio conteggio in background
      if (activityTypesWithSteps.includes(activityType)) {
        await SensorService.startStepCountingBackground(newActivity._id);
      }

      setCurrentActivity(newActivity);
      return newActivity;
    },
    []
  );

  /** Fermare l'attività corrente */
  const stopCurrentActivity = useCallback(
    async (): Promise<Activity> => {
      if (!currentActivity) {
        throw new Error('Nessuna attività in corso da fermare.');
      }

      // Ferma il tracciamento della posizione in foreground e ottieni il percorso
      const foregroundPath = await SensorService.stopForegroundLocationTracking(currentActivity._id);

      // Ferma il conteggio passi in foreground e ottieni i passi
      let foregroundSteps = 0;
      if (activityTypesWithSteps.includes(currentActivity.type)) {
        foregroundSteps = await SensorService.stopStepCountingForeground(currentActivity._id);
        setStepCount(foregroundSteps);
      }

      // Ferma il tracciamento della posizione in background e ottieni il percorso
      const backgroundPath = await SensorService.stopBackgroundLocationTracking(currentActivity._id);

      // Ferma il conteggio passi in background e ottieni i passi
      let backgroundSteps = 0;
      if (activityTypesWithSteps.includes(currentActivity.type)) {
        backgroundSteps = await SensorService.stopStepCountingBackground(currentActivity._id);
      }

      // Costruisci l'oggetto di attività terminata
      const stoppedActivity: Activity = {
        ...currentActivity,
        endTime: new Date(),
        steps: activityTypesWithSteps.includes(currentActivity.type) ? backgroundSteps : undefined,
        startLocation: backgroundPath[0] || undefined,
        endLocation: backgroundPath[backgroundPath.length - 1] || undefined,
        path: backgroundPath.length > 0 ? backgroundPath : undefined,
        // Se vuoi includere anche il percorso foreground, potresti combinarlo:
        // path: [...backgroundPath, ...foregroundPath],
      };

      // Salva l'attività aggiornata
      await addActivity(stoppedActivity);

      // Reset dello stato nel context
      setCurrentActivity(null);
      setCurrentPath([]);
      setStepCount(0);

      return stoppedActivity;
    },
    [currentActivity]
  );

  return (
    <ActivityContext.Provider
      value={{
        activities,
        allActivityTypes,
        addActivity,
        updateActivity,
        deleteActivity,
        loadActivitiesByUser,
        customActivityTypes,
        addCustomActivityType,
        currentPath,
        startNewActivity,
        stopCurrentActivity,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};
