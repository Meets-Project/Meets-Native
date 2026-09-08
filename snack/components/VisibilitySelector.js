import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

const OPTIONS = [
  { id: 'public', icon: 'earth', title: 'Público', text: 'Qualquer pessoa pode acessar.' },
  { id: 'followers', icon: 'account-group-outline', title: 'Todos que me seguem', text: 'Somente seus seguidores.' },
  { id: 'selected', icon: 'account-multiple-check-outline', title: 'Escolher seguidores', text: 'Selecione quem poderá ver.' },
  { id: 'link', icon: 'link-variant', title: 'Somente com link', text: 'Só quem tiver o link direto.' },
];

export function VisibilitySelector({ visibility, onChange, followers = [], selectedIds = [], onToggleFollower }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 8 }}>Privacidade</Text>
      <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 10 }}>
        Escolha quem poderá encontrar e acessar este conteúdo.
      </Text>

      {OPTIONS.map((option) => {
        const active = visibility === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onChange(option.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 11,
              marginBottom: 7,
              borderRadius: 11,
              borderWidth: active ? 1.5 : 1,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primarySoft : colors.surfaceSoft,
              gap: 10,
            }}
          >
            <MaterialCommunityIcons name={option.icon} size={21} color={active ? colors.primary : colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: colors.text, fontSize: 13 }}>{option.title}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{option.text}</Text>
            </View>
            <MaterialCommunityIcons
              name={active ? 'radiobox-marked' : 'radiobox-blank'}
              size={20}
              color={active ? colors.primary : colors.textSubtle}
            />
          </TouchableOpacity>
        );
      })}

      {visibility === 'selected' ? (
        <View style={{ marginTop: 4, borderRadius: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', padding: 8 }}>
          {followers.length ? followers.map((follower) => {
            const active = selectedIds.includes(follower.id);
            return (
              <TouchableOpacity
                key={follower.id}
                onPress={() => onToggleFollower?.(follower.id)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 6, gap: 9 }}
              >
                <MaterialCommunityIcons
                  name={active ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={20}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text style={{ flex: 1, color: colors.text, fontWeight: '700', fontSize: 13 }}>{follower.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{follower.role || ''}</Text>
              </TouchableOpacity>
            );
          }) : (
            <Text style={{ padding: 10, color: colors.textMuted, textAlign: 'center', fontSize: 12 }}>
              Você ainda não tem seguidores para selecionar.
            </Text>
          )}
          {followers.length > 0 && selectedIds.length === 0 ? (
            <Text style={{ color: '#d93025', fontSize: 11, paddingHorizontal: 6, paddingBottom: 4 }}>
              Selecione pelo menos um seguidor.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
