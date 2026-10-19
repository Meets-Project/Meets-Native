import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { screenStyles } from '../styles/screenStyles';
import { changePassword, clearToken, deactivateMyAccount, getMe, getSettings, updateSettings } from '../services/api';
import { confirmAction } from '../utils/confirm';
import { FormInput } from '../components/FormInput';
import { validatePassword, validatePasswordMatch } from '../utils/masks';
import { useTheme } from '../context/ThemeContext';

export function SettingsScreen() {
  const navigation = useNavigation();
  const { isDark, setIsDark, theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    dark_mode: false,
  });

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Desativar conta ("Excluir perfil"): a conta é desativada e só um administrador reativa.
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateError, setDeactivateError] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadData() {
        try {
          const [s, u] = await Promise.allSettled([getSettings(), getMe()]);
          if (!active) return;

          if (s.status === 'fulfilled' && s.value) {
            setSettings((prev) => ({
              ...prev,
              notifications_enabled: !!s.value.notifications_enabled,
              dark_mode: !!s.value.dark_mode,
            }));
            setIsDark(!!s.value.dark_mode);
          }

          if (u.status === 'fulfilled' && u.value) {
            setUser(u.value);
          }
        } catch {
          // Mantém valores padrão
        } finally {
          if (active) setLoading(false);
        }
      }

      loadData();

      return () => {
        active = false;
      };
    }, [])
  );

  async function handleToggleSetting(key, val) {
    const prev = settings[key];
    setSettings((s) => ({ ...s, [key]: val }));
    if (key === 'dark_mode') setIsDark(val);

    if (key === 'notifications_enabled' || key === 'dark_mode') {
      try {
        await updateSettings({
          notificationsEnabled: key === 'notifications_enabled' ? val : settings.notifications_enabled,
          darkMode: key === 'dark_mode' ? val : settings.dark_mode,
        });
      } catch {
        setSettings((s) => ({ ...s, [key]: prev }));
        if (key === 'dark_mode') setIsDark(prev);
        Alert.alert('Erro', 'Não foi possível salvar a preferência no momento.');
      }
    }
  }

  async function handleChangePassword() {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      return setPasswordError('Informe sua senha atual.');
    }

    const valPass = validatePassword(newPassword, 6);
    if (!valPass.valid) {
      return setPasswordError(valPass.error);
    }

    const valMatch = validatePasswordMatch(newPassword, confirmNewPassword);
    if (!valMatch.valid) {
      return setPasswordError(valMatch.error);
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setShowPasswordSection(false), 2000);
    } catch (e) {
      setPasswordError(e.message || 'Erro ao alterar a senha.');
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleDeactivateAccount() {
    setDeactivateError('');
    if (!deactivatePassword) {
      setDeactivateError('Informe sua senha para confirmar.');
      return;
    }
    const ok = await confirmAction(
      'Desativar conta',
      'Sua conta e seu conteúdo deixarão de aparecer no Meets e você não conseguirá mais entrar. Só um administrador pode reativá-la. Deseja continuar?',
      'Desativar'
    );
    if (!ok) return;
    setIsDeactivating(true);
    try {
      await deactivateMyAccount(deactivatePassword);
      await clearToken();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      setDeactivateError(e.message || 'Não foi possível desativar a conta.');
    } finally {
      setIsDeactivating(false);
    }
  }

  function handleLogout() {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza de que deseja encerrar sua sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await clearToken();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ],
      { cancelable: true }
    );
  }

  if (loading) {
    return (
      <View style={[screenStyles.listContent, { alignItems: 'center', justifyContent: 'center', minHeight: 300 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>Carregando configurações...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={[screenStyles.listContent, { paddingBottom: 140 }]} showsVerticalScrollIndicator={false}>
      {/* Card de Resumo do Usuário */}
      <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : '👤'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'Membro do Meets'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
          <Text style={styles.userRole}>{user?.role || 'Membro ativo'}</Text>
        </View>
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => navigation.navigate('EditProfile')}
          accessibilityLabel="Editar Perfil"
        >
          <MaterialCommunityIcons name="account-edit-outline" size={20} color={colors.primary} />
          <Text style={styles.editProfileText}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* Seção: Preferências do Aplicativo */}
      <View style={[screenStyles.sectionCard, { marginTop: 14, backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[screenStyles.sectionTitle, { color: theme.text }]}>Preferências do Aplicativo</Text>

        <View style={screenStyles.rowItem}>
          <View style={screenStyles.rowLeft}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primary} />
            <View>
              <Text style={screenStyles.rowTitle}>Notificações</Text>
              <Text style={screenStyles.rowSubtitle}>Avisos de eventos, mensagens e avaliações no app</Text>
            </View>
          </View>
          <Switch
            value={settings.notifications_enabled}
            onValueChange={(v) => handleToggleSetting('notifications_enabled', v)}
            trackColor={{ false: '#d9d9d9', true: colors.primarySoft }}
            thumbColor={settings.notifications_enabled ? colors.primary : '#f4f4f4'}
          />
        </View>


        <View style={[screenStyles.rowItem, screenStyles.rowItemLast]}>
          <View style={screenStyles.rowLeft}>
            <MaterialCommunityIcons name="theme-light-dark" size={22} color={colors.primary} />
            <View>
              <Text style={screenStyles.rowTitle}>Modo Escuro</Text>
              <Text style={screenStyles.rowSubtitle}>Interface com cores escuras</Text>
            </View>
          </View>
          <Switch
            value={settings.dark_mode || isDark}
            onValueChange={(v) => handleToggleSetting('dark_mode', v)}
            trackColor={{ false: '#d9d9d9', true: colors.primarySoft }}
            thumbColor={settings.dark_mode ? colors.primary : '#f4f4f4'}
          />
        </View>

      </View>

      {/* Seção: Segurança & Alterar Senha */}
      <View style={[screenStyles.sectionCard, { marginTop: 14 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.primary} />
            <Text style={screenStyles.sectionTitle}>Segurança da Conta</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowPasswordSection((prev) => !prev);
              setPasswordError('');
              setPasswordSuccess('');
            }}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleBtnText}>
              {showPasswordSection ? 'Fechar' : 'Alterar Senha'}
            </Text>
            <MaterialCommunityIcons
              name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {showPasswordSection ? (
          <View style={{ marginTop: 14 }}>
            <FormInput
              label="Senha Atual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Digite sua senha atual"
              secureTextEntry
              leftIcon="lock-outline"
            />

            <FormInput
              label="Nova Senha"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo de 6 caracteres"
              secureTextEntry
              leftIcon="lock-plus-outline"
              helperText="Crie uma senha forte com letras e números"
            />

            <FormInput
              label="Confirmar Nova Senha"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              placeholder="Digite a nova senha novamente"
              secureTextEntry
              leftIcon="lock-check-outline"
            />

            {passwordError ? (
              <View style={styles.alertBoxError}>
                <MaterialCommunityIcons name="alert-circle" size={18} color="#d93025" />
                <Text style={styles.alertTextError}>{passwordError}</Text>
              </View>
            ) : null}

            {passwordSuccess ? (
              <View style={styles.alertBoxSuccess}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#1e7e34" />
                <Text style={styles.alertTextSuccess}>{passwordSuccess}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[screenStyles.createButton, isChangingPassword && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={screenStyles.createButtonText}>Atualizar Senha</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[screenStyles.sectionText, { marginTop: 6 }]}>
            Sua conta está protegida. Altere sua senha periodicamente para manter seus dados seguros.
          </Text>
        )}
      </View>

      {/* Seção: Desativar conta */}
      <View style={[screenStyles.sectionCard, { marginTop: 14 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="account-off-outline" size={22} color="#d93025" />
            <Text style={screenStyles.sectionTitle}>Desativar Conta</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowDeactivate((prev) => !prev);
              setDeactivateError('');
              setDeactivatePassword('');
            }}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleBtnText}>{showDeactivate ? 'Fechar' : 'Desativar'}</Text>
            <MaterialCommunityIcons name={showDeactivate ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={[screenStyles.sectionText, { marginTop: 6 }]}>
          Sua conta e seu conteúdo deixam de aparecer no Meets. Os dados não são apagados e só um administrador pode reativar a conta.
        </Text>

        {showDeactivate ? (
          <View style={{ marginTop: 14 }}>
            <FormInput
              label="Confirme sua senha"
              value={deactivatePassword}
              onChangeText={setDeactivatePassword}
              placeholder="Sua senha atual"
              secureTextEntry
              leftIcon="lock-outline"
            />

            {deactivateError ? (
              <View style={styles.alertBoxError}>
                <MaterialCommunityIcons name="alert-circle" size={18} color="#d93025" />
                <Text style={styles.alertTextError}>{deactivateError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.logoutButton, isDeactivating && { opacity: 0.7 }]}
              onPress={handleDeactivateAccount}
              disabled={isDeactivating}
              accessibilityLabel="Desativar minha conta"
            >
              {isDeactivating ? (
                <ActivityIndicator color="#d93025" />
              ) : (
                <>
                  <MaterialCommunityIcons name="account-off-outline" size={20} color="#d93025" />
                  <Text style={styles.logoutButtonText}>Desativar minha conta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>


      {/* Seção: Suporte e Informações */}
      <View style={[screenStyles.sectionCard, { marginTop: 14 }]}>
        <Text style={screenStyles.sectionTitle}>Suporte e Informações</Text>

        <TouchableOpacity
          style={screenStyles.rowItem}
          onPress={() => navigation.navigate('help')}
        >
          <View style={screenStyles.rowLeft}>
            <MaterialCommunityIcons name="help-circle-outline" size={22} color={colors.primary} />
            <Text style={screenStyles.rowTitle}>Central de Ajuda e FAQ</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={screenStyles.rowItem}
          onPress={() => navigation.navigate('about')}
        >
          <View style={screenStyles.rowLeft}>
            <MaterialCommunityIcons name="information-outline" size={22} color={colors.primary} />
            <Text style={screenStyles.rowTitle}>Sobre o Meets</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[screenStyles.rowItem, screenStyles.rowItemLast]}>
          <View style={screenStyles.rowLeft}>
            <MaterialCommunityIcons name="cellphone" size={22} color={colors.primary} />
            <Text style={screenStyles.rowTitle}>Versão do Aplicativo</Text>
          </View>
          <Text style={screenStyles.rowSubtitle}>v1.0.0</Text>
        </View>
      </View>

      {/* Ações da Conta */}
      <View style={{ marginTop: 20, gap: 10 }}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="Sair da Conta"
        >
          <MaterialCommunityIcons name="logout" size={20} color="#d93025" />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backHomeButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'home' })}
          accessibilityLabel="Voltar para o Início"
        >
          <MaterialCommunityIcons name="home-outline" size={20} color={colors.text} />
          <Text style={styles.backHomeButtonText}>Voltar para o Início</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  userRole: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  editProfileBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.primarySoft,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  alertBoxError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffd2d2',
    marginBottom: 12,
  },
  alertTextError: {
    fontSize: 12,
    color: '#d93025',
    fontWeight: '600',
    flex: 1,
  },
  alertBoxSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e6f7eb',
    borderWidth: 1,
    borderColor: '#bbf0c8',
    marginBottom: 12,
  },
  alertTextSuccess: {
    fontSize: 12,
    color: '#1e7e34',
    fontWeight: '700',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffd2d2',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: '#d93025',
    fontWeight: '800',
    fontSize: 14,
  },
  backHomeButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backHomeButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
});
