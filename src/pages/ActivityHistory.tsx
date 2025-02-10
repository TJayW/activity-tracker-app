// src/pages/ActivityHistory.tsx
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { ActivityContext } from '../context/ActivityContext';
import { UserContext } from '../context/UserContext';
import { Activity, ActivityTypes } from '../types';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { defaultActivityIcon } from '../constants/activityConstants';

const { width } = Dimensions.get('window');

// Funzione per restituire l'icona corretta per ciascun tipo di attività
const getActivityHistoryIcon = (type: string): JSX.Element => {
  switch (type) {
    case ActivityTypes.Walking:
    case 'walking':
      return <FontAwesome5 name="walking" size={20} color="#4CAF50" />;
    case ActivityTypes.Running:
    case 'running':
      return <FontAwesome5 name="running" size={20} color="#2196F3" />;
    case ActivityTypes.Standing:
    case 'standing':
      return <FontAwesome5 name="user-alt" size={20} color="#9C27B0" />;
    case ActivityTypes.Fitness:
    case 'fitness':
      return <FontAwesome5 name="dumbbell" size={20} color="#FF5722" />;
    case ActivityTypes.Cycling:
    case 'cycling':
      return <FontAwesome5 name="bicycle" size={20} color="#FF9800" />;
    case ActivityTypes.Swimming:
    case 'swimming':
      return <FontAwesome5 name="swimmer" size={20} color="#00BCD4" />;
    case ActivityTypes.Driving:
    case 'driving':
      return <MaterialIcons name="directions-car" size={20} color="#9C27B0" />;
    case ActivityTypes.Sitting:
    case 'sitting':
      return <FontAwesome5 name="chair" size={20} color="#FF5722" />;
    case ActivityTypes.Yoga:
    case 'yoga':
      return <FontAwesome5 name="spa" size={20} color="#8BC34A" />;
    case ActivityTypes.Gym:
    case 'gym':
      return <FontAwesome5 name="dumbbell" size={20} color="#FF5722" />;
    case ActivityTypes.DogWalking:
    case 'dog-walking':
      return <FontAwesome5 name="dog" size={20} color="#795548" />;
    case ActivityTypes.Sleeping:
    case 'sleeping':
      return <FontAwesome5 name="bed" size={20} color="#607D8B" />;
    case ActivityTypes.Texting:
    case 'texting':
      return <FontAwesome5 name="comment-alt" size={20} color="#9E9E9E" />;
    case ActivityTypes.Studying:
    case 'studying':
      return <FontAwesome5 name="book" size={20} color="#3F51B5" />;
    case ActivityTypes.Unknown:
    case 'unknown':
      return <FontAwesome5 name="question" size={20} color="#757575" />;
    default:
      return <FontAwesome5 name={defaultActivityIcon} size={20} color="#757575" />;
  }
};

const ActivityHistory = () => {
  // Estrae dal contesto sia le attività che tutti i tipi di attività (predefiniti e custom)
  const { activities, allActivityTypes, customActivityTypes } = useContext(ActivityContext)!;
  const { user } = useContext(UserContext)!;

  const [userActivities, setUserActivities] = useState<Activity[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const userId = user?._id;
    const userActs = activities.filter(
      (activity) => activity.userId === userId
    );
    setUserActivities(userActs);
    setFilteredActivities(userActs);
  }, [activities, user]);

  // Applica i filtri sulle attività
  const applyFilters = () => {
    let filtered = userActivities;
    if (selectedActivityType) {
      filtered = filtered.filter(
        (activity) => activity.type === selectedActivityType
      );
    }
    if (filterStartDate) {
      filtered = filtered.filter(
        (activity) => activity.startTime >= filterStartDate
      );
    }
    if (filterEndDate) {
      filtered = filtered.filter(
        (activity) => activity.startTime <= filterEndDate!
      );
    }
    setFilteredActivities(filtered);
    setFilterModalVisible(false);
  };

  // Resetta i filtri
  const resetFilters = () => {
    setSelectedActivityType('');
    setFilterStartDate(null);
    setFilterEndDate(null);
    setFilteredActivities(userActivities);
    setFilterModalVisible(false);
  };

  // Gestione della selezione della data dal calendario
  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };

  // Render di un singolo item di attività in lista
  const renderActivityItem = ({ item }: { item: Activity }) => {
    return (
      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
          {getActivityHistoryIcon(item.type)}
          <Text style={styles.activityType}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={styles.activityDetails}>
          <View style={styles.activityTimeContainer}>
            <MaterialIcons name="access-time" size={16} color="#757575" />
            <Text style={styles.activityTime}>
              Inizio: {item.startTime.toLocaleString()}
            </Text>
          </View>
          {item.endTime && (
            <View style={styles.activityTimeContainer}>
              <MaterialIcons name="access-time" size={16} color="#757575" />
              <Text style={styles.activityTime}>
                Fine: {item.endTime.toLocaleString()}
              </Text>
            </View>
          )}
          {item.steps !== undefined && (
            <View style={styles.activityStepsContainer}>
              <FontAwesome5 name="running" size={16} color="#FF5722" />
              <Text style={styles.activitySteps}>Passi: {item.steps}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Prepara le date segnate per il calendario
  const markedDates: { [key: string]: any } = {};
  filteredActivities.forEach((activity) => {
    const date = activity.startTime.toISOString().split('T')[0];
    if (!markedDates[date]) {
      markedDates[date] = { marked: true, dots: [] };
    }
    markedDates[date].dots.push({ color: '#4CAF50' });
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Storico Attività</Text>

      {/* Selettore modalità di visualizzazione */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'list' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <FontAwesome5
            name="list"
            size={20}
            color={viewMode === 'list' ? '#fff' : '#757575'}
          />
          <Text
            style={[
              styles.viewModeButtonText,
              viewMode === 'list' && styles.viewModeButtonTextActive,
            ]}
          >
            Lista
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'calendar' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('calendar')}
        >
          <FontAwesome5
            name="calendar-alt"
            size={20}
            color={viewMode === 'calendar' ? '#fff' : '#757575'}
          />
          <Text
            style={[
              styles.viewModeButtonText,
              viewMode === 'calendar' && styles.viewModeButtonTextActive,
            ]}
          >
            Calendario
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pulsante per aprire il filtro */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <FontAwesome5 name="filter" size={20} color="#fff" />
        <Text style={styles.filterButtonText}> Filtra</Text>
      </TouchableOpacity>

      {/* Visualizzazione in modalità lista */}
      {viewMode === 'list' && (
        <>
          {filteredActivities.length > 0 ? (
            <FlatList
              data={filteredActivities.sort(
                (a, b) => b.startTime.getTime() - a.startTime.getTime()
              )}
              keyExtractor={(item, index) => `${item._id}-${index}`}
              renderItem={renderActivityItem}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <Text style={styles.noActivities}>
              Nessuna attività registrata.
            </Text>
          )}
        </>
      )}

      {/* Visualizzazione in modalità calendario */}
      {viewMode === 'calendar' && (
        <ScrollView>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={markedDates}
            markingType={'multi-dot'}
            theme={{
              todayTextColor: '#4CAF50',
              selectedDayBackgroundColor: '#4CAF50',
              arrowColor: '#4CAF50',
              dotColor: '#4CAF50',
            }}
          />
          {selectedDate ? (
            <>
              <Text style={styles.selectedDate}>
                Attività del {selectedDate}:
              </Text>
              {filteredActivities.filter(
                (activity) =>
                  activity.startTime.toISOString().split('T')[0] ===
                  selectedDate
              ).length > 0 ? (
                filteredActivities
                  .filter(
                    (activity) =>
                      activity.startTime.toISOString().split('T')[0] ===
                      selectedDate
                  )
                  .map((activity) => (
                    <View key={activity._id} style={styles.activityCard}>
                      <View style={styles.activityHeader}>
                        {getActivityHistoryIcon(activity.type)}
                        <Text style={styles.activityType}>
                          {activity.type.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.activityDetails}>
                        <View style={styles.activityTimeContainer}>
                          <MaterialIcons name="access-time" size={16} color="#757575" />
                          <Text style={styles.activityTime}>
                            Inizio: {activity.startTime.toLocaleTimeString()}
                          </Text>
                        </View>
                        {activity.endTime && (
                          <View style={styles.activityTimeContainer}>
                            <MaterialIcons name="access-time" size={16} color="#757575" />
                            <Text style={styles.activityTime}>
                              Fine: {activity.endTime.toLocaleTimeString()}
                            </Text>
                          </View>
                        )}
                        {activity.steps !== undefined && (
                          <View style={styles.activityStepsContainer}>
                            <FontAwesome5 name="running" size={16} color="#FF5722" />
                            <Text style={styles.activitySteps}>Passi: {activity.steps}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))
              ) : (
                <Text style={styles.noActivities}>
                  Nessuna attività per questa data.
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.noActivities}>
              Seleziona una data per vedere le attività.
            </Text>
          )}
        </ScrollView>
      )}

      {/* Modal per i filtri */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtra Attività</Text>

            {/* Filtro per tipo di attività: ora utilizziamo allActivityTypes dal contesto */}
            <Text style={styles.filterLabel}>Tipo di Attività:</Text>
            <ScrollView horizontal={true} style={styles.activityTypeContainer}>
              {allActivityTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.activityTypeButton,
                    selectedActivityType === type && styles.activityTypeButtonSelected,
                  ]}
                  onPress={() =>
                    setSelectedActivityType(selectedActivityType === type ? '' : type)
                  }
                >
                  {getActivityHistoryIcon(type)}
                  <Text
                    style={[
                      styles.activityTypeButtonText,
                      selectedActivityType === type && styles.activityTypeButtonTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filtro per intervallo di date */}
            <Text style={styles.filterLabel}>Data Inizio:</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker('start')}
            >
              <MaterialIcons name="date-range" size={20} color="#757575" />
              <Text style={styles.datePickerButtonText}>
                {filterStartDate
                  ? filterStartDate.toLocaleDateString()
                  : 'Seleziona Data Inizio'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.filterLabel}>Data Fine:</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker('end')}
            >
              <MaterialIcons name="date-range" size={20} color="#757575" />
              <Text style={styles.datePickerButtonText}>
                {filterEndDate
                  ? filterEndDate.toLocaleDateString()
                  : 'Seleziona Data Fine'}
              </Text>
            </TouchableOpacity>

            {/* DateTimePicker */}
            {showDatePicker && (
              <DateTimePicker
                value={
                  (showDatePicker === 'start' && filterStartDate) ||
                  (showDatePicker === 'end' && filterEndDate) ||
                  new Date()
                }
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    if (showDatePicker === 'start') {
                      setFilterStartDate(selectedDate);
                    } else {
                      setFilterEndDate(selectedDate);
                    }
                  }
                  setShowDatePicker(null);
                }}
              />
            )}

            {/* Pulsanti */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <FontAwesome5 name="check" size={16} color="#fff" />
                <Text style={styles.applyButtonText}> Applica Filtri</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <FontAwesome5 name="undo" size={16} color="#fff" />
                <Text style={styles.resetButtonText}> Reset Filtri</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <FontAwesome5 name="times" size={16} color="#fff" />
                <Text style={styles.cancelButtonText}> Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
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
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 30,
  },
  viewModeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  viewModeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#757575',
    fontWeight: '500',
  },
  viewModeButtonTextActive: {
    color: '#fff',
  },
  filterButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityType: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#1c1c1e',
  },
  activityDetails: {
    marginLeft: 30,
  },
  activityTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  activityTime: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 5,
  },
  activityStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  activitySteps: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 5,
  },
  noActivities: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
    color: '#757575',
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
    textAlign: 'center',
    color: '#1c1c1e',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1c1c1e',
  },
  filterLabel: {
    fontSize: 16,
    marginVertical: 10,
    color: '#1c1c1e',
  },
  activityTypeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  activityTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
    borderRadius: 20,
  },
  activityTypeButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  activityTypeButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  activityTypeButtonTextSelected: {
    color: '#fff',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginBottom: 10,
  },
  datePickerButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#757575',
    fontWeight: '500',
  },
  modalButtonContainer: {
    marginTop: 20,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    marginBottom: 10,
    paddingLeft: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f39c12',
    borderRadius: 20,
    marginBottom: 10,
    paddingLeft: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    paddingLeft: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default ActivityHistory;
