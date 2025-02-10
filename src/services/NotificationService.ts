// src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';

class NotificationService {
  /**
   * Richiede i permessi di notifica.
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Invia subito una notifica locale.
   */
  async sendNotification(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // Notifica immediata
    });
  }

  /**
   * Pianifica una notifica locale fra X secondi.
   * Restituisce l'ID della notifica pianificata.
   */
  async scheduleNotification(
    title: string,
    body: string,
    seconds: number
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { seconds },
    });
  }

  /**
   * Pianifica una notifica giornaliera, sempre alla stessa ora.
   * Restituisce l'ID della notifica pianificata.
   */
  async scheduleDailyNotification(
    title: string,
    body: string,
    hour = 9,
    minute = 0
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  }

  /**
   * Restituisce tutte le notifiche pianificate.
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Cancella tutte le notifiche pianificate.
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Cancella una notifica pianificata, dato il suo ID.
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.warn('Errore nella cancellazione singola della notifica:', error);
    }
  }
}

export default new NotificationService();
