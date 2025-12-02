// apps/_layout.tsx
import { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { Stack } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import AuthScreen from '../components/AuthScreen';
import { ThemeProvider, useTheme } from '../context/ThemeContext'; // Import Context

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { theme, themeName, toggleTheme, loading: themeLoading } = useTheme();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Wait for both Auth and Theme to load
  if (authLoading || themeLoading) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  const colors = theme.colors;

  if (!user) {
    return (
      <>
        <StatusBar barStyle={themeName === 'scifi' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <AuthScreen themeName={themeName} toggleTheme={toggleTheme} currentTheme={theme} />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={themeName === 'scifi' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}