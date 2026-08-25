import React from 'react';
import { View, Text } from 'react-native';
import { screenStyles } from '../styles/screenStyles';

export function SettingsScreen() {
  return (
    <View style={screenStyles.listContent}>
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Configurações</Text>
        <Text style={screenStyles.sectionText}>Aqui você encontrará opções do aplicativo.</Text>
      </View>
    </View>
  );
}
