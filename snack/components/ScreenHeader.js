import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { headerStyles } from '../styles/headerStyles';

export function ScreenHeader({
  title,
  canGoBack = false,
  onBackPress,
  onMenuPress,
  onLogoPress,
  onNotificationsPress,
}) {
  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {canGoBack ? (
            <TouchableOpacity
              onPress={onBackPress}
              accessibilityLabel="Voltar"
              style={{ paddingRight: 10, paddingVertical: 4 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onMenuPress}
              accessibilityLabel="Abrir menu"
              style={{ paddingRight: 10, paddingVertical: 4 }}
            >
              <MaterialCommunityIcons name="menu" size={28} color="#ffffff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onLogoPress} accessibilityLabel="Ir para o início">
            <Text style={headerStyles.logo}>Meets</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {canGoBack ? (
            <TouchableOpacity
              onPress={onMenuPress}
              accessibilityLabel="Abrir menu"
              style={{ padding: 4 }}
            >
              <MaterialCommunityIcons name="menu" size={24} color="#ffffff" />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={onNotificationsPress}
            accessibilityLabel="Notificações"
            style={{ padding: 4 }}
          >
            <MaterialCommunityIcons name="bell-outline" size={26} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={headerStyles.title}>{title}</Text>
    </View>
  );
}
