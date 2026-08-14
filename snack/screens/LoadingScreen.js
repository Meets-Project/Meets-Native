import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';

export function LoadingScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[authStyles.screen, authStyles.loadingWrap]}>
      <View style={authStyles.logoMark}>
        <MaterialCommunityIcons name="movie-open-star-outline" size={42} color="#ffffff" />
      </View>
      <Text style={authStyles.loadingTitle}>Meets</Text>
      <Text style={authStyles.loadingSubtitle}>
        Preparando sua experiência com resenhas, conversas e descobertas.
      </Text>
      <ActivityIndicator style={authStyles.loadingSpinner} size="large" color={colors.primary} />
    </View>
  );
}
