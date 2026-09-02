import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { fetchCurrentUser } from '../services/userApi';
import { getShareUrl, shareContent } from '../services/share';

export function ShareProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser).catch(() => {});
  }, []);

  const profileUrl = user?.id ? getShareUrl('user', user.id) : getShareUrl('user', 'me');

  function handleShare() {
    shareContent({
      type: 'user',
      id: user?.id || 'me',
      title: user?.name || 'Perfil no Meets',
      text: `Conheça o perfil de ${user?.name || 'um membro'} no Meets!`,
    });
  }

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent}>
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name="share-variant-outline" size={42} color="#ffffff" />
        </View>
        <Text style={authStyles.heroTitle}>Compartilhar perfil</Text>
        <Text style={authStyles.heroText}>Copie seu link ou envie para alguém da sua rede.</Text>
      </View>

      <View style={authStyles.card}>
        <View style={{ backgroundColor: colors.background, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>SEU LINK DIRETO:</Text>
          <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }} selectable>
            {profileUrl}
          </Text>
        </View>

        <TouchableOpacity style={authStyles.primaryButton} onPress={handleShare}>
          <Text style={authStyles.primaryButtonText}>Copiar link do Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[authStyles.secondaryButton, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
          <Text style={authStyles.secondaryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
