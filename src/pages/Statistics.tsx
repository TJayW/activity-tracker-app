// src/pages/Statistics.tsx

import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { UserContext } from '../context/UserContext';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { StatsContext } from '../context/StatsContext';
import { stepGoal, caloryGoal } from '../constants/activityConstants';

const screenWidth = Dimensions.get('window').width;

const Statistics = () => {
  const userContext = useContext(UserContext);
  const statsContext = useContext(StatsContext);

  if (!userContext) {
    console.error("Statistics deve essere annidato all'interno di UserProvider");
    return null;
  }

  if (!statsContext) {
    console.error("Statistics deve essere annidato all'interno di StatsProvider");
    return null;
  }

  const { user } = userContext;
  const {
    getActivityDurations,
    getActivityCounts,
    getAverageDurations,
    getCaloriesBurned,
    getTotalDailyStepsAndCalories,
    getDailyStepsPerDay,
  } = statsContext;

  const [bmi, setBmi] = useState<number | null>(null);
  const [advice, setAdvice] = useState<string>('');

  useEffect(() => {
    calculateBmi();
    generateAdvice();
  }, [user, bmi]);

  const calculateBmi = () => {
    if (user && user.height && user.weight) {
      const heightInMeters = user.height / 100;
      const bmiValue = user.weight / (heightInMeters * heightInMeters);
      setBmi(parseFloat(bmiValue.toFixed(2)));
    } else {
      setBmi(null);
    }
  };

  const generateAdvice = () => {
    if (bmi === null) {
      setAdvice('Inserisci i tuoi dati di salute per ricevere consigli personalizzati.');
      return;
    }

    let adviceText = '';

    if (bmi < 18.5) {
      adviceText = "Il tuo BMI indica un sottopeso. Considera di aumentare l'assunzione calorica e di consultare un professionista.";
    } else if (bmi >= 18.5 && bmi < 25) {
      adviceText = 'Il tuo BMI è nella norma. Continua con le tue abitudini salutari!';
    } else if (bmi >= 25 && bmi < 30) {
      adviceText = "Il tuo BMI indica sovrappeso. Potresti considerare di aumentare l'attività fisica e migliorare la tua dieta.";
    } else if (bmi >= 30) {
      adviceText = 'Il tuo BMI indica obesità. È consigliabile consultare un professionista per un piano di perdita di peso.';
    } else {
      adviceText = 'BMI indeterminato. Verifica i tuoi dati.';
    }

    // Consigli basati su calorie bruciate e passi
    const { totalSteps, totalCalories } = getTotalDailyStepsAndCalories();

    if (totalSteps < stepGoal / 2) {
      adviceText += ` Cerchi di raggiungere almeno ${stepGoal} passi al giorno per migliorare la tua salute.`;
    } else if (totalSteps >= stepGoal / 2 && totalSteps < stepGoal) {
      adviceText += ' Ottimo! Continua ad aumentare gradualmente i tuoi passi giornalieri.';
    } else {
      adviceText += ' Fantastico! Stai raggiungendo i tuoi obiettivi di passi giornalieri.';
    }

    if (totalCalories < caloryGoal * (2 / 3)) {
      adviceText += ` Cerca di bruciare almeno ${caloryGoal} kcal al giorno con le tue attività.`;
    } else if (totalCalories >= caloryGoal * (2 / 3) && totalCalories < caloryGoal) {
      adviceText += ' Buon lavoro! Continua così per mantenere uno stile di vita attivo.';
    } else {
      adviceText += ' Eccellente! Stai bruciando molte calorie con le tue attività.';
    }

    setAdvice(adviceText);
  };

  // Ottenere i dati dalle funzioni del contesto
  const activityDurations = getActivityDurations();
  const activityCounts = getActivityCounts();
  const averageDurations = getAverageDurations();
  const caloriesBurned = getCaloriesBurned();
  const {
    totalSteps: totalDailySteps,
    totalCalories: totalDailyCalories,
  } = getTotalDailyStepsAndCalories();
  const dailySteps = getDailyStepsPerDay();

  // Preparazione dei dati per i grafici
  const activityDurationData = {
    labels: Object.keys(activityDurations),
    data: Object.values(activityDurations).map((value) =>
      parseFloat(value.toFixed(2))
    ),
  };

  const activityCountData = {
    labels: Object.keys(activityCounts),
    datasets: [
      {
        data: Object.values(activityCounts),
      },
    ],
  };

  const averageDurationData = {
    labels: Object.keys(averageDurations),
    datasets: [
      {
        data: Object.values(averageDurations).map((value) =>
          parseFloat(value.toFixed(2))
        ),
      },
    ],
  };

  const dailyStepsData = {
    labels: Object.keys(dailySteps),
    datasets: [
      {
        data: Object.values(dailySteps),
      },
    ],
  };

  const caloriesBurnedData = {
    labels: Object.keys(caloriesBurned),
    data: Object.values(caloriesBurned).map((value) =>
      parseFloat(value.toFixed(2))
    ),
  };

  // Calcola la larghezza minima dei grafici in base al numero di etichette
  const barChartWidth = Math.max(screenWidth - 60, Object.keys(activityCounts).length * 60);
  const lineChartWidth = Math.max(screenWidth - 60, Object.keys(averageDurations).length * 60);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Statistiche</Text>

      {/* Card del BMI */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="heartbeat" size={24} color="#4CAF50" />
          <Text style={styles.cardTitle}>Indice di Massa Corporea (BMI)</Text>
        </View>
        {bmi ? (
          <View style={styles.bmiContainer}>
            <Text style={styles.bmiText}>{bmi}</Text>
            <Text style={styles.bmiCategory}>{getBmiCategory(bmi)}</Text>
          </View>
        ) : (
          <Text style={styles.noDataText}>
            Inserisci i tuoi dati di salute per calcolare il BMI.
          </Text>
        )}
      </View>

      {/* Card Passi e Calorie Bruciate */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="running" size={24} color="#2196F3" />
          <Text style={styles.cardTitle}>Passi e Calorie Bruciate</Text>
        </View>
        <View style={styles.metricContainer}>
          <View style={styles.metricItem}>
            <MaterialIcons name="directions-walk" size={24} color="#4CAF50" />
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>Passi</Text>
              <Text style={styles.metricValue}>{totalDailySteps} passi</Text>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, (totalDailySteps / stepGoal) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
          <View style={styles.metricItem}>
            <MaterialIcons name="local-fire-department" size={24} color="#F44336" />
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>Calorie</Text>
              <Text style={styles.metricValue}>{totalDailyCalories} kcal</Text>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, (totalDailyCalories / caloryGoal) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Sezione Consigli per Te */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="lightbulb" size={24} color="#FFC107" />
          <Text style={styles.cardTitle}>Consigli per Te</Text>
        </View>
        <Text style={styles.adviceText}>{advice}</Text>
      </View>

      {/* Card Tempo totale dedicato a ogni attività */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="chart-pie" size={24} color="#9C27B0" />
          <Text style={styles.cardTitle}>Tempo totale per attività</Text>
        </View>
        {activityDurations && Object.keys(activityDurations).length > 0 ? (
          <PieChart
            data={Object.keys(activityDurations).map((key, index) => ({
              name: key,
              population: parseFloat(activityDurations[key].toFixed(2)),
              color: chartColors[index % chartColors.length],
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            }))}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>Nessun dato disponibile.</Text>
        )}
      </View>

      {/* Card Numero di attività per tipo */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="tasks" size={24} color="#3F51B5" />
          <Text style={styles.cardTitle}>Numero di attività per tipo</Text>
        </View>
        {activityCounts && Object.keys(activityCounts).length > 0 ? (
          <ScrollView horizontal={true}>
            <BarChart
              data={activityCountData}
              width={barChartWidth}
              height={220}
              chartConfig={chartConfig}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel=""
              yAxisSuffix=""
              style={styles.chart}
              verticalLabelRotation={30}
            />
          </ScrollView>
        ) : (
          <Text style={styles.noDataText}>Nessun dato disponibile.</Text>
        )}
      </View>

      {/* Card Durata media per attività */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="clock" size={24} color="#FF9800" />
          <Text style={styles.cardTitle}>Durata media per attività</Text>
        </View>
        {averageDurations && Object.keys(averageDurations).length > 0 ? (
          <ScrollView horizontal={true}>
            <LineChart
              data={averageDurationData}
              width={lineChartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              verticalLabelRotation={30}
              style={styles.chart}
            />
          </ScrollView>
        ) : (
          <Text style={styles.noDataText}>Nessun dato disponibile.</Text>
        )}
      </View>

      {/* Card Numero di passi giornalieri */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="walking" size={24} color="#4CAF50" />
          <Text style={styles.cardTitle}>Numero di passi giornalieri</Text>
        </View>
        {dailySteps && Object.keys(dailySteps).length > 0 ? (
          <LineChart
            data={dailyStepsData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>Nessun dato disponibile.</Text>
        )}
      </View>

      {/* Card Calorie bruciate per attività */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="burn" size={24} color="#F44336" />
          <Text style={styles.cardTitle}>Calorie bruciate per attività</Text>
        </View>
        {caloriesBurned && Object.keys(caloriesBurned).length > 0 ? (
          <PieChart
            data={Object.keys(caloriesBurned).map((key, index) => ({
              name: key,
              population: parseFloat(caloriesBurned[key].toFixed(2)),
              color: chartColors[index % chartColors.length],
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            }))}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>Nessun dato disponibile.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const chartColors = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#FFCD56',
  '#C9CBCF',
];

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(67, 170, 139, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  decimalPlaces: 2,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#ffa726',
  },
};

const getBmiCategory = (bmi: number) => {
  if (bmi < 18.5) return 'Sottopeso';
  if (bmi >= 18.5 && bmi < 25) return 'Normopeso';
  if (bmi >= 25 && bmi < 30) return 'Sovrappeso';
  if (bmi >= 30) return 'Obesità';
  return 'Indeterminato';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 20,
    color: '#1c1c1e',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#1c1c1e',
  },
  bmiContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  bmiText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  bmiCategory: {
    fontSize: 20,
    color: '#555',
    marginTop: 5,
  },
  metricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  metricInfo: {
    marginLeft: 10,
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#888',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    maxWidth: '100%',
  },
  adviceText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  chart: {
    marginVertical: 10,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#777',
    fontStyle: 'italic',
  },
});

export default Statistics;
