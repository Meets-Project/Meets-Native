import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';

export function LoginScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name="movie-open-star-outline" size={42} color="#ffffff" />
        </View>
        <Text style={authStyles.heroTitle}>Entre no Meets</Text>
        <Text style={authStyles.heroText}>
          Faça login para salvar resenhas, seguir perfis e continuar de onde parou.
        </Text>
      </View>

      <View style={authStyles.card}>
        <View style={authStyles.field}>
          <Text style={authStyles.fieldLabel}>E-mail</Text>
          <TextInput
            style={authStyles.fieldInput}
            placeholder="seuemail@exemplo.com"
            placeholderTextColor="#9a9a9a"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={authStyles.field}>
          <Text style={authStyles.fieldLabel}>Senha</Text>
          <TextInput
            style={authStyles.fieldInput}
            placeholder="Sua senha"
            placeholderTextColor="#9a9a9a"
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={authStyles.primaryButton} onPress={() => navigation.replace('MainTabs', { screen: 'home' })}>
          <Text style={authStyles.primaryButtonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={authStyles.secondaryButton} onPress={() => navigation.navigate('Signup')}>
          <Text style={authStyles.secondaryButtonText}>Criar conta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={authStyles.guestButton} onPress={() => navigation.replace('MainTabs', { screen: 'home' })}>
          <Text style={authStyles.guestButtonText}>Entrar como visitante</Text>
        </TouchableOpacity>

        <View style={authStyles.footerRow}>
          <Text style={authStyles.footerText}>Ainda não tem conta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={authStyles.footerLink}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
