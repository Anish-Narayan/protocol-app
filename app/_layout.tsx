import { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { Stack } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth } from '../firebaseConfig';
import { PROTOCOL_THEMES } from '../constants/ProtocolThemes';
import AuthScreen from '../components/AuthScreen';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeName, setThemeName] = useState<'scifi' | 'egypt'>('scifi');

  // Load Theme
  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((val) => {
      if (val === 'scifi' || val === 'egypt') setThemeName(val);
    });
  }, []);

  // Listen for User
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleTheme = () => {
    const next = themeName === 'scifi' ? 'egypt' : 'scifi';
    setThemeName(next);
    AsyncStorage.setItem('app_theme', next);
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  const currentTheme = PROTOCOL_THEMES[themeName];

  if (!user) {
    return (
        <>
            <StatusBar barStyle={currentTheme.colors.status as any} backgroundColor={currentTheme.colors.background} />
            <AuthScreen themeName={themeName} toggleTheme={toggleTheme} currentTheme={currentTheme} />
        </>
    );
  }

  return (
    <>
      <StatusBar barStyle={currentTheme.colors.status as any} backgroundColor={currentTheme.colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}