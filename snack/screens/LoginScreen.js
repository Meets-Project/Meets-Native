import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { login } from '../services/auth';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Informe seu email e sua senha.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Não foi possível entrar', 'Email ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name="login" size={42} color="#ffffff" />
        </View>
        <Text style={authStyles.heroTitle}>Entrar</Text>
        <Text style={authStyles.heroText}>
          Acesse sua conta para continuar usando o app e sincronizar seus dados.
        </Text>
      </View>

      <View style={authStyles.card}>
        <View style={authStyles.field}>
          <Text style={authStyles.fieldLabel}>E-mail</Text>
          <TextInput
            style={authStyles.fieldInput}
            value={email}
            onChangeText={setEmail}
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
            value={password}
            onChangeText={setPassword}
            placeholder="Sua senha"
            placeholderTextColor="#9a9a9a"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={authStyles.primaryButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={authStyles.primaryButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={authStyles.guestButton}
          onPress={() => navigation.replace('MainTabs', { screen: 'home' })}
        >
          <Text style={authStyles.guestButtonText}>Continuar como visitante</Text>
        </TouchableOpacity>

        <View style={authStyles.footerRow}>
          <Text style={authStyles.footerText}>Ainda não tem conta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={authStyles.footerLink}>Cadastrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
