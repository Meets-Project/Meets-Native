import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { sendVerificationEmail, verifyEmail } from '../services/api';
import { FormInput } from '../components/FormInput';

export function EmailVerificationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || '';
  const developmentVerificationToken = route.params?.developmentVerificationToken || '';

  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [developmentCode, setDevelopmentCode] = useState(developmentVerificationToken);

  // Send verification email automatically on mount
  useEffect(() => {
    handleSendEmail(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSendEmail(silent = false) {
    if (sending || resendCooldown > 0) return;
    setSending(true);
    setMessage('');
    try {
      const result = await sendVerificationEmail();
      if (result?.developmentVerificationToken) {
        setDevelopmentCode(result.developmentVerificationToken);
      }
      setResendCooldown(60);
      if (!silent) {
        if (result?.sent === false) {
          setMessage('Não foi possível enviar o e-mail. Verifique a configuração do servidor.');
        } else {
          setMessage('E-mail reenviado! Verifique sua caixa de entrada.');
        }
      }
    } catch (e) {
      if (!silent) {
        setMessage(e.message || 'Erro ao enviar e-mail de verificação.');
      }
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    const code = token.trim();
    if (!code) {
      setTokenError('Informe o código recebido por e-mail.');
      return;
    }
    setTokenError('');
    setMessage('');
    setBusy(true);
    try {
      await verifyEmail(code);
      setSuccess(true);
    } catch (e) {
      setMessage(e.message || 'Código inválido ou expirado. Tente reenviar.');
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <View style={authStyles.hero}>
          <View style={[authStyles.logoMark, { backgroundColor: '#2e7d32' }]}>
            <MaterialCommunityIcons name="email-check-outline" size={42} color="#fff" />
          </View>
          <Text style={authStyles.heroTitle}>E-mail verificado!</Text>
          <Text style={authStyles.heroText}>Sua conta foi confirmada com sucesso.</Text>
        </View>

        <View style={authStyles.card}>
          <TouchableOpacity
            style={authStyles.primaryButton}
            onPress={() => navigation.replace('MainTabs', { screen: 'home' })}
          >
            <Text style={authStyles.primaryButtonText}>Ir para o início</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name="email-outline" size={42} color="#fff" />
        </View>
        <Text style={authStyles.heroTitle}>Verificar e-mail</Text>
        <Text style={authStyles.heroText}>
          {email
            ? `Enviamos um código para ${email}. Cole abaixo para confirmar sua conta.`
            : 'Enviamos um código de verificação para o seu e-mail. Cole abaixo para confirmar sua conta.'}
        </Text>
      </View>

      <View style={authStyles.card}>
        <FormInput
          label="Código de verificação"
          required
          value={token}
          onChangeText={(v) => { setToken(v); if (tokenError) setTokenError(''); }}
          placeholder="Cole o código aqui"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon="shield-key-outline"
          error={tokenError}
        />

        {developmentCode ? (
          <View style={{ backgroundColor: '#fff8e1', padding: 12, borderRadius: 8, marginBottom: 14, borderWidth: 1, borderColor: '#f2c94c' }}>
            <Text style={{ fontWeight: '800', marginBottom: 4 }}>Código de desenvolvimento</Text>
            <Text selectable style={{ fontSize: 18, fontWeight: '800', letterSpacing: 2 }}>{developmentCode}</Text>
            <Text style={{ marginTop: 4, color: '#6b5b00' }}>SMTP não está configurado. Em produção, configure o SMTP para que este código seja enviado ao e-mail informado.</Text>
          </View>
        ) : null}

        {message ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: message.includes('enviado') ? '#f0fff4' : '#fff0f0',
              padding: 10,
              borderRadius: 8,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: message.includes('enviado') ? '#c3e6cb' : '#ffd2d2',
            }}
          >
            <MaterialCommunityIcons
              name={message.includes('enviado') ? 'check-circle' : 'alert-circle'}
              size={18}
              color={message.includes('enviado') ? '#2e7d32' : '#d93025'}
            />
            <Text
              style={{
                color: message.includes('enviado') ? '#2e7d32' : '#d93025',
                fontSize: 13,
                fontWeight: '600',
                flex: 1,
              }}
            >
              {message}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={authStyles.primaryButton}
          onPress={handleVerify}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={authStyles.primaryButtonText}>Verificar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            authStyles.secondaryButton,
            (sending || resendCooldown > 0) && { opacity: 0.5 },
          ]}
          onPress={() => handleSendEmail(false)}
          disabled={sending || resendCooldown > 0}
        >
          {sending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={authStyles.secondaryButtonText}>
              {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={authStyles.footerRow}>
          <Text style={authStyles.footerText}>Verificar depois?</Text>
          <TouchableOpacity onPress={() => navigation.replace('MainTabs', { screen: 'home' })}>
            <Text style={authStyles.footerLink}>Pular por agora</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
