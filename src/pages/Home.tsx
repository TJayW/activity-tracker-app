// src/pages/Home.tsx
import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  FC,
  memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  TextInput,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { ActivityContext } from '../context/ActivityContext';
import { StatsContext } from '../context/StatsContext';
import { ActivityTypes, ActivityType, Activity } from '../types';
import { activityIconMapping, defaultActivityIcon } from '../constants/activityConstants';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 90;
const MULTIPLIER = 3;

interface ActivityItemProps {
  item: string;
  index: number;
  scrollX: Animated.Value;
  isSelected: boolean;
  onPress: (item: string, index: number) => void;
  getIcon: (activityType: string) => string;
}

const ActivityItem: FC<ActivityItemProps> = memo(
  ({ item, index, scrollX, isSelected, onPress, getIcon }) => {
    const inputRange = [
      (index - 2) * ITEM_WIDTH,
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
      (index + 2) * ITEM_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 0.85, 1, 0.85, 0.7],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 0.7, 1, 0.7, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.activityItem, { transform: [{ scale }], opacity }]}>
        <TouchableOpacity
          onPress={() => onPress(item, index)}
          style={styles.itemTouchable}
        >
          <FontAwesome5
            name={getIcon(item)}
            size={40}
            color={isSelected ? '#007AFF' : '#888'}
          />
          <Text
            style={[styles.activityItemText, isSelected && styles.selectedActivityText]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {item}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

const Home: FC = () => {
  // CONTEXTS
  const userContext = useContext(UserContext);
  const activityContext = useContext(ActivityContext);
  const statsContext = useContext(StatsContext);

  if (!userContext) {
    console.error("Home deve essere annidato all'interno di UserProvider");
    return null;
  }
  if (!activityContext) {
    console.error("Home deve essere annidato all'interno di ActivityProvider");
    return null;
  }
  if (!statsContext) {
    console.error("Home deve essere annidato all'interno di StatsProvider");
    return null;
  }

  // STATE
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType>(ActivityTypes.Walking);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [customActivityInput, setCustomActivityInput] = useState<string>('');
  const [dailySteps, setDailySteps] = useState<number>(0);

  // Animated value per lo scroll
  const scrollX = useRef(new Animated.Value(0)).current;
  // Riferimento alla FlatList
  const flatListRef = useRef<FlatList<string>>(null);

  // Estrazione dei dati dai contesti
  const { user } = userContext;
  const {
    allActivityTypes,
    addCustomActivityType,
    startNewActivity,
    stopCurrentActivity,
  } = activityContext;
  const { getDailySteps } = statsContext;

  // Inizializza lo state delle icone con il mapping importato
  const [activityIcons, setActivityIcons] = useState<{ [key: string]: string }>(activityIconMapping);

  useEffect(() => {
    const steps = getDailySteps(new Date());
    setDailySteps(steps);
  }, [activityContext.activities, getDailySteps]);

  // Prepara i dati per lo slider "circolare"
  const infiniteData = useMemo(() => {
    if (!allActivityTypes || allActivityTypes.length === 0) return [];
    let data: string[] = [];
    for (let i = 0; i < MULTIPLIER; i++) {
      data = data.concat(allActivityTypes);
    }
    return data;
  }, [allActivityTypes]);

  // Imposta lo scroll iniziale al centro
  useEffect(() => {
    if (infiniteData.length > 0 && flatListRef.current && allActivityTypes.length > 0) {
      const initialIndex = allActivityTypes.length;
      flatListRef.current.scrollToOffset({
        offset: initialIndex * ITEM_WIDTH,
        animated: false,
      });
      setSelectedIndex(initialIndex);
      setSelectedActivityType(infiniteData[initialIndex] as ActivityType);
    }
  }, [infiniteData, allActivityTypes]);

  // Ritorna l'icona corretta per una data attività
  const getActivityIcon = (activityType: string): string => {
    return activityIcons[activityType] || defaultActivityIcon;
  };

  // Gestione del tocco su un'attività: scrolla fino all'elemento toccato
  const handleActivityPress = (item: string, index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: index * ITEM_WIDTH, animated: true });
    }
    setSelectedIndex(index);
    setSelectedActivityType(item as ActivityType);
  };

  // Alla fine dello scroll, calcola l'indice centrale e ricentra la lista se necessario
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    let index = Math.round(offset / ITEM_WIDTH);

    if (index < allActivityTypes.length) {
      index += allActivityTypes.length;
      flatListRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: false,
      });
    } else if (index >= 2 * allActivityTypes.length) {
      index -= allActivityTypes.length;
      flatListRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: false,
      });
    }

    setSelectedIndex(index);
    const modIndex = index % allActivityTypes.length;
    setSelectedActivityType(allActivityTypes[modIndex]);
  };

  // Avvia una nuova attività
  const handleStartActivity = async () => {
    if (!user || !user._id) {
      Alert.alert('Errore', "Utente non definito. Impossibile avviare l'attività.");
      return;
    }
    try {
      const newActivity = await startNewActivity(selectedActivityType, user._id);
      setCurrentActivity(newActivity);
    } catch (error) {
      Alert.alert('Errore', "Impossibile avviare l'attività.");
    }
  };

  // Ferma l'attività corrente
  const handleStopActivity = async () => {
    if (currentActivity) {
      try {
        await stopCurrentActivity();
        setCurrentActivity(null);
        Alert.alert('Successo', "Attività salvata con successo.");
      } catch (error) {
        Alert.alert('Errore', "Impossibile salvare l'attività.");
      }
    }
  };

  // Aggiunge una nuova attività personalizzata
  const handleAddCustomActivity = async () => {
    if (customActivityInput.trim() === '') {
      Alert.alert('Errore', "Inserisci un nome valido per l'attività");
      return;
    }

    try {
      const newActivityType = customActivityInput.trim();
      await addCustomActivityType(newActivityType);

      const predefinedIcons: { [key: string]: string } = {
        yoga: 'spa',
        boxing: 'fist-raised',
        dancing: 'user-friends',
        meditation: 'praying-hands',
      };

      const iconKey = newActivityType.toLowerCase().replace(/\s+/g, '_');
      const newIconName = predefinedIcons[iconKey] || defaultActivityIcon;

      setActivityIcons((prevIcons) => ({
        ...prevIcons,
        [newActivityType]: newIconName,
      }));

      setCustomActivityInput('');
      setModalVisible(false);
      Alert.alert('Successo', "Attività personalizzata aggiunta con successo.");
    } catch (error) {
      Alert.alert('Errore', "Impossibile aggiungere l'attività personalizzata.");
    }
  };

  // Render del singolo item dello slider
  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = index === selectedIndex;
    return (
      <ActivityItem
        item={item}
        index={index}
        scrollX={scrollX}
        isSelected={isSelected}
        onPress={handleActivityPress}
        getIcon={getActivityIcon}
      />
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Home</Text>

      {/* Header con messaggio di benvenuto */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>👋 Benvenuto, {user?.name}</Text>
      </View>

      {/* Card Passi Giornalieri */}
      <View style={styles.stepsCard}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="shoe-prints" size={24} color="#4CAF50" />
          <Text style={styles.cardTitle}>Passi Giornalieri</Text>
        </View>
        <View style={styles.stepsInfo}>
          <Text style={styles.stepsCount}>{dailySteps}</Text>
          <Text style={styles.stepsLabel}>Passi</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min((dailySteps / 10000) * 100, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.stepsGoal}>Obiettivo: 10.000 passi</Text>
      </View>

      {/* Card Attività con slider */}
      <View style={[styles.activitiesCard, { overflow: 'hidden' }]}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="running" size={24} color="#FF5722" />
          <Text style={styles.cardTitle}>Attività</Text>
          <TouchableOpacity
            style={styles.addActivityButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="add-circle" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.carouselContainer}>
          <Animated.FlatList
            ref={flatListRef}
            data={infiniteData}
            keyExtractor={(_, index) => `${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            removeClippedSubviews
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            initialNumToRender={7}
            contentContainerStyle={{ paddingHorizontal: 2 * ITEM_WIDTH }}
            renderItem={renderItem}
          />
        </View>

        {/* Pulsanti per Avvia/Ferma attività */}
        <View style={styles.activityButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.activityButton,
              !currentActivity ? styles.startButton : styles.stopButton,
            ]}
            onPress={currentActivity ? handleStopActivity : handleStartActivity}
          >
            <Text style={styles.activityButtonText}>
              {currentActivity ? 'Ferma Attività' : 'Avvia Attività'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal per aggiungere attività personalizzata */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aggiungi Nuova Attività</Text>
            <TextInput
              style={styles.input}
              value={customActivityInput}
              onChangeText={setCustomActivityInput}
              placeholder="Inserisci nome attività"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddCustomActivity}>
              <Text style={styles.saveButtonText}>Aggiungi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
    color: '#1c1c1e',
    flex: 1,
  },
  stepsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  stepsInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stepsCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  stepsLabel: {
    fontSize: 24,
    color: '#666',
    marginLeft: 10,
    marginBottom: 5,
  },
  stepsGoal: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    maxWidth: '100%',
  },
  activitiesCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 15,
    marginHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carouselContainer: {
    width: ITEM_WIDTH * 5,
    alignSelf: 'center',
    height: 140,
    paddingVertical: 10,
  },
  activityItem: {
    width: ITEM_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  activityItemText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
  },
  selectedActivityText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  itemTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  activityButton: {
    paddingVertical: 20,
    paddingHorizontal: 60,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  activityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    marginHorizontal: 30,
    borderRadius: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    padding: 12,
    width: '100%',
    borderRadius: 10,
    borderColor: '#ccc',
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Home;
