import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigation from './navigation/AppNavigation';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}