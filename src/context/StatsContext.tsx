// src/context/StatsContext.tsx

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { ActivityContext } from './ActivityContext';
import { UserContext } from './UserContext';
import { Activity } from '../types';
import { activityTypesWithSteps, metValues, caloriesPerStep } from '../constants/activityConstants';

interface StatsContextType {
  getDailySteps: (date: Date) => number;
  getDailyStepsPerDay: () => { [key: string]: number };
  getActivityDurations: () => { [key: string]: number };
  getActivityCounts: () => { [key: string]: number };
  getAverageDurations: () => { [key: string]: number };
  getCaloriesBurned: () => { [key: string]: number };
  getTotalDailyStepsAndCalories: () => {
    totalSteps: number;
    totalCalories: number;
  };
}

export const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider = ({ children }: { children: ReactNode }) => {
  const userContext = useContext(UserContext);
  const activityContext = useContext(ActivityContext);

  if (!userContext) {
    console.error("StatsProvider deve essere annidato all'interno di UserProvider");
    return null;
  }

  if (!activityContext) {
    console.error("StatsProvider deve essere annidato all'interno di ActivityProvider");
    return null;
  }

  const { user } = userContext;
  const { activities } = activityContext;

  /** Helper per calcolare la durata di un'attività in minuti */
  const calculateDuration = useCallback((activity: Activity): number => {
    if (!activity.endTime) return 0;
    return (activity.endTime.getTime() - activity.startTime.getTime()) / 1000 / 60;
  }, []);

  /** 1) getDailySteps */
  const getDailySteps = useCallback(
    (date: Date): number => {
      const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

      const filtered = activities.filter(
        (act) =>
          sameDay(new Date(act.startTime), date) &&
          activityTypesWithSteps.includes(act.type) &&
          act.steps
      );
      return filtered.reduce((sum, act) => sum + (act.steps || 0), 0);
    },
    [activities]
  );

  /** 2) getDailyStepsPerDay */
  const getDailyStepsPerDay = useCallback(() => {
    const stepsPerDay: { [key: string]: number } = {};
    activities.forEach((act) => {
      if (activityTypesWithSteps.includes(act.type) && act.steps) {
        const dateKey = act.startTime.toISOString().split('T')[0];
        stepsPerDay[dateKey] = (stepsPerDay[dateKey] || 0) + act.steps;
      }
    });
    return stepsPerDay;
  }, [activities]);

  /** 3) getActivityDurations */
  const getActivityDurations = useCallback(() => {
    const durations: { [key: string]: number } = {};
    activities.forEach((act) => {
      const dur = calculateDuration(act);
      durations[act.type] = (durations[act.type] || 0) + dur;
    });
    return durations;
  }, [activities, calculateDuration]);

  /** 4) getActivityCounts */
  const getActivityCounts = useCallback(() => {
    const counts: { [key: string]: number } = {};
    activities.forEach((act) => {
      counts[act.type] = (counts[act.type] || 0) + 1;
    });
    return counts;
  }, [activities]);

  /** 5) getAverageDurations */
  const getAverageDurations = useCallback(() => {
    const totalDurations: { [key: string]: number } = {};
    const totalCounts: { [key: string]: number } = {};

    activities.forEach((act) => {
      const dur = calculateDuration(act);
      totalDurations[act.type] = (totalDurations[act.type] || 0) + dur;
      totalCounts[act.type] = (totalCounts[act.type] || 0) + 1;
    });

    const averages: { [key: string]: number } = {};
    Object.keys(totalDurations).forEach((type) => {
      averages[type] = parseFloat((totalDurations[type] / totalCounts[type]).toFixed(2));
    });

    return averages;
  }, [activities, calculateDuration]);

  /** 6) getCaloriesBurned */
  const getCaloriesBurned = useCallback(() => {
    const result: { [key: string]: number } = {};
    const weightInKg = user?.weight || 70;

    activities.forEach((act) => {
      const durMin = calculateDuration(act);
      const durHours = durMin / 60;

      const met = metValues[act.type] || 1.0;
      const calsFromMet = met * weightInKg * durHours;

      let calsFromSteps = 0;
      if (activityTypesWithSteps.includes(act.type) && act.steps) {
        const calsStep = caloriesPerStep[act.type] || 0;
        calsFromSteps = act.steps * calsStep;
      }

      const total = calsFromMet + calsFromSteps;
      result[act.type] = (result[act.type] || 0) + total;
    });

    Object.keys(result).forEach((key) => {
      result[key] = parseFloat(result[key].toFixed(2));
    });

    return result;
  }, [activities, user, calculateDuration]);

  /** 7) getTotalDailyStepsAndCalories */
  const getTotalDailyStepsAndCalories = useCallback(() => {
    let totalSteps = 0;
    let totalCalories = 0;
    const weightInKg = user?.weight || 70;

    activities.forEach((act) => {
      // Passi
      if (activityTypesWithSteps.includes(act.type) && act.steps) {
        totalSteps += act.steps;
      }

      // Calorie
      const durH = calculateDuration(act) / 60;
      const met = metValues[act.type] || 1.0;
      const fromMet = met * weightInKg * durH;

      let fromSteps = 0;
      if (activityTypesWithSteps.includes(act.type) && act.steps) {
        const calsStep = caloriesPerStep[act.type] || 0;
        fromSteps = act.steps * calsStep;
      }

      totalCalories += fromMet + fromSteps;
    });

    return {
      totalSteps,
      totalCalories: parseFloat(totalCalories.toFixed(2)),
    };
  }, [activities, user, calculateDuration]);

  return (
    <StatsContext.Provider
      value={{
        getDailySteps,
        getDailyStepsPerDay,
        getActivityDurations,
        getActivityCounts,
        getAverageDurations,
        getCaloriesBurned,
        getTotalDailyStepsAndCalories,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};
