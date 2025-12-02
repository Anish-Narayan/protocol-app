// apps/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Database, Hexagon, Scroll } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background, // Dynamic
          borderTopColor: colors.border,      // Dynamic
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary, // Dynamic
        tabBarInactiveTintColor: colors.textMuted, // Dynamic
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          letterSpacing: 1,
          textTransform: 'uppercase',
          fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
        },
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Protocol',
          tabBarIcon: ({ color, size }) => (
            <Hexagon color={color} size={size} strokeWidth={2} />
          ),
        }}
      />

      <Tabs.Screen
        name="directives"
        options={{
          title: 'Ad-Hoc',
          tabBarIcon: ({ color, size }) => (
            <Scroll color={color} size={size} strokeWidth={2} />
          ),
        }}
      />

      <Tabs.Screen
        name="config"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, size }) => (
            <Database color={color} size={size} strokeWidth={2} />
          ),
        }}
      />

    </Tabs>
  );
}