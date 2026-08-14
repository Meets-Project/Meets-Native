import React from 'react';
import { View, Text } from 'react-native';
import { screenStyles } from '../styles/screenStyles';

export function AboutScreen() {
  return (
    <View style={[screenStyles.listContent]}> 
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Sobre</Text>
        <Text style={screenStyles.sectionText}>Informações sobre o aplicativo Meets.</Text>
      </View>
    </View>
  );
}
