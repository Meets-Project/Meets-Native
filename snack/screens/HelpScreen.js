import React from 'react';
import { View, Text } from 'react-native';
import { screenStyles } from '../styles/screenStyles';

export function HelpScreen() {
  return (
    <View style={screenStyles.listContent}>
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Ajuda</Text>
        <Text style={screenStyles.sectionText}>FAQ e contatos de suporte.</Text>
      </View>
    </View>
  );
}
