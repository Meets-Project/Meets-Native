import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { login } from '../services/api';

export function LoginScreen() {
  const navigation=useNavigation();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  async function handleLogin(){
    if(!email.trim() || !password) return setMessage('Informe e-mail e senha.');
    setBusy(true); setMessage('');
    try { await login(email.trim(),password); navigation.replace('MainTabs',{screen:'home'}); }
    catch(e){setMessage(e.message);} finally{setBusy(false);}
  }
  return <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
    <View style={authStyles.hero}><View style={authStyles.logoMark}><MaterialCommunityIcons name="movie-open-star-outline" size={42} color="#fff"/></View>
      <Text style={authStyles.heroTitle}>Entre no Meets</Text><Text style={authStyles.heroText}>Faça login para salvar conteúdos e continuar de onde parou.</Text></View>
    <View style={authStyles.card}>
      <View style={authStyles.field}><Text style={authStyles.fieldLabel}>E-mail</Text><TextInput style={authStyles.fieldInput} value={email} onChangeText={setEmail} placeholder="seuemail@exemplo.com" placeholderTextColor="#9a9a9a" keyboardType="email-address" autoCapitalize="none"/></View>
      <View style={authStyles.field}><Text style={authStyles.fieldLabel}>Senha</Text><TextInput style={authStyles.fieldInput} value={password} onChangeText={setPassword} placeholder="Sua senha" placeholderTextColor="#9a9a9a" secureTextEntry/></View>
      {message ? <Text style={authStyles.loadingSubtitle}>{message}</Text>:null}
      <TouchableOpacity style={authStyles.primaryButton} onPress={handleLogin} disabled={busy}>{busy?<ActivityIndicator color={colors.white}/>:<Text style={authStyles.primaryButtonText}>Entrar</Text>}</TouchableOpacity>
      <TouchableOpacity style={authStyles.secondaryButton} onPress={()=>navigation.navigate('Signup')}><Text style={authStyles.secondaryButtonText}>Criar conta</Text></TouchableOpacity>
      <View style={authStyles.footerRow}><Text style={authStyles.footerText}>Ainda não tem conta?</Text><TouchableOpacity onPress={()=>navigation.navigate('Signup')}><Text style={authStyles.footerLink}>Cadastre-se</Text></TouchableOpacity></View>
    </View>
  </ScrollView>;
}
