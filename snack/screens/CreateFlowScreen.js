import React,{useState} from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation,useRoute } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { createContent } from '../services/api';

const copy={event:{icon:'calendar-plus',title:'Criar evento',text:'Defina uma data, convite e descrição do meetup.',cta:'Salvar evento'},live:{icon:'video-plus',title:'Abrir sala ao vivo',text:'Inicie uma sala em vídeo para conversar com sua comunidade.',cta:'Abrir sala'},post:{icon:'post-outline',title:'Publicar atualização',text:'Compartilhe uma atualização rápida com sua rede.',cta:'Publicar'}};

export function CreateFlowScreen(){
 const navigation=useNavigation();const route=useRoute();const mode=route.params?.mode||'event';const content=copy[mode]||copy.event;
 const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function save(){if(!title.trim())return setMessage('Título é obrigatório.');setBusy(true);setMessage('');try{await createContent({mode,title:title.trim(),description});navigation.goBack();}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 return <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled"><View style={authStyles.hero}><View style={authStyles.logoMark}><MaterialCommunityIcons name={content.icon} size={42} color="#fff"/></View><Text style={authStyles.heroTitle}>{content.title}</Text><Text style={authStyles.heroText}>{content.text}</Text></View><View style={authStyles.card}>
 <View style={authStyles.field}><Text style={authStyles.fieldLabel}>Título</Text><TextInput style={authStyles.fieldInput} value={title} onChangeText={setTitle} placeholder="Digite o título" placeholderTextColor="#9a9a9a"/></View>
 <View style={authStyles.field}><Text style={authStyles.fieldLabel}>Descrição</Text><TextInput style={[authStyles.fieldInput,{minHeight:110,textAlignVertical:'top'}]} value={description} onChangeText={setDescription} multiline placeholder="Conte mais detalhes" placeholderTextColor="#9a9a9a"/></View>
 {message?<Text style={authStyles.loadingSubtitle}>{message}</Text>:null}
 <TouchableOpacity style={authStyles.primaryButton} onPress={save} disabled={busy}>{busy?<ActivityIndicator color={colors.white}/>:<Text style={authStyles.primaryButtonText}>{content.cta}</Text>}</TouchableOpacity>
 </View></ScrollView>;
}
