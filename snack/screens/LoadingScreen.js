import React,{useEffect} from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { hasToken } from '../services/api';

export function LoadingScreen(){
 const navigation=useNavigation();
 useEffect(()=>{let alive=true;(async()=>{try{const logged=await hasToken();if(!alive)return;const params=typeof window!=='undefined'?new URLSearchParams(window.location.search):null;const type=params?.keys().next().value;const id=type?params.get(type):'';if(logged&&id&&type==='event')navigation.replace('EventDetail',{eventId:id});else if(logged&&id&&type==='user')navigation.replace('SpeakerProfile',{speakerId:id});else if(logged&&id&&type==='post')navigation.replace('PostDetail',{postId:id});else navigation.replace(logged?'MainTabs':'Login',{screen:logged?'home':undefined});}catch{if(alive)navigation.replace('Login');}})();return()=>{alive=false;};},[navigation]);
 return <View style={[authStyles.screen,authStyles.loadingWrap]}><View style={authStyles.logoMark}><MaterialCommunityIcons name="movie-open-star-outline" size={42} color="#fff"/></View><Text style={authStyles.loadingTitle}>Meets</Text><Text style={authStyles.loadingSubtitle}>Conectando ao PostgreSQL...</Text><ActivityIndicator style={authStyles.loadingSpinner} size="large" color={colors.primary}/></View>;
}
