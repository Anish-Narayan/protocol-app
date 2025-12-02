// context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROTOCOL_THEMES } from '../constants/ProtocolThemes';
type ThemeName = 'scifi' | 'egypt';

interface ThemeContextType {
  themeName: ThemeName;
  toggleTheme: () => void;
  theme: any; // The actual theme object (colors, etc.)
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('scifi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem('app_theme');
        if (stored === 'scifi' || stored === 'egypt') {
          setThemeName(stored);
        }
      } catch (e) {
        console.error("Failed to load theme", e);
      } finally {
        setLoading(false);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const nextTheme = themeName === 'scifi' ? 'egypt' : 'scifi';
    setThemeName(nextTheme);
    await AsyncStorage.setItem('app_theme', nextTheme);
  };

  const value = {
    themeName,
    toggleTheme,
    theme: PROTOCOL_THEMES[themeName],
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};