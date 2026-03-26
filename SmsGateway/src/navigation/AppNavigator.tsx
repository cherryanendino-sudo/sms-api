import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {DashboardScreen} from '../screens/DashboardScreen';
import {QueueScreen} from '../screens/QueueScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {LogsScreen} from '../screens/LogsScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E1E2E',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#E0E0E0',
          tabBarStyle: {
            backgroundColor: '#1E1E2E',
            borderTopColor: '#2A2A3A',
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: '#808090',
        }}>
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'SMS Gateway',
            tabBarLabel: 'Dashboard',
          }}
        />
        <Tab.Screen
          name="Queue"
          component={QueueScreen}
          options={{
            title: 'Message Queue',
            tabBarLabel: 'Queue',
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
          }}
        />
        <Tab.Screen
          name="Logs"
          component={LogsScreen}
          options={{
            title: 'Activity Logs',
            tabBarLabel: 'Logs',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
