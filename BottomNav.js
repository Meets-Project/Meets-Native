import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { bottomNavStyles } from '../styles/bottomNavStyles';

const tabs = [
  { id: 'home', icon: 'home', label: 'Início' },
  { id: 'search', icon: 'magnify', label: 'Buscar' },
  { id: 'create', icon: 'plus-circle', label: 'Criar' },
  { id: 'chat', icon: 'chat-outline', label: 'Chat' },
  { id: 'profile', icon: 'account-circle', label: 'Perfil' },
];

export function BottomNav({ activeTab, onSelectTab }) {
  return (
    <View style={bottomNavStyles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[bottomNavStyles.item, isActive && bottomNavStyles.itemActive]}
            onPress={() => onSelectTab(tab.id)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={24}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text style={[bottomNavStyles.label, isActive && bottomNavStyles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
