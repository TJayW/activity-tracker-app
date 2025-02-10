// src/pages/Geofence.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  Modal,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ActivityContext } from '../context/ActivityContext';
import { PermissionContext } from '../context/PermissionContext';
import { Geofence, ActivityType, ActivityTypes } from '../types';
import * as Location from 'expo-location';
import { GeofenceContext } from '../context/GeofenceContext';
import { activityIconMapping, defaultActivityIcon } from '../constants/activityConstants';

const { width, height } = Dimensions.get('window');
const ITEM_WIDTH = 80;

const GeofencePage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [inputMethod, setInputMethod] = useState<'coordinates' | 'address'>('coordinates');
  const [activityType, setActivityType] = useState<ActivityType>('');
  const [geofenceName, setGeofenceName] = useState<string>('');
  const [radius, setRadius] = useState<number>(100);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: string; longitude: string } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [editGeofence, setEditGeofence] = useState<Geofence | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  const activityContext = useContext(ActivityContext);
  const geofenceContext = useContext(GeofenceContext);
  const permissionContext = useContext(PermissionContext);

  if (!activityContext || !geofenceContext || !permissionContext) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Caricamento...</Text>
      </View>
    );
  }

  const { allActivityTypes } = activityContext;
  const { geofences, addGeofence, updateGeofence, deleteGeofence, isMonitoring, startMonitoring, stopMonitoring } = geofenceContext;
  const { foregroundLocationGranted } = permissionContext;

  const handleSaveGeofence = async () => {
    if (!activityType || !geofenceName) {
      Alert.alert('Errore', 'Per favore, completa tutti i campi.');
      return;
    }

    let latitudeNum: number;
    let longitudeNum: number;

    if (inputMethod === 'coordinates') {
      if (!selectedLocation || !selectedLocation.latitude || !selectedLocation.longitude) {
        Alert.alert('Errore', 'Per favore, inserisci le coordinate manualmente.');
        return;
      }

      latitudeNum = parseFloat(selectedLocation.latitude);
      longitudeNum = parseFloat(selectedLocation.longitude);

      if (isNaN(latitudeNum) || isNaN(longitudeNum)) {
        Alert.alert('Errore', 'Latitudine e longitudine devono essere numeri validi.');
        return;
      }

      if (latitudeNum < -90 || latitudeNum > 90 || longitudeNum < -180 || longitudeNum > 180) {
        Alert.alert('Errore', 'Latitudine deve essere tra -90 e 90 e longitudine tra -180 e 180.');
        return;
      }
    } else {
      if (!address.trim()) {
        Alert.alert('Errore', 'Per favore, inserisci un indirizzo valido.');
        return;
      }

      setIsGeocoding(true);
      try {
        const geocodeResult = await Location.geocodeAsync(address);
        setIsGeocoding(false);

        if (geocodeResult.length === 0) {
          Alert.alert('Errore', 'Indirizzo non trovato. Per favore, inserisci un indirizzo valido.');
          return;
        }

        latitudeNum = geocodeResult[0].latitude;
        longitudeNum = geocodeResult[0].longitude;
      } catch (error) {
        setIsGeocoding(false);
        Alert.alert('Errore', 'Impossibile geocodificare l\'indirizzo. Riprova.');
        return;
      }
    }

    const geofenceData: Partial<Geofence> = {
      name: geofenceName,
      latitude: latitudeNum,
      longitude: longitudeNum,
      radius,
      activityType,
    };

    try {
      if (editGeofence) {
        await updateGeofence(editGeofence._id, geofenceData);
        Alert.alert('Successo', 'Geofence aggiornata con successo.');
      } else {
        await addGeofence(geofenceData);
        Alert.alert('Successo', 'Geofence aggiunta con successo.');
      }
      setModalVisible(false);
      resetModal();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare la geofence.');
    }
  };

  const handleDeleteGeofence = (id: number) => {
    Alert.alert(
      'Conferma Eliminazione',
      'Sei sicuro di voler eliminare questa geofence?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: () => performDeleteGeofence(id) },
      ]
    );
  };

  const performDeleteGeofence = async (id: number) => {
    try {
      await deleteGeofence(id);
      Alert.alert('Successo', 'Geofence eliminata con successo.');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile eliminare la geofence.');
    }
  };

  const resetModal = () => {
    setGeofenceName('');
    setActivityType('');
    setRadius(100);
    setSelectedLocation(null);
    setAddress('');
    setInputMethod('coordinates');
    setEditGeofence(null);
    setIsGeocoding(false);
  };

  const openEditModal = (geofence: Geofence) => {
    setEditGeofence(geofence);
    setGeofenceName(geofence.name);
    setActivityType(geofence.activityType || '');
    setRadius(geofence.radius);
    setInputMethod('coordinates');
    setSelectedLocation({ latitude: geofence.latitude.toString(), longitude: geofence.longitude.toString() });
    setAddress('');
    setModalVisible(true);
  };

  // Utilizza il mapping importato per ottenere il nome dell'icona
  const getActivityIcon = (activityType: ActivityType): string => {
    return activityIconMapping[activityType] || defaultActivityIcon;
  };

  const toggleMonitoring = async (value: boolean) => {
    if (value) {
      await startMonitoring();
    } else {
      await stopMonitoring();
    }
  };

  const renderGeofenceItem = ({ item }: { item: Geofence }) => (
    <View style={styles.geofenceItem}>
      <View style={styles.geofenceHeader}>
        <FontAwesome5 name="map-marker-alt" size={20} color="#4CAF50" />
        <Text style={styles.geofenceName}>{item.name}</Text>
      </View>
      <Text style={styles.geofenceDetails}>
        Posizione: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
      </Text>
      <Text style={styles.geofenceDetails}>
        Raggio: {item.radius} metri
      </Text>
      <Text style={styles.geofenceDetails}>
        Attività: {item.activityType}
      </Text>
      {item.entryTime && (
        <Text style={styles.geofenceTimestamp}>
          Entrata: {new Date(item.entryTime).toLocaleString()}
        </Text>
      )}
      {item.exitTime && (
        <Text style={styles.geofenceTimestamp}>
          Uscita: {new Date(item.exitTime).toLocaleString()}
        </Text>
      )}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
          <FontAwesome5 name="edit" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteGeofence(item._id)}>
          <FontAwesome5 name="trash-alt" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestione Geofence</Text>

      {/* Sezione per il monitoraggio delle geofence */}
      <View style={styles.monitoringContainer}>
        <View style={styles.monitoringInfo}>
          <Text style={styles.monitoringText}>
            {isMonitoring ? 'Monitoraggio Attivo' : 'Monitoraggio Disattivo'}
          </Text>
          <Text style={styles.monitoringSubText}>
            {isMonitoring ? 'Le geofence sono attualmente monitorate.' : 'Il monitoraggio delle geofence è disabilitato.'}
          </Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isMonitoring ? '#fff' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleMonitoring}
          value={isMonitoring}
        />
      </View>

      {/* Lista delle Geofence */}
      <FlatList
        data={geofences}
        keyExtractor={(item: Geofence) => item._id.toString()}
        renderItem={renderGeofenceItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nessuna geofence registrata.</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        extraData={geofences}
      />

      {/* Pulsante per aggiungere una nuova Geofence */}
      {foregroundLocationGranted && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <FontAwesome5 name="plus-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Aggiungi Geofence</Text>
        </TouchableOpacity>
      )}

      {/* Modal per aggiungere o modificare una Geofence */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          resetModal();
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editGeofence ? 'Modifica Geofence' : 'Aggiungi Geofence'}
              </Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetModal(); }}>
                <FontAwesome5 name="times" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* ScrollView per il form */}
            <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Nome Geofence</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome Geofence"
                value={geofenceName}
                onChangeText={setGeofenceName}
              />

              <Text style={styles.label}>Tipo di Attività</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={activityType}
                  onValueChange={(itemValue) => setActivityType(itemValue)}
                  mode="dropdown"
                  style={styles.picker}
                >
                  <Picker.Item label="Seleziona un tipo di attività" value="" />
                  {allActivityTypes.map((type, index) => (
                    <Picker.Item key={`${type}-${index}`} label={type} value={type} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Raggio (metri): {radius}</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={50}
                maximumValue={1000}
                step={10}
                value={radius}
                onValueChange={(value) => setRadius(value)}
                minimumTrackTintColor="#007AFF"
                thumbTintColor="#007AFF"
              />

              {/* Selettore del Metodo di Inserimento */}
              <Text style={styles.label}>Metodo di Inserimento</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={inputMethod}
                  onValueChange={(itemValue) => {
                    setInputMethod(itemValue);
                    if (itemValue === 'coordinates') {
                      setAddress('');
                    } else {
                      setSelectedLocation(null);
                    }
                  }}
                  mode="dropdown"
                  style={styles.picker}
                >
                  <Picker.Item label="Coordinate Manuali" value="coordinates" />
                  <Picker.Item label="Indirizzo Geografico" value="address" />
                </Picker>
              </View>

              {inputMethod === 'coordinates' ? (
                <>
                  <Text style={styles.label}>Latitudine</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Inserisci la latitudine"
                    keyboardType="numeric"
                    value={selectedLocation ? selectedLocation.latitude : ''}
                    onChangeText={(text) => setSelectedLocation(prev => prev ? { ...prev, latitude: text } : { latitude: text, longitude: '' })}
                  />

                  <Text style={styles.label}>Longitudine</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Inserisci la longitudine"
                    keyboardType="numeric"
                    value={selectedLocation ? selectedLocation.longitude : ''}
                    onChangeText={(text) => setSelectedLocation(prev => prev ? { ...prev, longitude: text } : { latitude: '', longitude: text })}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Indirizzo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Inserisci l'indirizzo"
                    value={address}
                    onChangeText={setAddress}
                  />
                  <TouchableOpacity
                    style={styles.geocodeButton}
                    onPress={handleGeocodeAddress}
                    disabled={isGeocoding}
                  >
                    {isGeocoding ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.geocodeButtonText}>Geocodifica Indirizzo</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveGeofence}>
                <Text style={styles.saveButtonText}>Salva</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setModalVisible(false); resetModal(); }}>
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  async function handleGeocodeAddress() {
    if (!address.trim()) {
      Alert.alert('Errore', 'Per favore, inserisci un indirizzo valido.');
      return;
    }

    setIsGeocoding(true);
    try {
      const geocodeResult = await Location.geocodeAsync(address);
      setIsGeocoding(false);

      if (geocodeResult.length === 0) {
        Alert.alert('Errore', 'Indirizzo non trovato. Per favore, inserisci un indirizzo valido.');
        return;
      }

      const { latitude, longitude } = geocodeResult[0];
      setSelectedLocation({ latitude: latitude.toString(), longitude: longitude.toString() });
      Alert.alert('Successo', `Indirizzo geocodificato: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } catch (error) {
      setIsGeocoding(false);
      Alert.alert('Errore', 'Impossibile geocodificare l\'indirizzo. Riprova.');
    }
  }
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
  monitoringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginBottom: 15,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  monitoringInfo: {
    flex: 1,
    paddingRight: 10,
  },
  monitoringText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  monitoringSubText: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  geofenceItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  geofenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  geofenceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
    marginLeft: 10,
  },
  geofenceDetails: {
    fontSize: 14,
    color: '#555',
  },
  geofenceTimestamp: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#777',
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 50,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  label: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  pickerContainer: {
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  geocodeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  geocodeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default GeofencePage;
