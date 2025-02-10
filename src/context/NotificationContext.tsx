// src/context/NotificationContext.tsx
import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useContext,
} from 'react';
import { Notification as AppNotification } from '../types';
import NotificationService from '../services/NotificationService';
import { ActivityContext } from './ActivityContext';
import { UserContext } from './UserContext';
import {
  getNotificationsByUser,
  addNotification as addNotificationToStorage,
  updateNotification as updateNotificationInStorage,
  deleteNotification as deleteNotificationFromStorage,
} from '../services/AsyncStorageService';
import debounce from 'lodash.debounce';

interface NotificationContextType {
  notifications: AppNotification[];
  fetchUserNotifications: (userId: string) => Promise<void>;
  scheduleDailyReminder: () => Promise<void>;
  scheduleInactivityReminder: () => Promise<void>;
  cancelInactivityReminder: () => Promise<void>;
  sendImmediateNotification: (title: string, body: string, userId?: string) => Promise<void>;
  scheduleCustomNotification: (
    title: string,
    body: string,
    dateOrSeconds: Date | number,
    userId?: string
  ) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updateNotification: (notificationId: string, updatedFields: Partial<AppNotification>) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [inactivityNotificationId, setInactivityNotificationId] = useState<string | null>(null);

  const { activities } = useContext(ActivityContext)!;
  const { user } = useContext(UserContext)!;

  /**
   * Carica tutte le notifiche dell'utente dal DB (AsyncStorage)
   */
  const fetchUserNotifications = useCallback(async (userId: string) => {
    try {
      const userNotificationsRaw = await getNotificationsByUser(userId);
      // Assicuriamoci che il campo sentAt sia convertito in un oggetto Date
      const userNotifications = userNotificationsRaw.map(n => ({
        ...n,
        sentAt: new Date(n.sentAt),
      }));
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Errore durante il caricamento delle notifiche:', error);
    }
  }, []);

  /**
   * Richiede i permessi di notifica al mount del componente.
   */
  useEffect(() => {
    const requestPermissions = async () => {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        console.warn('Permessi di notifica non concessi');
      } else {
        console.log('Permessi di notifica concessi');
      }
    };

    requestPermissions().then(() => {
      if (user?._id) {
        sendImmediateNotification("Bentornato", "Bentornato nell'app", user._id);
      } else {
        console.warn("Nessun utente trovato, impossibile inviare la notifica");
      }
    });

  }, []);

  /* ------------------------------------------------------------------
   * FUNZIONALITÀ DI INVIO E PIANIFICAZIONE NOTIFICHE
   * ------------------------------------------------------------------ */

  /**
   * Invia una notifica immediata e la salva in AsyncStorage.
   */
  const sendImmediateNotification = useCallback(
    async (title: string, body: string, userId?: string) => {
      try {
        // 1) Invia la notifica immediata
        await NotificationService.sendNotification(title, body);

        // 2) Crea un record per la notifica
        const newNotification: AppNotification = {
          _id: Date.now().toString(),
          title,
          body,
          sentAt: new Date(),
          userId: userId ?? 'system',
        };
        await addNotificationToStorage(newNotification);
        setNotifications(prev => [...prev, newNotification]);
      } catch (error) {
        console.error("Errore durante l'invio della notifica immediata:", error);
      }
    },
    []
  );

  /**
   * Pianifica una notifica personalizzata (in una data specifica o dopo X secondi)
   * e la salva in AsyncStorage.
   */
  const scheduleCustomNotification = useCallback(
    async (title: string, body: string, dateOrSeconds: Date | number, userId?: string) => {
      try {
        let scheduledTime: Date;
        if (typeof dateOrSeconds === 'number') {
          // Pianifica dopo X secondi
          scheduledTime = new Date(Date.now() + dateOrSeconds * 1000);
          const newId = await NotificationService.scheduleNotification(title, body, dateOrSeconds);
          console.log("Notifica personalizzata pianificata con id:", newId);
        } else {
          // Pianifica ad una data/ora specifica
          const diffInMs = dateOrSeconds.getTime() - Date.now();
          if (diffInMs > 0) {
            const diffInSeconds = Math.ceil(diffInMs / 1000);
            const newId = await NotificationService.scheduleNotification(title, body, diffInSeconds);
            console.log("Notifica personalizzata pianificata con id:", newId);
          } else {
            // Se la data è già passata, invia la notifica immediata
            await sendImmediateNotification(title, body, userId);
          }
          scheduledTime = dateOrSeconds;
        }
        // Salva la notifica "bozza" in AsyncStorage
        const newNotification: AppNotification = {
          _id: Date.now().toString(),
          title,
          body,
          sentAt: new Date(),
          userId: userId ?? 'system',
        };
        await addNotificationToStorage(newNotification);
        setNotifications(prev => [...prev, newNotification]);
      } catch (error) {
        console.error("Errore durante la pianificazione della notifica personalizzata:", error);
      }
    },
    [sendImmediateNotification]
  );

  /**
   * Aggiorna una notifica (ad es. per segnalarla come letta)
   */
  const updateNotification = useCallback(
    async (notificationId: string, updatedFields: Partial<AppNotification>) => {
      try {
        await updateNotificationInStorage(notificationId, updatedFields);
        setNotifications(prev =>
          prev.map(n => (n._id === notificationId ? { ...n, ...updatedFields } : n))
        );
      } catch (err) {
        console.error("Errore durante updateNotification:", err);
      }
    },
    []
  );

  /**
   * Segna una notifica come letta.
   */
  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      const readAt = new Date();
      await updateNotification(notificationId, { readAt });
    },
    [updateNotification]
  );

  /**
   * Elimina una notifica (dal DB e dallo stato locale)
   */
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await deleteNotificationFromStorage(notificationId);
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
      } catch (err) {
        console.error("Errore durante la cancellazione della notifica:", err);
      }
    },
    []
  );

  /* ------------------------------------------------------------------
   * FUNZIONI DI SCHEDULING STANDARD
   * ------------------------------------------------------------------ */

  /**
   * Pianifica la notifica giornaliera di promemoria.
   * Verifica se è già stata pianificata per evitare duplicazioni.
   */
  const scheduleDailyReminder = useCallback(async () => {
    try {
      const scheduled = await NotificationService.getScheduledNotifications();
      const alreadyScheduled = scheduled.find(
        (notif) => notif.content.title === 'Ricorda di registrare le tue attività!'
      );
      if (alreadyScheduled) {
        console.log("Notifica giornaliera già pianificata");
        return;
      }
      const dailyId = await NotificationService.scheduleDailyNotification(
        'Ricorda di registrare le tue attività!',
        "Apri l'app per registrare le attività di oggi.",
        9, // ora
        0  // minuto
      );
      console.log("Notifica giornaliera pianificata con id", dailyId);
    } catch (error) {
      console.error("Errore scheduling daily reminder:", error);
    }
  }, []);

  /**
   * Pianifica una notifica di inattività (es. dopo 2 ore di inattività).
   * Se esiste già una notifica di inattività (con titolo 'Sei ancora lì?'),
   * la funzione non pianifica una nuova notifica.
   */
  const scheduleInactivityReminder = useCallback(async () => {
    try {
      const scheduled = await NotificationService.getScheduledNotifications();
      const inactivityScheduled = scheduled.find(
        (notif) => notif.content.title === 'Sei ancora lì?'
      );
      if (inactivityScheduled) {
        console.log("Notifica di inattività già pianificata");
        return;
      }
      // Durata di inattività: 2 ore in secondi
      const inactivityDuration = 2 * 60 * 60;
      const userActivities = activities.filter(a => a.userId === user?._id);
      let lastActivityTime = Date.now();
      if (userActivities.length > 0) {
        const lastActivity = userActivities.reduce((acc, curr) => {
          const accTime = acc.endTime ? acc.endTime.getTime() : acc.startTime.getTime();
          const currTime = curr.endTime ? curr.endTime.getTime() : curr.startTime.getTime();
          return currTime > accTime ? curr : acc;
        });
        lastActivityTime = lastActivity.endTime
          ? lastActivity.endTime.getTime()
          : lastActivity.startTime.getTime();
      }
      const timeSinceLastActivity = Math.floor((Date.now() - lastActivityTime) / 1000);
      const timeUntilReminder = inactivityDuration - timeSinceLastActivity;
      if (timeUntilReminder > 0) {
        const newId = await NotificationService.scheduleNotification(
          'Sei ancora lì?',
          "Sembra che tu sia stato inattivo per un po'. Fai qualche passo!",
          timeUntilReminder
        );
        setInactivityNotificationId(newId);
        console.log("Notifica di inattività pianificata tra", timeUntilReminder, "secondi");
      } else {
        // Se il tempo di inattività è già superato, invia la notifica immediata
        await sendImmediateNotification(
          'Sei ancora lì?',
          "Sembra che tu sia stato inattivo per un po'. Fai qualche passo!",
          user?._id
        );
      }
    } catch (error) {
      console.error("Errore scheduleInactivityReminder:", error);
    }
  }, [activities, user, sendImmediateNotification]);

  /**
   * Cancella la notifica di inattività se esiste.
   */
  const cancelInactivityReminder = useCallback(async () => {
    if (inactivityNotificationId) {
      await NotificationService.cancelScheduledNotification(inactivityNotificationId);
      setInactivityNotificationId(null);
      console.log("Notifica di inattività cancellata");
    }
  }, [inactivityNotificationId]);

  // Utilizziamo debounce per evitare chiamate ripetute troppo ravvicinate
  const debouncedScheduleInactivityReminder = useCallback(
    debounce(() => {
      scheduleInactivityReminder();
    }, 1000),
    [scheduleInactivityReminder]
  );

  // Ogni volta che le attività dell'utente cambiano, ripianifichiamo la notifica di inattività
  const [lastActivityEndTime, setLastActivityEndTime] = useState<number>(0);
  useEffect(() => {
    if (!user) return;
    const userActivities = activities.filter(a => a.userId === user._id);
    if (userActivities.length === 0) {
      if (lastActivityEndTime === 0) {
        setLastActivityEndTime(Date.now());
        debouncedScheduleInactivityReminder();
      }
      return;
    }
    const lastActivity = userActivities.reduce((acc, curr) => {
      const accTime = acc.endTime ? acc.endTime.getTime() : acc.startTime.getTime();
      const currTime = curr.endTime ? curr.endTime.getTime() : curr.startTime.getTime();
      return currTime > accTime ? curr : acc;
    });
    const newLastTime = lastActivity.endTime
      ? lastActivity.endTime.getTime()
      : lastActivity.startTime.getTime();
    if (newLastTime > lastActivityEndTime) {
      setLastActivityEndTime(newLastTime);
      debouncedScheduleInactivityReminder();
    }
  }, [activities, user, lastActivityEndTime, debouncedScheduleInactivityReminder]);

  // Pianifica la notifica giornaliera al mount
  useEffect(() => {
    scheduleDailyReminder();
  }, [scheduleDailyReminder]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        fetchUserNotifications,
        scheduleDailyReminder,
        scheduleInactivityReminder,
        cancelInactivityReminder,
        sendImmediateNotification,
        scheduleCustomNotification,
        updateNotification,
        deleteNotification,
        markNotificationAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
