import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';

export function ShareProfileScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent}>
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name="share-variant-outline" size={42} color="#ffffff" />
        </View>
        <Text style={authStyles.heroTitle}>Compartilhar perfil</Text>
        <Text style={authStyles.heroText}>Copie seu link ou envie para alguém da sua rede.</Text>
      </View>

      <View style={authStyles.card}>
        <TouchableOpacity style={authStyles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={authStyles.primaryButtonText}>Copiar link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={authStyles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={authStyles.secondaryButtonText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
