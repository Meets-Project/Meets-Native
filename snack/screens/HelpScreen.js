import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';

const faqs = [
  {
    q: 'Como criar um novo evento?',
    a: 'Vá na aba "Criar" no menu inferior, escolha "Evento", preencha o título, data, horário e local.',
  },
  {
    q: 'Como funcionam as avaliações de palestras?',
    a: 'Você pode avaliar apresentações com notas de 1 a 5 estrelas e competências específicas como clareza, conteúdo e oratória.',
  },
  {
    q: 'Como salvar conteúdos?',
    a: 'Basta tocar no ícone de salvar em qualquer post do feed para guardá-lo na sua lista de itens salvos.',
  },
];

export function HelpScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <MaterialCommunityIcons name="help-circle-outline" size={28} color={colors.primary} />
          <Text style={screenStyles.sectionTitle}>Central de Ajuda</Text>
        </View>
        <Text style={screenStyles.sectionText}>
          Encontre respostas para dúvidas frequentes ou entre em contato com nossa equipe de suporte.
        </Text>
      </View>

      <View style={[screenStyles.sectionCard, { marginTop: 14 }]}>
        <Text style={[screenStyles.sectionTitle, { fontSize: 14 }]}>Perguntas Frequentes (FAQ)</Text>
        {faqs.map((f, i) => (
          <View
            key={i}
            style={[
              { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
              i === faqs.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <Text style={[screenStyles.rowTitle, { marginBottom: 4, color: colors.primary }]}>{f.q}</Text>
            <Text style={screenStyles.sectionText}>{f.a}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[screenStyles.createButton, { marginTop: 18, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
        onPress={() => navigation.navigate('MainTabs', { screen: 'home' })}
      >
        <MaterialCommunityIcons name="arrow-left" size={18} color="#ffffff" />
        <Text style={screenStyles.createButtonText}>Voltar ao Início</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
