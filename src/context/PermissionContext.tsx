// src/context/PermissionContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

import { UserContext } from './UserContext';
import { PermissionData } from '../types';
import {
  setUserPermissions,
  getUserPermissions,
  removeUserPermissions,
} from '../services/AsyncStorageService';

interface PermissionContextType {
  foregroundLocationGranted: boolean;
  backgroundLocationGranted: boolean;
  notificationGranted: boolean;
  requestForegroundPermissions: () => Promise<void>;
  requestBackgroundPermissions: () => Promise<void>;
  requestNotificationPermissions: () => Promise<void>;
  requestAllPermissions: () => Promise<void>;
}

export const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const [foregroundLocationGranted, setForegroundLocationGranted] = useState(false);
  const [backgroundLocationGranted, setBackgroundLocationGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  const { user } = useContext(UserContext) || {};

  /**
   * Carica i permessi esistenti da AsyncStorage (se esistono) quando abbiamo un userId.
   * Se troviamo dei permessi, aggiorniamo lo stato locale senza chiedere di nuovo.
   */
  useEffect(() => {
    const loadStoredPermissions = async () => {
      if (!user || !user._id) return;
      const stored = await getUserPermissions(user._id);
      if (stored) {
        setForegroundLocationGranted(stored.foregroundLocationGranted);
        setBackgroundLocationGranted(stored.backgroundLocationGranted);
        setNotificationGranted(stored.notificationGranted);
        console.log('Permessi caricati da storage per utente', user._id);
      } else {
        console.log('Nessun permesso salvato per utente', user._id);
      }
    };
    loadStoredPermissions();
  }, [user]);

  /**
   * Helper per salvare i permessi attuali nel DB locale, se c'è un userId.
   */
  const saveCurrentPermissions = async (
    fg: boolean,
    bg: boolean,
    notif: boolean
  ) => {
    if (user && user._id) {
      const permissionsData: PermissionData = {
        userId: user._id,
        foregroundLocationGranted: fg,
        backgroundLocationGranted: bg,
        notificationGranted: notif,
      };
      await setUserPermissions(permissionsData);
    }
  };

  /**
   * Richiede i permessi di localizzazione in foreground.
   */
  const requestForegroundPermissions = async () => {
    try {
      // Se abbiamo già 'true', possiamo evitare la richiesta, se lo desideri
      if (foregroundLocationGranted) {
        console.log('Permesso foreground già concesso');
        return;
      }

      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      const granted = fgStatus === 'granted';
      setForegroundLocationGranted(granted);

      if (!granted) {
        Alert.alert(
          'Permesso di Localizzazione Necessario',
          'Per utilizzare questa funzione, per favore concedi i permessi di localizzazione.'
        );
      }

      // Salva nel DB la nuova situazione
      await saveCurrentPermissions(granted, backgroundLocationGranted, notificationGranted);
    } catch (error) {
      console.error('Errore nella richiesta dei permessi di foreground:', error);
    }
  };

  /**
   * Richiede i permessi di localizzazione in background.
   */
  const requestBackgroundPermissions = async () => {
    try {
      // Se già concesso, evitiamo la richiesta
      if (backgroundLocationGranted) {
        console.log('Permesso background già concesso');
        return;
      }

      const { status } = await Location.requestBackgroundPermissionsAsync();
      const granted = status === 'granted';
      setBackgroundLocationGranted(granted);

      if (!granted) {
        Alert.alert(
          'Permesso di Localizzazione in Background Necessario',
          'Per tracciare la posizione in background, per favore concedi i permessi di localizzazione in background.'
        );
      }

      // Salva nel DB
      await saveCurrentPermissions(foregroundLocationGranted, granted, notificationGranted);
    } catch (error) {
      console.error('Errore nella richiesta dei permessi di background:', error);
    }
  };

  /**
   * Richiede i permessi per le notifiche.
   */
  const requestNotificationPermissions = async () => {
    try {
      if (notificationGranted) {
        console.log('Permessi di notifica già concessi');
        return;
      }

      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      const granted = notificationStatus === 'granted';
      setNotificationGranted(granted);

      if (!granted) {
        Alert.alert(
          'Permesso di Notifiche Necessario',
          'Per ricevere notifiche, per favore concedi i permessi di notifiche.'
        );
      }

      // Salva nel DB
      await saveCurrentPermissions(foregroundLocationGranted, backgroundLocationGranted, granted);
    } catch (error) {
      console.error('Errore nella richiesta dei permessi di notifiche:', error);
    }
  };

  /**
   * Richiede tutti i permessi: foreground, background, e notifiche.
   * NB: puoi eventualmente controllare lo stato di ciascuno
   * prima di richiederlo, se non vuoi duplicare le richieste.
   */
  const requestAllPermissions = async () => {
    await requestForegroundPermissions();
    await requestBackgroundPermissions();
    await requestNotificationPermissions();
  };

  /**
   * (Opzionale) Se volessi rimuovere completamente i permessi salvati
   * dal device, potresti chiamare removeUserPermissions(userId).
   * Per esempio, se l'utente fa logout.
   */
  const clearPermissions = async () => {
    if (user && user._id) {
      await removeUserPermissions(user._id);
      setForegroundLocationGranted(false);
      setBackgroundLocationGranted(false);
      setNotificationGranted(false);
      console.log('Permessi rimossi per utente', user._id);
    }
  };

  // Se preferisci, invece di chiedere tutti i permessi in automatico, puoi disabilitare l'usoEffect seguente
  // e lasciare che la tua app li richieda in momenti precisi.
  useEffect(() => {
    // ESEMPIO: se non hai trovato permessi salvati, potresti chiedere tutto:
    // in loadStoredPermissions() se stored = null => requestAllPermissions();
    // Oppure, se vuoi sempre chiedere all'avvio (a prescindere), allora:
    // requestAllPermissions();
  }, []);

  return (
    <PermissionContext.Provider
      value={{
        foregroundLocationGranted,
        backgroundLocationGranted,
        notificationGranted,
        requestForegroundPermissions,
        requestBackgroundPermissions,
        requestNotificationPermissions,
        requestAllPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
