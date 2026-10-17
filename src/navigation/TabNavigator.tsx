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
        tabBarActiveTintColor: COLORS.activeWhite,
        tabBarInactiveTintColor: COLORS.text.secondary,
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
            <View style={focused ? styles.activeIconCircle : styles.inactiveIconWrapper}>
              <Home color={focused ? COLORS.onWhite : COLORS.text.secondary} size={20} strokeWidth={focused ? 2.4 : 1.8} />
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
            <View style={focused ? styles.activeIconCircle : styles.inactiveIconWrapper}>
              <Search color={focused ? COLORS.onWhite : COLORS.text.secondary} size={20} strokeWidth={focused ? 2.4 : 1.8} />
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
            <View style={focused ? styles.activeIconCircle : styles.inactiveIconWrapper}>
              <Library color={focused ? COLORS.onWhite : COLORS.text.secondary} size={20} strokeWidth={focused ? 2.4 : 1.8} />
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
            <View style={focused ? styles.activeIconCircle : styles.inactiveIconWrapper}>
              <User color={focused ? COLORS.onWhite : COLORS.text.secondary} size={20} strokeWidth={focused ? 2.4 : 1.8} />
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
    backgroundColor: COLORS.tabBar,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.tabBarBorder,
  },
  tabBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    height: 68,
    borderRadius: 28,
    borderTopWidth: 0,
    elevation: 8,
    backgroundColor: 'transparent',
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  activeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.activeWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveIconWrapper: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
