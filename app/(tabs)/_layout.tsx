// apps/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Database, Hexagon, Scroll } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import this
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = theme.colors;
  
  // Get safe area insets (top, bottom, left, right)
  const insets = useSafeAreaInsets();

  // Define the height of the actual tab content (icons + text)
  const TAB_CONTENT_HEIGHT = 60;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          
          // RESPONSIVE HEIGHT CALCULATION:
          // Content height + the device's bottom safe area (home indicator)
          height: TAB_CONTENT_HEIGHT + insets.bottom,
          
          // Push content up away from the home indicator
          // If no inset (old phones), add a small 10px buffer
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 5, // Add a little breathing room for the text
          fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
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