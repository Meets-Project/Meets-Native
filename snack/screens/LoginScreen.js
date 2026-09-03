import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { login } from '../services/api';
import { FormInput } from '../components/FormInput';
import { validateEmail, validatePassword } from '../utils/masks';

export function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Field error states for real-time feedback
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleEmailChange = (val) => {
    setEmail(val);
    if (emailError && val.trim()) {
      const v = validateEmail(val);
      setEmailError(v.valid ? '' : v.error);
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (passwordError && val) {
      const v = validatePassword(val, 6);
      setPasswordError(v.valid ? '' : v.error);
    }
  };

  async function handleLogin() {
    setMessage('');

    // Validar e-mail
    const emailVal = validateEmail(email);
    if (!emailVal.valid) {
      setEmailError(emailVal.error);
      return;
    }
    setEmailError('');

    // Validar senha
    const passVal = validatePassword(password, 6);
    if (!passVal.valid) {
      setPasswordError(passVal.error);
      return;
    }
    setPasswordError('');

    setBusy(true);
    try {
      await login(email.trim(), password);
      navigation.replace('MainTabs', { screen: 'home' });
    } catch (e) {
      setMessage(e.message || 'Erro ao realizar login.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name="movie-open-star-outline" size={42} color="#fff" />
        </View>
        <Text style={authStyles.heroTitle}>Entre no Meets</Text>
        <Text style={authStyles.heroText}>Faça login para salvar conteúdos e continuar de onde parou.</Text>
      </View>

      <View style={authStyles.card}>
        <FormInput
          label="E-mail"
          required
          value={email}
          onChangeText={handleEmailChange}
          placeholder="seuemail@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="email-outline"
          error={emailError}
          onBlur={() => {
            if (email) {
              const v = validateEmail(email);
              if (!v.valid) setEmailError(v.error);
            }
          }}
        />

        <FormInput
          label="Senha"
          required
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="Sua senha"
          secureTextEntry
          leftIcon="lock-outline"
          error={passwordError}
          onBlur={() => {
            if (password) {
              const v = validatePassword(password, 6);
              if (!v.valid) setPasswordError(v.error);
            }
          }}
        />

        {message ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#fff0f0',
              padding: 10,
              borderRadius: 8,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#ffd2d2',
            }}
          >
            <MaterialCommunityIcons name="alert-circle" size={18} color="#d93025" />
            <Text style={{ color: '#d93025', fontSize: 13, fontWeight: '600', flex: 1 }}>{message}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={authStyles.primaryButton}
          onPress={handleLogin}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={authStyles.primaryButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={authStyles.secondaryButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={authStyles.secondaryButtonText}>Criar conta</Text>
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
