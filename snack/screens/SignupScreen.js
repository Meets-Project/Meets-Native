import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { signup } from '../services/api';
import { FormInput } from '../components/FormInput';
import { validateEmail, validatePassword, validatePasswordMatch } from '../utils/masks';

export function SignupScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Field validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleNameChange = (val) => {
    setName(val);
    if (nameError && val.trim().length >= 2) {
      setNameError('');
    }
  };

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
    if (confirmPassword && val !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem.');
    } else if (confirmPassword && val === confirmPassword) {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (val) => {
    setConfirmPassword(val);
    if (password && val !== password) {
      setConfirmPasswordError('As senhas não coincidem.');
    } else {
      setConfirmPasswordError('');
    }
  };

  async function handleSignup() {
    setMessage('');

    if (name.trim().length < 2) {
      setNameError('Informe seu nome completo (mínimo 2 caracteres).');
      return;
    }
    setNameError('');

    const emailVal = validateEmail(email);
    if (!emailVal.valid) {
      setEmailError(emailVal.error);
      return;
    }
    setEmailError('');

    const passVal = validatePassword(password, 6);
    if (!passVal.valid) {
      setPasswordError(passVal.error);
      return;
    }
    setPasswordError('');

    const matchVal = validatePasswordMatch(password, confirmPassword);
    if (!matchVal.valid) {
      setConfirmPasswordError(matchVal.error);
      return;
    }
    setConfirmPasswordError('');

    setBusy(true);
    try {
      await signup(name.trim(), email.trim(), password);
      navigation.replace('MainTabs', { screen: 'profile' });
    } catch (e) {
      setMessage(e.message || 'Erro ao criar conta.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name="account-plus-outline" size={42} color="#fff" />
        </View>
        <Text style={authStyles.heroTitle}>Crie sua conta</Text>
        <Text style={authStyles.heroText}>Seus dados ficam persistidos no PostgreSQL.</Text>
      </View>

      <View style={authStyles.card}>
        <FormInput
          label="Nome Completo"
          required
          value={name}
          onChangeText={handleNameChange}
          placeholder="Seu nome completo"
          leftIcon="account-outline"
          error={nameError}
          onBlur={() => {
            if (name && name.trim().length < 2) {
              setNameError('Informe seu nome completo (mínimo 2 caracteres).');
            }
          }}
        />

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
          placeholder="Mínimo de 6 caracteres"
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

        <FormInput
          label="Confirmar Senha"
          required
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          placeholder="Repita a senha criada"
          secureTextEntry
          leftIcon="lock-check-outline"
          error={confirmPasswordError}
          onBlur={() => {
            if (confirmPassword) {
              const v = validatePasswordMatch(password, confirmPassword);
              if (!v.valid) setConfirmPasswordError(v.error);
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
          onPress={handleSignup}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={authStyles.primaryButtonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>

        <View style={authStyles.footerRow}>
          <Text style={authStyles.footerText}>Já tem uma conta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={authStyles.footerLink}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
