// src/constants/activityConstants.ts

import { ActivityTypes, ActivityType } from '../types';

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

export const stepGoal = 10000;

export const caloryGoal = 400;

export const activityIconMapping: { [key: string]: string } = {
  [ActivityTypes.Walking]: 'walking',
  [ActivityTypes.Running]: 'running',
  [ActivityTypes.Standing]: 'user-alt',
  [ActivityTypes.Fitness]: 'dumbbell',
  [ActivityTypes.Cycling]: 'bicycle',
  [ActivityTypes.Swimming]: 'swimmer',
  [ActivityTypes.Driving]: 'car',
  [ActivityTypes.Sitting]: 'chair',
  [ActivityTypes.Yoga]: 'spa',
  [ActivityTypes.Gym]: 'dumbbell',
  [ActivityTypes.DogWalking]: 'dog',
  [ActivityTypes.Sleeping]: 'bed',
  [ActivityTypes.Texting]: 'comment-alt',
  [ActivityTypes.Studying]: 'book',
  [ActivityTypes.Unknown]: 'question-circle',
};

export const defaultActivityIcon = 'star';
