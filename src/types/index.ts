// src/types/index.ts

import Location from 'expo-location';

// Definizione dell'enum ActivityTypes
export enum ActivityTypes {
  Walking = 'walking',
  Running = 'running',
  Standing = 'standing',
  Fitness = 'fitness',
  Cycling = 'cycling',
  Swimming = 'swimming',
  Driving = 'driving',
  Sitting = 'sitting',
  Yoga = 'yoga',
  Gym = 'gym',
  DogWalking = 'dog-walking',
  Sleeping = 'sleeping',
  Texting = 'texting',
  Studying = 'studying',
  Unknown = 'unknown',
}

// Tipo ActivityType che include le tipologie predefinite e qualsiasi stringa personalizzata
export type ActivityType = keyof typeof ActivityTypes | string;

export interface Activity {
  _id: number;
  type: ActivityType;
  startTime: Date;
  endTime?: Date;
  steps?: number;
  userId: string;
  startLocation?: Location.LocationObjectCoords;
  endLocation?: Location.LocationObjectCoords;
  path?: Location.LocationObjectCoords[];
  geofenceId?: number;
}

export const activityTypesWithSteps: ActivityType[] = [
  ActivityTypes.Walking,
  ActivityTypes.Running,
  ActivityTypes.DogWalking,
];

export const metValues: { [key in ActivityType]?: number } = {
    [ActivityTypes.Walking]: 3.5,
    [ActivityTypes.Running]: 7.5,
    [ActivityTypes.Cycling]: 6.0,
    [ActivityTypes.Driving]: 1.5,
    [ActivityTypes.Sitting]: 1.0,
    [ActivityTypes.DogWalking]: 3.0,
  };

export const caloriesPerStep: { [key in ActivityType]?: number } = {
    [ActivityTypes.Walking]: 0.04,
    [ActivityTypes.Running]: 0.06,
    [ActivityTypes.DogWalking]: 0.04,
  };


export interface User {
  _id: string;  // Identificativo unico dell'utente
  name: string;
  email: string;
  age: number | undefined;
  weight: number | undefined;
  height: number | undefined;
  isRegistered?: boolean;
  isLogged?: boolean;
}

export interface ActivityRecognition {
  _id: number;
  activityType: ActivityType;
  confidence: number;  // Livello di accuratezza del riconoscimento
  timestamp: Date;
  userId: string;  // Identificativo unico dell'utente
}

export interface Geofence {
  _id: number;
  name: string; // Nuovo campo per il nome della geofence
  latitude: number;
  longitude: number;
  radius: number;
  entryTime?: Date;  // Quando l'utente entra nell'area
  exitTime?: Date;   // Quando l'utente esce dall'area
  userId: string;  // Identificativo unico dell'utente
  activityType: ActivityType;  // Tipo di attività associata
}

export interface Notification {
  _id: string; // Identificativo unico della notifica
  title: string;
  body: string;
  sentAt: Date;
  userId: string;  // Identificativo unico dell'utente
  scheduledFor?: Date; // se vuoi memorizzare quando la notifica è stata pianificata
  readAt?: Date;       // quando l'utente l'ha aperta/visualizzata
}

// src/types/index.ts (o in un file dedicato, se preferisci)

export interface PermissionData {
  userId: string;
  foregroundLocationGranted: boolean;
  backgroundLocationGranted: boolean;
  notificationGranted: boolean;
}

