// src/context/GeofenceContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useContext,
} from 'react';
import { Alert } from 'react-native';

import { Geofence as GeofenceInterface } from '../types';

import {
  addGeofence as addGeofenceToStorage,
  getGeofencesByUser,
  updateGeofence as updateGeofenceInStorage,
  deleteGeofence as deleteGeofenceFromStorage,
} from '../services/AsyncStorageService';

import SensorService from '../services/SensorService';
import { UserContext } from './UserContext';
import { PermissionContext } from './PermissionContext';

interface GeofenceContextType {
  /** Elenco delle geofence dell'utente */
  geofences: GeofenceInterface[];

  /** Stato del monitoraggio delle geofence */
  isMonitoring: boolean;

  /** Operazioni CRUD per le geofence */
  addGeofence: (geofence: Partial<GeofenceInterface>) => Promise<void>;
  updateGeofence: (geofenceId: number, data: Partial<GeofenceInterface>) => Promise<void>;
  deleteGeofence: (geofenceId: number) => Promise<void>;

  /** Funzioni per avviare e fermare il monitoraggio delle geofence */
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
}

export const GeofenceContext = createContext<GeofenceContextType | undefined>(undefined);

export const GeofenceProvider = ({ children }: { children: ReactNode }) => {
  const userContext = useContext(UserContext);
  const permissionContext = useContext(PermissionContext);

  if (!userContext || !permissionContext) {
    console.error('GeofenceProvider deve essere annidato in UserProvider e PermissionProvider');
    return null;
  }

  const { user } = userContext;
  const { foregroundLocationGranted } = permissionContext;

  // Stato per le geofence
  const [geofences, setGeofences] = useState<GeofenceInterface[]>([]);

  // Stato per il monitoraggio delle geofence
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);

  /** Carica geofence all’avvio */
  useEffect(() => {
    let isMounted = true;

    const loadGeofences = async () => {
      try {
        if (!user) {
          return;
        }
        const userGeofences = await getGeofencesByUser(user._id);
        if (isMounted) {
          setGeofences(userGeofences);
        }
      } catch (err) {
        console.error('Errore caricando le geofence:', err);
      }
    };

    loadGeofences();

    /** Cleanup al disimpostamento del componente */
    return () => {
      isMounted = false;
      if (isMonitoring) {
        SensorService.stopGeofenceMonitoring().catch((err) => {
          console.error('Errore fermando il monitoraggio delle geofence durante il cleanup:', err);
        });
      }
    };
  }, [user]);

  /** Avvia o riavvia il monitoraggio delle geofence ogni volta che cambia l'elenco delle geofence */
  useEffect(() => {
    const updateGeofenceMonitoring = async () => {
      if (isMonitoring) {
        try {
          await SensorService.startGeofenceMonitoring(geofences);
          console.log('Monitoraggio delle geofence aggiornato');
        } catch (err) {
          console.error('Errore aggiornando il monitoraggio delle geofence:', err);
        }
      }
    };

    updateGeofenceMonitoring();
  }, [geofences]);

  /** Funzione per avviare il monitoraggio delle geofence */
  const startMonitoring = useCallback(async () => {
    if (isMonitoring) {
      console.warn('Il monitoraggio delle geofence è già attivo.');
      return;
    }

    if (!foregroundLocationGranted) {
      Alert.alert('Permessi Posizione', 'Devi concedere i permessi per la posizione per monitorare le geofence.');
      return;
    }

    try {
      await SensorService.startGeofenceMonitoring(geofences);
      setIsMonitoring(true);
      // Log rimosso
      Alert.alert('Monitoraggio Geofence', 'Il monitoraggio delle geofence è stato avviato.');
    } catch (error) {
      console.error('Errore avviando il monitoraggio delle geofence:', error);
      Alert.alert('Errore', 'Impossibile avviare il monitoraggio delle geofence.');
    }
  }, [geofences, foregroundLocationGranted, isMonitoring]);

  /** Funzione per fermare il monitoraggio delle geofence */
  const stopMonitoring = useCallback(async () => {
    if (!isMonitoring) {
      console.warn('Il monitoraggio delle geofence non era attivo.');
      return;
    }

    try {
      await SensorService.stopGeofenceMonitoring();
      setIsMonitoring(false);
      // Log rimosso
      Alert.alert('Monitoraggio Geofence', 'Il monitoraggio delle geofence è stato fermato.');
    } catch (error) {
      console.error('Errore fermando il monitoraggio delle geofence:', error);
      Alert.alert('Errore', 'Impossibile fermare il monitoraggio delle geofence.');
    }
  }, [isMonitoring]);

  /** Aggiungere una nuova geofence */
  const addGeofence = useCallback(
    async (geofence: Partial<GeofenceInterface>) => {
      try {
        const userId = user?._id;
        const newGeofence: GeofenceInterface = {
          ...geofence,
          _id: Math.floor(Math.random() * 1000000),
          userId,
        } as GeofenceInterface;

        await addGeofenceToStorage(newGeofence);
        const updatedGeofences = [...geofences, newGeofence];
        setGeofences(updatedGeofences);
      } catch (error) {
        console.error('Errore aggiungendo geofence:', error);
        Alert.alert('Errore', 'Impossibile aggiungere la geofence.');
      }
    },
    [user, geofences]
  );

  /** Aggiornare una geofence esistente */
  const updateGeofence = useCallback(
    async (geofenceId: number, data: Partial<GeofenceInterface>) => {
      try {
        await updateGeofenceInStorage(geofenceId, data);
        const updatedGeofences = geofences.map((gf) =>
          gf._id === geofenceId ? { ...gf, ...data } : gf
        );
        setGeofences(updatedGeofences);
      } catch (error) {
        console.error(`Errore aggiornando geofence ID ${geofenceId}:`, error);
        Alert.alert('Errore', 'Impossibile aggiornare la geofence.');
      }
    },
    [geofences]
  );

  /** Rimuovere una geofence */
  const deleteGeofence = useCallback(
    async (geofenceId: number) => {
      try {
        await deleteGeofenceFromStorage(geofenceId);
        const updatedGeofences = geofences.filter((gf) => gf._id !== geofenceId);
        setGeofences(updatedGeofences);
      } catch (error) {
        console.error(`Errore nel cancellare geofence ID ${geofenceId}:`, error);
        Alert.alert('Errore', 'Impossibile eliminare la geofence.');
      }
    },
    [geofences]
  );

  return (
    <GeofenceContext.Provider
      value={{
        geofences,
        isMonitoring,
        addGeofence,
        updateGeofence,
        deleteGeofence,
        startMonitoring,
        stopMonitoring,
      }}
    >
      {children}
    </GeofenceContext.Provider>
  );
};
