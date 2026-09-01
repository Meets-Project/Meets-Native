import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { rankingData } from '../data/useCaseData';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { AnimatedPressable } from '../components/AnimatedPressable';

export function RankingScreen() {
  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Ranking de apresentadores</Text>
        <Text style={screenStyles.sectionText}>
          A classificação considera avaliação geral, didática, comunicação e engajamento do público.
        </Text>
      </View>

      {rankingData.map((item, index) => (
        <AnimatedPressable key={item.id} style={screenStyles.sectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 22 }}>{item.accent}</Text>
              <View>
                <Text style={screenStyles.rowTitle}>{item.name}</Text>
                <Text style={screenStyles.rowSubtitle}>#{index + 1} no ranking</Text>
              </View>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>{item.score}</Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {item.skills.map((skill) => (
              <View
                key={`${item.id}-${skill}`}
                style={{
                  backgroundColor: colors.primarySoft,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>{skill}</Text>
              </View>
            ))}
          </View>
        </AnimatedPressable>
      ))}
    </ScrollView>
  );
}
