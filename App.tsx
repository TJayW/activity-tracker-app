// App.tsx

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UserProvider } from './src/context/UserContext';
import { ActivityProvider } from './src/context/ActivityContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { PermissionProvider } from './src/context/PermissionContext';
import { GeofenceProvider } from './src/context/GeofenceContext';
import { StatsProvider } from './src/context/StatsContext';
import routes from './routes';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { View, StatusBar } from 'react-native';
import './src/services/SensorService';
import { clearAllData } from './src/services/AsyncStorageService';

const Tab = createBottomTabNavigator();

const App = () => {
  useEffect(() => {
    // Cancella tutti i dati all'avvio dell'app (opzionale)
    // clearAllData();
  }, []);

  return (
    <UserProvider>
      <PermissionProvider>
        <ActivityProvider>
          <StatsProvider>
            <GeofenceProvider>
              <NotificationProvider>
                <NavigationContainer>
                  <View
                    style={{
                      flex: 1,
                      paddingTop: 35,
                      backgroundColor: '#f2f2f7',
                    }}
                  >
                    <Tab.Navigator
                      screenOptions={({ route }) => ({
                        headerShown: false,
                        tabBarIcon: ({ focused, color, size }) => {
                          let iconName: string;
                          let IconComponent: any;

                          switch (route.name) {
                            case 'Home':
                              IconComponent = FontAwesome5;
                              iconName = 'home';
                              break;
                            case 'ActivityHistory':
                              IconComponent = MaterialIcons;
                              iconName = 'history';
                              break;
                            case 'Statistics':
                              IconComponent = FontAwesome5;
                              iconName = 'chart-bar';
                              break;
                            case 'Geofence':
                              IconComponent = MaterialIcons;
                              iconName = 'gps-fixed';
                              break;
                            case 'Settings':
                              IconComponent = MaterialIcons;
                              iconName = 'settings';
                              break;
                            default:
                              IconComponent = FontAwesome5;
                              iconName = 'circle';
                              break;
                          }

                          return (
                            <IconComponent name={iconName} size={size} color={color} />
                          );
                        },
                        tabBarActiveTintColor: '#007AFF',
                        tabBarInactiveTintColor: 'gray',
                        tabBarShowLabel: false,
                        tabBarStyle: {
                          height: 60,
                          paddingBottom: 5,
                        },
                      })}
                    >
                      {routes.map((route) => (
                        <Tab.Screen
                          key={route.name}
                          name={route.name}
                          component={route.component}
                          options={route.options}
                        />
                      ))}
                    </Tab.Navigator>
                  </View>
                </NavigationContainer>
              </NotificationProvider>
            </GeofenceProvider>
          </StatsProvider>
        </ActivityProvider>
      </PermissionProvider>
    </UserProvider>
  );
};

export default App;
