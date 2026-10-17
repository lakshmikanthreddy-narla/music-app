import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Library, User } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

import HomeScreen from '../screens/Home';
import SearchScreen from '../screens/Search';
import LibraryScreen from '../screens/Library';
import SettingsScreen from '../screens/Settings';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
        tabBarActiveTintColor: COLORS.accent.cyan,
        tabBarInactiveTintColor: '#5E7088',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="SearchTab" 
        component={SearchScreen} 
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <Search color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="LibraryTab" 
        component={LibraryScreen} 
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <Library color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={SettingsScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <User color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#091122',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 212, 255, 0.16)',
  },
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: 'transparent',
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  activeIconContainer: {
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  }
});
