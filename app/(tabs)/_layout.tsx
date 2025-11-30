import { Tabs } from 'expo-router';
import { Home, Settings, Cpu, Pyramid } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PROTOCOL_THEMES } from '../../constants/ProtocolThemes';

export default function TabLayout() {
  const [themeName, setThemeName] = useState<'scifi' | 'egypt'>('scifi');

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((val) => {
      if (val === 'scifi' || val === 'egypt') setThemeName(val);
    });
  }, []);

  const theme = PROTOCOL_THEMES[themeName];
  const colors = theme.colors;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { 
        backgroundColor: colors.surface, 
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 5,
        paddingTop: 5
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarShowLabel: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }: { color?: string }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          tabBarIcon: ({ color }: { color?: string }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}