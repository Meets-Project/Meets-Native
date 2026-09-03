import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';

export function AboutScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <MaterialCommunityIcons name="information-outline" size={28} color={colors.primary} />
          <Text style={screenStyles.sectionTitle}>Sobre o Meets</Text>
        </View>
        <Text style={screenStyles.sectionText}>
          O Meets é a plataforma colaborativa feita para conectar pessoas, eventos, palestras e experiências incríveis.
        </Text>
      </View>

      <View style={[screenStyles.sectionCard, { marginTop: 14 }]}>
        <Text style={[screenStyles.sectionTitle, { fontSize: 14 }]}>Detalhes da Aplicação</Text>
        <View style={screenStyles.rowItem}>
          <Text style={screenStyles.rowTitle}>Versão</Text>
          <Text style={screenStyles.rowSubtitle}>1.0.0 (Release)</Text>
        </View>
        <View style={screenStyles.rowItem}>
          <Text style={screenStyles.rowTitle}>Banco de Dados</Text>
          <Text style={screenStyles.rowSubtitle}>PostgreSQL</Text>
        </View>
        <View style={[screenStyles.rowItem, screenStyles.rowItemLast]}>
          <Text style={screenStyles.rowTitle}>Plataforma</Text>
          <Text style={screenStyles.rowSubtitle}>React Native & Expo</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[screenStyles.createButton, { marginTop: 18, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
        onPress={() => navigation.navigate('MainTabs', { screen: 'home' })}
      >
        <MaterialCommunityIcons name="arrow-left" size={18} color="#ffffff" />
        <Text style={screenStyles.createButtonText}>Voltar ao Início</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
