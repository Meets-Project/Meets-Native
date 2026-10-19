import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { colors } from '../styles/colors';

// Linha de opções em forma de "pílula" (filtros, períodos, abas simples).
export function FilterChips({ options, value, onChange, style }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[{ gap: 8, paddingVertical: 4 }, style]}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primary : colors.surface,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#ffffff' : colors.text }}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
