import React,{useEffect} from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { hasToken } from '../services/api';

export function LoadingScreen(){
 const navigation=useNavigation();
 useEffect(()=>{let alive=true;(async()=>{try{const logged=await hasToken();if(alive)navigation.replace(logged?'MainTabs':'Login',{screen:logged?'home':undefined});}catch{if(alive)navigation.replace('Login');}})();return()=>{alive=false;};},[navigation]);
 return <View style={[authStyles.screen,authStyles.loadingWrap]}><View style={authStyles.logoMark}><MaterialCommunityIcons name="movie-open-star-outline" size={42} color="#fff"/></View><Text style={authStyles.loadingTitle}>Meets</Text><Text style={authStyles.loadingSubtitle}>Conectando ao PostgreSQL...</Text><ActivityIndicator style={authStyles.loadingSpinner} size="large" color={colors.primary}/></View>;
}
