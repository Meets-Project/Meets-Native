import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  adminCreateUser,
  adminDeactivateUser,
  adminGetUser,
  adminReactivateUser,
  adminUpdateUser,
} from '../services/api';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { FormInput } from '../components/FormInput';
import { FilterChips } from '../components/FilterChips';
import { confirmAction } from '../utils/confirm';

const TYPES = [
  { id: 'user', label: 'Usuário' },
  { id: 'admin', label: 'Administrador' },
];

const ACTION_LABELS = {
  user_created: 'Conta criada pelo admin',
  user_updated: 'Dados editados',
  user_promoted: 'Promovido a administrador',
  user_demoted: 'Deixou de ser administrador',
  user_deactivated: 'Conta desativada',
  user_reactivated: 'Conta reativada',
  user_warned: 'Advertência enviada',
};

// Caso de uso #012 Manter Usuários: criar, visualizar, editar e desativar/reativar.
export function AdminUserFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userId = route.params?.userId;
  const isNew = !userId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', city: '', bio: '', accountType: 'user' });
  const [reason, setReason] = useState('');

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  function fill(u) {
    setUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, city: u.city, bio: u.bio, accountType: u.account_type });
  }

  useEffect(() => {
    if (isNew) return;
    adminGetUser(userId).then(fill).catch((e) => setError(e.message || 'Usuário não encontrado.')).finally(() => setLoading(false));
  }, [userId, isNew]);

  async function save() {
    setError('');
    setSuccess('');
    if (form.name.trim().length < 2) return setError('Informe o nome (mínimo de 2 letras).');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Informe um e-mail válido.');
    if (isNew && form.password.length < 6) return setError('A senha inicial precisa ter no mínimo 6 caracteres.');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        accountType: form.accountType,
        role: form.role.trim() || undefined,
        city: form.city.trim() || undefined,
        bio: form.bio,
      };
      if (isNew) {
        const created = await adminCreateUser({ ...payload, password: form.password });
        navigation.replace('AdminUserForm', { userId: created.id });
        return;
      }
      fill(await adminUpdateUser(userId, payload));
      setSuccess('Dados salvos.');
    } catch (e) {
      setError(e.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    setError('');
    setSuccess('');
    const deactivating = user.status === 'active';
    const ok = await confirmAction(
      deactivating ? 'Desativar conta' : 'Reativar conta',
      deactivating
        ? `${user.name} não conseguirá mais entrar e o conteúdo dessa conta deixará de aparecer. Os dados ficam guardados.`
        : `${user.name} volta a entrar no Meets e o conteúdo volta a aparecer.`,
      deactivating ? 'Desativar' : 'Reativar'
    );
    if (!ok) return;
    setSaving(true);
    try {
      fill(deactivating ? await adminDeactivateUser(userId, reason.trim()) : await adminReactivateUser(userId));
      setReason('');
      setSuccess(deactivating ? 'Conta desativada.' : 'Conta reativada.');
    } catch (e) {
      setError(e.message || 'Não foi possível alterar a situação da conta.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={[screenStyles.listContent, { paddingBottom: 140 }]} keyboardShouldPersistTaps="handled">
      {user ? (
        <View style={[screenStyles.sectionCard, { gap: 4 }]}>
          <Text style={screenStyles.sectionTitle}>{user.name}</Text>
          <Text style={screenStyles.rowSubtitle}>
            {user.status === 'active' ? 'Conta ativa' : `Conta desativada${user.deactivation_reason ? ` · ${user.deactivation_reason}` : ''}`}
          </Text>
          <Text style={screenStyles.rowSubtitle}>{user.posts_count} posts · {user.events_count} eventos · desde {new Date(user.created_at).toLocaleDateString('pt-BR')}</Text>
        </View>
      ) : null}

      <View style={[screenStyles.sectionCard, { marginTop: 12 }]}>
        <Text style={screenStyles.sectionTitle}>{isNew ? 'Novo usuário' : 'Dados da conta'}</Text>
        <FormInput label="Nome" value={form.name} onChangeText={set('name')} autoCapitalize="words" required />
        <FormInput label="E-mail" value={form.email} onChangeText={set('email')} keyboardType="email-address" required />
        {isNew ? (
          <FormInput label="Senha inicial" value={form.password} onChangeText={set('password')} secureTextEntry required helperText="A pessoa pode trocá-la depois em Configurações." />
        ) : null}
        <Text style={[screenStyles.rowSubtitle, { marginTop: 4, marginBottom: 4 }]}>Tipo de conta</Text>
        <FilterChips options={TYPES} value={form.accountType} onChange={set('accountType')} />
        <FormInput label="Cargo / função" value={form.role} onChangeText={set('role')} autoCapitalize="sentences" />
        <FormInput label="Cidade" value={form.city} onChangeText={set('city')} autoCapitalize="words" />
        <FormInput label="Biografia" value={form.bio} onChangeText={set('bio')} multiline numberOfLines={3} autoCapitalize="sentences" />

        {error ? <Text style={{ color: '#d93025', marginTop: 8 }}>{error}</Text> : null}
        {success ? <Text style={{ color: '#1e7e34', marginTop: 8 }}>{success}</Text> : null}

        <TouchableOpacity style={[screenStyles.createButton, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={screenStyles.createButtonText}>{isNew ? 'Criar usuário' : 'Salvar alterações'}</Text>}
        </TouchableOpacity>
      </View>

      {user ? (
        <View style={[screenStyles.sectionCard, { marginTop: 12 }]}>
          <Text style={screenStyles.sectionTitle}>{user.status === 'active' ? 'Desativar conta' : 'Reativar conta'}</Text>
          {user.status === 'active' ? (
            <FormInput label="Motivo (opcional)" value={reason} onChangeText={setReason} autoCapitalize="sentences" />
          ) : null}
          <TouchableOpacity
            style={[screenStyles.createButton, { backgroundColor: user.status === 'active' ? '#d93025' : colors.secondary, flexDirection: 'row', gap: 6, justifyContent: 'center' }]}
            onPress={toggleStatus}
            disabled={saving}
          >
            <MaterialCommunityIcons name={user.status === 'active' ? 'account-off' : 'account-check'} size={18} color="#ffffff" />
            <Text style={screenStyles.createButtonText}>{user.status === 'active' ? 'Desativar conta' : 'Reativar conta'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {user?.actions?.length ? (
        <View style={[screenStyles.sectionCard, { marginTop: 12 }]}>
          <Text style={screenStyles.sectionTitle}>Histórico de administração</Text>
          {user.actions.map((a) => (
            <View key={a.id} style={{ paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={screenStyles.rowTitle}>{ACTION_LABELS[a.action] || a.action}</Text>
              <Text style={screenStyles.rowSubtitle}>
                {a.admin_name} · {new Date(a.created_at).toLocaleString('pt-BR')}{a.note ? ` · ${a.note}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
