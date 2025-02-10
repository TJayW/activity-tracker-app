// src/pages/Settings.tsx

import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { UserContext } from '../context/UserContext';
import { NotificationContext } from '../context/NotificationContext';
import { PermissionContext } from '../context/PermissionContext';
import { User, Notification as AppNotification } from '../types';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const Settings = () => {
  const userContext = useContext(UserContext);
  const notificationContext = useContext(NotificationContext);
  const permissionContext = useContext(PermissionContext);

  if (!userContext || !notificationContext || !permissionContext) return null;

  const { user, setUser } = userContext;
  const { notifications, fetchUserNotifications, markNotificationAsRead, deleteNotification } = notificationContext;
  const {
    foregroundLocationGranted,
    backgroundLocationGranted,
    notificationGranted,
    requestForegroundPermissions,
    requestBackgroundPermissions,
    requestNotificationPermissions,
    requestAllPermissions,
  } = permissionContext;

  // Stato locale per i dati dell'utente
  const [localUser, setLocalUser] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
  }, [user]);

  // Ricarica le notifiche automaticamente se l'utente è definito e i permessi per le notifiche sono concessi
  useEffect(() => {
    if (user?._id && notificationGranted) {
      fetchUserNotifications(user._id);
    }
  }, [user, notificationGranted]);

  // Funzione per salvare/modificare i dati utente
  const handleSaveUser = async () => {
    if (!localUser) {
      Alert.alert('Errore', 'Nessun utente registrato.');
      return;
    }

    if (!localUser.name || !localUser.email) {
      Alert.alert('Errore', 'Per favore, compila tutti i campi utente.');
      return;
    }

    try {
      const updatedUser = { ...localUser, isRegistered: true };
      await setUser(updatedUser);
      Alert.alert('Successo', 'Dati utente salvati con successo.');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare i dati utente.');
    }
  };

  // Funzione per aprire le impostazioni del dispositivo
  const openAppSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert('Errore', 'Impossibile aprire le impostazioni del dispositivo.');
    });
  };

  // Handler per fetchUserNotifications (richiamato anche dal pulsante sottostante)
  const handleFetchNotifications = async () => {
    if (user?._id) {
      try {
        await fetchUserNotifications(user._id);
        Alert.alert('Successo', 'Notifiche caricate con successo.');
      } catch (error) {
        Alert.alert('Errore', 'Impossibile caricare le notifiche.');
      }
    } else {
      Alert.alert('Errore', 'Utente non trovato.');
    }
  };

  // Funzione per gestire la visualizzazione dei valori numerici negli input
  const displayValue = (value?: number) => {
    return value && value > 0 ? value.toString() : '';
  };

  // Render Item per FlatList delle notifiche (mostrando le più recenti in cima)
  const renderNotificationItem = ({ item }: { item: AppNotification }) => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIconContainer}>
          <FontAwesome5 name="bell" size={20} color="#FFC107" />
        </View>
        <View style={styles.notificationHeaderText}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationDate}>
            {new Date(item.sentAt).toLocaleString()}
          </Text>
        </View>
      </View>
      <Text style={styles.notificationBody}>{item.body}</Text>
      <View style={styles.notificationActions}>
        {!item.readAt && (
          <TouchableOpacity onPress={() => markNotificationAsRead(item._id)}>
            <Text style={styles.markReadButton}>Segna come letto</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => deleteNotification(item._id)}>
          <MaterialIcons name="delete" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Funzione per richiedere i permessi delle notifiche
  const handleRequestNotificationPermissions = async () => {
    await requestNotificationPermissions();
  };

  // Funzione per richiedere i permessi di localizzazione foreground
  const handleRequestForegroundPermissions = async () => {
    await requestForegroundPermissions();
  };

  // Funzione per richiedere i permessi di localizzazione background
  const handleRequestBackgroundPermissions = async () => {
    await requestBackgroundPermissions();
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Impostazioni</Text>

          {/* Informazioni Utente */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="user-circle" size={24} color="#4CAF50" />
              <Text style={styles.cardTitle}>Informazioni Utente</Text>
            </View>
            {localUser ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nome</Text>
                  <View style={styles.inputWrapper}>
                    <FontAwesome5 name="user-alt" size={20} color="#555" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nome"
                      value={localUser.name}
                      onChangeText={(text) => setLocalUser({ ...localUser, name: text })}
                      autoCapitalize="words"
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="email" size={20} color="#555" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      value={localUser.email}
                      onChangeText={(text) => setLocalUser({ ...localUser, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Altezza (cm)</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="height" size={20} color="#555" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Altezza (cm)"
                      value={displayValue(localUser.height)}
                      onChangeText={(text) => {
                        const parsedHeight = parseFloat(text);
                        setLocalUser({
                          ...localUser,
                          height: !isNaN(parsedHeight) && parsedHeight > 0 ? parsedHeight : undefined,
                        });
                      }}
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  </View>
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>Età</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="cake" size={20} color="#555" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Età"
                        value={displayValue(localUser.age)}
                        onChangeText={(text) => {
                          const parsedAge = parseInt(text);
                          setLocalUser({
                            ...localUser,
                            age: !isNaN(parsedAge) && parsedAge > 0 ? parsedAge : undefined,
                          });
                        }}
                        keyboardType="numeric"
                        returnKeyType="next"
                        blurOnSubmit={false}
                      />
                    </View>
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>Peso (kg)</Text>
                    <View style={styles.inputWrapper}>
                      <FontAwesome5 name="weight-hanging" size={20} color="#555" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Peso (kg)"
                        value={displayValue(localUser.weight)}
                        onChangeText={(text) => {
                          const parsedWeight = parseFloat(text);
                          setLocalUser({
                            ...localUser,
                            weight: !isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined,
                          });
                        }}
                        keyboardType="numeric"
                        returnKeyType="done"
                        blurOnSubmit={false}
                      />
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveUser}>
                  <Text style={styles.saveButtonText}>Salva i tuoi dati</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.userInfo}>Nessun utente registrato. Modalità Ospite attiva.</Text>
            )}
          </View>

          {/* Permessi e Notifiche */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="shield-alt" size={24} color="#2196F3" />
              <Text style={styles.cardTitle}>Permessi & Notifiche</Text>
            </View>
            <View style={styles.permissionsContainer}>
              {/* Permessi di Localizzazione in Foreground */}
              <View style={styles.permissionItem}>
                <MaterialIcons name="location-on" size={24} color="#4CAF50" style={styles.permissionIcon} />
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionLabel}>Localizzazione in Foreground </Text>
                  <Text style={styles.permissionStatus}>
                    {foregroundLocationGranted ? 'Concesso' : 'Non Concesso'}
                  </Text>
                </View>
                {!foregroundLocationGranted && (
                  <TouchableOpacity onPress={handleRequestForegroundPermissions}>
                    <Text style={styles.permissionRequest}>Richiedi</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* Permessi di Localizzazione in Background */}
              <View style={styles.permissionItem}>
                <MaterialIcons name="location-on" size={24} color="#FF9800" style={styles.permissionIcon} />
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionLabel}>Localizzazione in Background</Text>
                  <Text style={styles.permissionStatus}>
                    {backgroundLocationGranted ? 'Concesso' : 'Non Concesso'}
                  </Text>
                </View>
                {!backgroundLocationGranted && (
                  <TouchableOpacity onPress={handleRequestBackgroundPermissions}>
                    <Text style={styles.permissionRequest}>Richiedi</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* Permessi di Notifiche */}
              <View style={styles.permissionItem}>
                <MaterialIcons name="notifications" size={24} color="#F44336" style={styles.permissionIcon} />
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionLabel}>Notifiche</Text>
                  <Text style={styles.permissionStatus}>
                    {notificationGranted ? 'Concesso' : 'Non Concesso'}
                  </Text>
                </View>
                {!notificationGranted && (
                  <TouchableOpacity onPress={handleRequestNotificationPermissions}>
                    <Text style={styles.permissionRequest}>Richiedi</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {/* Bottoni per richiedere permessi solo se necessario */}
            {(!foregroundLocationGranted || !backgroundLocationGranted || !notificationGranted) && (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.button} onPress={requestAllPermissions}>
                  <Text style={styles.buttonText}>Richiedi Tutti i Permessi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonSecondary} onPress={openAppSettings}>
                  <Text style={styles.buttonText}>Apri Impostazioni</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Se le notifiche sono concesse, mostra il pulsante per caricare e la lista delle notifiche */}
            {notificationGranted && (
              <>
                <TouchableOpacity style={styles.button} onPress={handleFetchNotifications}>
                  <Text style={styles.buttonText}>Carica Notifiche</Text>
                </TouchableOpacity>
                <FlatList
                  data={[...notifications].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())}
                  keyExtractor={(item: AppNotification) => item._id.toString()}
                  renderItem={renderNotificationItem}
                  ListEmptyComponent={<Text style={styles.emptyText}>Nessuna notifica disponibile.</Text>}
                  scrollEnabled={false}
                  style={styles.notificationsList}
                />
              </>
            )}
            {!notificationGranted && (
              <Text style={styles.permissions}>Permessi per le notifiche non concessi.</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
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
    shadowOffset: { width: 0, height: 2 },
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
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
    color: '#1c1c1e',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 30,
    fontSize: 14,
    color: '#333',
    marginVertical: 5,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationHeaderText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  notificationDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  markReadButton: {
    fontSize: 14,
    color: '#007aff',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
    color: '#777',
  },
  permissionsContainer: {
    marginBottom: 10,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  permissionIcon: {
    marginRight: 10,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  permissionStatus: {
    fontSize: 14,
    color: '#555',
  },
  permissionRequest: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  permissions: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
    textAlign: 'center',
  },
  notificationsList: {
    marginTop: 10,
  },
  buttonsContainer: {
    marginTop: 10,
  },
});

export default Settings;
