import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { headerStyles } from '../styles/headerStyles';

export function ScreenHeader({ title, onMenuPress, onLogoPress, onNotificationsPress }) {
  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.topBar}>
        <TouchableOpacity onPress={onMenuPress}>
          <MaterialCommunityIcons name="menu" size={28} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onLogoPress}>
          <Text style={headerStyles.logo}>Meets</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNotificationsPress}>
          <MaterialCommunityIcons name="bell-outline" size={28} color="#ffffff" />  
        </TouchableOpacity>
      </View>
      <Text style={headerStyles.title}>{title}</Text>
    </View>
  );
}
