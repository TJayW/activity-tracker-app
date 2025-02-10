// src/services/AsyncStorageService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, User, ActivityRecognition, Geofence, Notification } from '../types';
import * as Location from 'expo-location';
import { PermissionData } from '../types';

// ---------------------------------------------------------
// Helper generici per salvare e leggere i dati
// ---------------------------------------------------------
const saveData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`Salvati dati per chiave "${key}"`, jsonValue);
  } catch (e) {
    console.error("Error saving data", e);
  }
};

const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    console.log(`Dati recuperati per chiave "${key}"`, jsonValue);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Error reading data", e);
    return null;
  }
};

// ---------------------------------------------------------
// Utenti
// ---------------------------------------------------------
/**
 * Aggiunge (o aggiorna) un utente all'interno dell'array degli utenti salvati.
 */
export const addUser = async (user: User): Promise<void> => {
  const users = await getAllUsers();
  const index = users.findIndex(u => u._id === user._id);
  if (index > -1) {
    users[index] = user;
  } else {
    users.push(user);
  }
  await saveData('users', users);
};

export const getAllUsers = async (): Promise<User[]> => {
  const users = await getData<User[]>('users');
  return users || [];
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const users = await getAllUsers();
  return users.find(user => user._id === userId) || null;
};

export const getLoggedUser = async (): Promise<User | null> => {
  const users = await getAllUsers();
  const loggedUser = users.find(user => user.isLogged);
  return loggedUser || null;
};

export const setUserLogged = async (userId: string): Promise<void> => {
  let users = await getAllUsers();
  users = users.map(user => ({
    ...user,
    isLogged: user._id === userId
  }));
  await saveData('users', users);
};

export const logoutUser = async (userId: string): Promise<void> => {
  const users = await getAllUsers();
  const updatedUsers = users.map(user => 
    user._id === userId ? { ...user, isLogged: false } : user
  );
  await saveData('users', updatedUsers);
};

// ---------------------------------------------------------
// Attività (Activities)
// ---------------------------------------------------------
export const addActivity = async (activity: Activity) => {
  const activities = await getAllActivities();
  activities.push(activity);
  await saveData('activities', activities);
};

export const getAllActivities = async (): Promise<Activity[]> => {
  const activities = await getData<Activity[]>('activities');
  return activities || [];
};

export const gerActivituById = async (activityId: number): Promise<Activity | null> => {
  const activities = await getAllActivities();
  return activities.find(a => a._id === activityId) || null;
};

export const updateActivity = async (activityId: number, updatedData: Partial<Activity>) => {
  const activities = await getAllActivities();
  const activityIndex = activities.findIndex(a => a._id === activityId);
  if (activityIndex !== -1) {
    activities[activityIndex] = { ...activities[activityIndex], ...updatedData };
    await saveData('activities', activities);
  }
};

export const deleteActivity = async (activityId: number) => {
  let activities = await getAllActivities();
  activities = activities.filter(a => a._id !== activityId);
  await saveData('activities', activities);
};

export const getActivitiesByUser = async (userId: string): Promise<Activity[]> => {
  const activities = await getAllActivities();
  return activities.filter(a => a.userId === userId);
};

// ---------------------------------------------------------
// Riconoscimenti attività (ActivityRecognition)
// ---------------------------------------------------------
export const addActivityRecognition = async (recognition: ActivityRecognition) => {
  const recognitions = await getAllActivityRecognitions();
  recognitions.push(recognition);
  await saveData('activityRecognitions', recognitions);
};

export const getAllActivityRecognitions = async (): Promise<ActivityRecognition[]> => {
  const recognitions = await getData<ActivityRecognition[]>('activityRecognitions');
  return recognitions || [];
};

// ---------------------------------------------------------
// Geofence
// ---------------------------------------------------------
export const addGeofence = async (geofence: Geofence) => {
  const geofences = await getAllGeofences();
  geofences.push(geofence);
  await saveData('geofences', geofences);
};

export const getAllGeofences = async (): Promise<Geofence[]> => {
  const geofences = await getData<Geofence[]>('geofences');
  return geofences || [];
};

/**
 * Imposta in blocco tutte le geofence (ad es. per il monitoraggio).
 */
export const setAllGeofences = async (geofences: Geofence[]): Promise<void> => {
  await saveData('geofences', geofences);
};

export const getGeofencesByUser = async (userId: string): Promise<Geofence[]> => {
  const geofences = await getAllGeofences();
  return geofences.filter(g => g.userId === userId);
};

export const updateGeofence = async (geofenceId: number, updatedData: Partial<Geofence>) => {
  const geofences = await getAllGeofences();
  const index = geofences.findIndex(g => g._id === geofenceId);
  if (index !== -1) {
    geofences[index] = { ...geofences[index], ...updatedData };
    await saveData('geofences', geofences);
  } else {
    console.error(`Geofence con ID ${geofenceId} non trovata.`);
    throw new Error(`Geofence con ID ${geofenceId} non trovata.`);
  }
};

export const deleteGeofence = async (geofenceId: number) => {
  let geofences = await getAllGeofences();
  const initialLength = geofences.length;
  geofences = geofences.filter(g => g._id !== geofenceId);
  if (geofences.length === initialLength) {
    console.error(`Geofence con ID ${geofenceId} non trovata.`);
    throw new Error(`Geofence con ID ${geofenceId} non trovata.`);
  }
  await saveData('geofences', geofences);
};

// ---------------------------------------------------------
// Stato delle geofence
// ---------------------------------------------------------
export const getGeofenceStates = async (): Promise<{ [key: number]: boolean }> => {
  const geofenceStates = await getData<{ [key: number]: boolean }>('geofenceStates');
  return geofenceStates || {};
};

export const setGeofenceStates = async (geofenceStates: { [key: number]: boolean }): Promise<void> => {
  await saveData('geofenceStates', geofenceStates);
};

// ---------------------------------------------------------
// Notifiche
// ---------------------------------------------------------
export const addNotification = async (notification: Notification) => {
  const notifications = await getAllNotifications();
  notifications.push(notification);
  await saveData('notifications', notifications);
};

export const getAllNotifications = async (): Promise<Notification[]> => {
  const notifications = await getData<Notification[]>('notifications');
  return notifications || [];
};

export const getNotificationsByUser = async (userId: string): Promise<Notification[]> => {
  const notifications = await getAllNotifications();
  return notifications.filter(n => n.userId === userId);
};

export const updateNotification = async (
  notificationId: string,
  updatedFields: Partial<Notification>
): Promise<void> => {
  const notifications = await getAllNotifications();
  const index = notifications.findIndex((n) => n._id === notificationId);

  if (index === -1) {
    throw new Error(`Notifica con ID ${notificationId} non trovata.`);
  }

  notifications[index] = { ...notifications[index], ...updatedFields };
  await saveData('notifications', notifications);
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  const notifications = await getAllNotifications();
  const filtered = notifications.filter((n) => n._id !== notificationId);

  if (filtered.length === notifications.length) {
    throw new Error(`Notifica con ID ${notificationId} non trovata.`);
  }

  await saveData('notifications', filtered);
};

// ---------------------------------------------------------
// Tipi di attività personalizzati
// ---------------------------------------------------------
export const getCustomActivityTypes = async (): Promise<string[]> => {
  try {
    const savedCustomTypes = await AsyncStorage.getItem('customActivityTypes');
    return savedCustomTypes ? JSON.parse(savedCustomTypes) : [];
  } catch (error) {
    console.error('Error getting custom activity types', error);
    return [];
  }
};

export const addCustomActivityType = async (newType: string): Promise<void> => {
  try {
    const existingTypes = await getCustomActivityTypes();
    const updatedTypes = [...existingTypes, newType];
    await AsyncStorage.setItem('customActivityTypes', JSON.stringify(updatedTypes));
  } catch (error) {
    console.error('Error saving custom activity type', error);
  }
};

// ---------------------------------------------------------
// Pulizia attività duplicate
// ---------------------------------------------------------
export const cleanDuplicateActivities = async (): Promise<void> => {
  try {
    const activities = await getAllActivities();
    const uniqueActivities: { [key: number]: Activity } = {};

    activities.forEach((activity) => {
      if (!uniqueActivities[activity._id]) {
        uniqueActivities[activity._id] = activity;
      }
    });

    const cleanedActivities = Object.values(uniqueActivities);
    await saveData('activities', cleanedActivities);

    console.log('Attività duplicate rimosse. Totale attività pulite:', cleanedActivities.length);
  } catch (error) {
    console.error('Errore durante la pulizia delle attività duplicate:', error);
  }
};

// ---------------------------------------------------------
// Pulizia totale di tutti i dati
// ---------------------------------------------------------
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log('Tutti i dati sono stati cancellati dal local storage.');
  } catch (error) {
    console.error('Errore durante la cancellazione dei dati:', error);
  }
};

// ---------------------------------------------------------
// Metodi per il monitoraggio dei passi e del percorso (foreground/background)
// ---------------------------------------------------------

/**
 * Imposta il conteggio passi in foreground di una certa activity.
 */
export const setForegroundSteps = async (activityId: number, steps: number): Promise<void> => {
  await saveData(`foregroundSteps_${activityId}`, steps);
};

export const getForegroundSteps = async (activityId: number): Promise<number> => {
  const data = await getData<number>(`foregroundSteps_${activityId}`);
  return data ?? 0;
};

export const removeForegroundSteps = async (activityId: number): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`foregroundSteps_${activityId}`);
  } catch (err) {
    console.error('Errore durante removeForegroundSteps:', err);
  }
};

/**
 * Imposta il conteggio passi in background di una certa activity.
 */
export const setBackgroundSteps = async (activityId: number, steps: number): Promise<void> => {
  await saveData(`backgroundSteps_${activityId}`, steps);
};

export const getBackgroundSteps = async (activityId: number): Promise<number> => {
  const data = await getData<number>(`backgroundSteps_${activityId}`);
  return data ?? 0;
};

export const removeBackgroundSteps = async (activityId: number): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`backgroundSteps_${activityId}`);
  } catch (err) {
    console.error('Errore durante removeBackgroundSteps:', err);
  }
};

/**
 * Path in foreground di un'attività
 */
export const setForegroundPath = async (activityId: number, coords: Location.LocationObjectCoords[]): Promise<void> => {
  await saveData(`foregroundPath_${activityId}`, coords);
};

export const getForegroundPath = async (activityId: number): Promise<Location.LocationObjectCoords[]> => {
  const data = await getData<Location.LocationObjectCoords[]>(`foregroundPath_${activityId}`);
  return data ?? [];
};

export const removeForegroundPath = async (activityId: number): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`foregroundPath_${activityId}`);
  } catch (err) {
    console.error('Errore durante removeForegroundPath:', err);
  }
};

/**
 * Path in background di un'attività
 */
export const setBackgroundPath = async (activityId: number, coords: Location.LocationObjectCoords[]): Promise<void> => {
  await saveData(`backgroundPath_${activityId}`, coords);
};

export const getBackgroundPath = async (activityId: number): Promise<Location.LocationObjectCoords[]> => {
  const data = await getData<Location.LocationObjectCoords[]>(`backgroundPath_${activityId}`);
  return data ?? [];
};

export const removeBackgroundPath = async (activityId: number): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`backgroundPath_${activityId}`);
  } catch (err) {
    console.error('Errore durante removeBackgroundPath:', err);
  }
};

// ---------------------------------------------------------
// Gestione dell’ID dell’attività in background corrente
// ---------------------------------------------------------
export const setCurrentBackgroundActivityId = async (activityId: number): Promise<void> => {
  await saveData('currentBackgroundActivityId', activityId);
};

export const getCurrentBackgroundActivityId = async (): Promise<number | null> => {
  const data = await getData<number>('currentBackgroundActivityId');
  return data !== null ? data : null;
};

export const removeCurrentBackgroundActivityId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('currentBackgroundActivityId');
  } catch (err) {
    console.error('Errore durante removeCurrentBackgroundActivityId:', err);
  }
};

// ---------------------------------------------------------
// Attività “corrente” legata a una geofence (currentActivity_{gf._id})
// ---------------------------------------------------------
export const setCurrentGeofenceActivity = async (geofenceId: number, activity: Activity): Promise<void> => {
  await saveData(`currentActivity_${geofenceId}`, activity);
};

export const getCurrentGeofenceActivity = async (geofenceId: number): Promise<Activity | null> => {
  const data = await getData<Activity>(`currentActivity_${geofenceId}`);
  return data;
};

export const removeCurrentGeofenceActivity = async (geofenceId: number): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`currentActivity_${geofenceId}`);
  } catch (err) {
    console.error('Errore durante removeCurrentGeofenceActivity:', err);
  }
};

// ---------------------------------------------------------
// Path legato direttamente a una geofence (geofencePath_{gf._id})
// ---------------------------------------------------------
export const setGeofencePath = async (geofenceId: number, path: Location.LocationObjectCoords[]): Promise<void> => {
  await saveData(`geofencePath_${geofenceId}`, path);
};

export const getGeofencePath = async (geofenceId: number): Promise<Location.LocationObjectCoords[]> => {
  const data = await getData<Location.LocationObjectCoords[]>(`geofencePath_${geofenceId}`);
  return data ?? [];
};

export const removeGeofencePath = async (geofenceId: number): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`geofencePath_${geofenceId}`);
  } catch (err) {
    console.error('Errore durante removeGeofencePath:', err);
  }
};

// ---------------------------------------------------------
// Permessi utente
// ---------------------------------------------------------
export const setUserPermissions = async (permissions: PermissionData): Promise<void> => {
  const key = `permissions_${permissions.userId}`;
  await saveData(key, permissions);
};

export const getUserPermissions = async (userId: string): Promise<PermissionData | null> => {
  const key = `permissions_${userId}`;
  return await getData<PermissionData>(key);
};

export const removeUserPermissions = async (userId: string): Promise<void> => {
  const key = `permissions_${userId}`;
  try {
    await AsyncStorage.removeItem(key);
    console.log(`Permessi per l'utente ${userId} rimossi`);
  } catch (err) {
    console.error(`Errore durante removeUserPermissions per l'utente ${userId}:`, err);
  }
};