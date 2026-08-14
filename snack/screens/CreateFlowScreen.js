import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';

const copyByMode = {
  event: {
    icon: 'calendar-plus',
    title: 'Criar evento',
    text: 'Defina uma data, convite e descrição do meetup.',
    cta: 'Salvar evento',
  },
  live: {
    icon: 'video-plus',
    title: 'Abrir sala ao vivo',
    text: 'Inicie uma sala em vídeo para conversar com sua comunidade.',
    cta: 'Abrir sala',
  },
  post: {
    icon: 'post-outline',
    title: 'Publicar atualização',
    text: 'Compartilhe uma atualização rápida com sua rede.',
    cta: 'Publicar',
  },
};

export function CreateFlowScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const mode = route.params?.mode || 'event';
  const content = copyByMode[mode] || copyByMode.event;

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent}>
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name={content.icon} size={42} color="#ffffff" />
        </View>
        <Text style={authStyles.heroTitle}>{content.title}</Text>
        <Text style={authStyles.heroText}>{content.text}</Text>
      </View>

      <View style={authStyles.card}>
        <View style={authStyles.field}>
          <Text style={authStyles.fieldLabel}>Título</Text>
          <View style={authStyles.fieldInput} />
        </View>
        <View style={authStyles.field}>
          <Text style={authStyles.fieldLabel}>Descrição</Text>
          <View style={authStyles.fieldInput} />
        </View>

        <TouchableOpacity style={authStyles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={authStyles.primaryButtonText}>{content.cta}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
