import React,{useState} from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { signup } from '../services/api';

export function SignupScreen(){
 const navigation=useNavigation(); const [name,setName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function handleSignup(){
  if(name.trim().length<2||!email.trim()||password.length<6) return setMessage('Nome, e-mail e senha (mínimo 6 caracteres) são obrigatórios.');
  setBusy(true);setMessage('');
  try{await signup(name.trim(),email.trim(),password);navigation.replace('MainTabs',{screen:'profile'});}
  catch(e){setMessage(e.message);}finally{setBusy(false);}
 }
 return <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
  <View style={authStyles.hero}><View style={authStyles.logoMark}><MaterialCommunityIcons name="account-plus-outline" size={42} color="#fff"/></View><Text style={authStyles.heroTitle}>Crie sua conta</Text><Text style={authStyles.heroText}>Seus dados ficam persistidos no PostgreSQL.</Text></View>
  <View style={authStyles.card}>
   <View style={authStyles.field}><Text style={authStyles.fieldLabel}>Nome</Text><TextInput style={authStyles.fieldInput} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor="#9a9a9a"/></View>
   <View style={authStyles.field}><Text style={authStyles.fieldLabel}>E-mail</Text><TextInput style={authStyles.fieldInput} value={email} onChangeText={setEmail} placeholder="seuemail@exemplo.com" placeholderTextColor="#9a9a9a" keyboardType="email-address" autoCapitalize="none"/></View>
   <View style={authStyles.field}><Text style={authStyles.fieldLabel}>Senha</Text><TextInput style={authStyles.fieldInput} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor="#9a9a9a" secureTextEntry/></View>
   {message?<Text style={authStyles.loadingSubtitle}>{message}</Text>:null}
   <TouchableOpacity style={authStyles.primaryButton} onPress={handleSignup} disabled={busy}>{busy?<ActivityIndicator color={colors.white}/>:<Text style={authStyles.primaryButtonText}>Cadastrar</Text>}</TouchableOpacity>
   <View style={authStyles.footerRow}><Text style={authStyles.footerText}>Já tem uma conta?</Text><TouchableOpacity onPress={()=>navigation.navigate('Login')}><Text style={authStyles.footerLink}>Entrar</Text></TouchableOpacity></View>
  </View>
 </ScrollView>;
}
