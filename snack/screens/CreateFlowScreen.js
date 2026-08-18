import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { createContent, clearToken } from '../services/api';

const copy={event:{icon:'calendar-plus',title:'Criar evento',text:'Defina uma data, convite, descrição e imagem do meetup.',cta:'Salvar evento'},live:{icon:'video-plus',title:'Abrir sala ao vivo',text:'Inicie uma sala em vídeo para conversar com sua comunidade.',cta:'Abrir sala'},post:{icon:'post-outline',title:'Publicar atualização',text:'Compartilhe uma atualização com texto e imagem com sua rede.',cta:'Publicar'}};

export function CreateFlowScreen(){
 const navigation=useNavigation();const route=useRoute();const mode=route.params?.mode||'event';const content=copy[mode]||copy.event;
 const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [image,setImage]=useState(route.params?.editedImage||'');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 useEffect(()=>{if(route.params?.editedImage){setImage(route.params.editedImage);setMessage('Imagem editada aplicada.');}},[route.params?.editedImage]);
 async function chooseImage(){
   const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:false,quality:1});
   if(result.canceled) return;
   const uri=result.assets?.[0]?.uri; if(!uri) return;
   navigation.navigate('ImageEditor',{uri,returnTo:'CreateFlow'});
 }
 function editImage(){if(image) navigation.navigate('ImageEditor',{uri:image,returnTo:'CreateFlow'});}
 async function save(){if(!title.trim())return setMessage('Título é obrigatório.');setBusy(true);setMessage('');try{await createContent({mode,title:title.trim(),description,image:image||undefined});navigation.goBack();}catch(e){if(e?.status===401){await clearToken();setMessage('Sua sessão expirou. Faça login novamente.');setTimeout(()=>navigation.replace('Login'),500);}else setMessage(e.message||'Não foi possível salvar.');}finally{setBusy(false);}}
 return <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled"><View style={authStyles.hero}><View style={authStyles.logoMark}><MaterialCommunityIcons name={content.icon} size={42} color="#fff"/></View><Text style={authStyles.heroTitle}>{content.title}</Text><Text style={authStyles.heroText}>{content.text}</Text></View><View style={authStyles.card}>
 <View style={authStyles.field}><Text style={authStyles.fieldLabel}>Título</Text><TextInput style={authStyles.fieldInput} value={title} onChangeText={setTitle} placeholder="Digite o título" placeholderTextColor="#9a9a9a"/></View>
 <View style={authStyles.field}><Text style={authStyles.fieldLabel}>Descrição</Text><TextInput style={[authStyles.fieldInput,{minHeight:110,textAlignVertical:'top'}]} value={description} onChangeText={setDescription} multiline placeholder="Conte mais detalhes" placeholderTextColor="#9a9a9a"/></View>
 <View style={{marginBottom:16}}><Text style={authStyles.fieldLabel}>Imagem</Text>{image?<View style={{borderRadius:12,overflow:'hidden',backgroundColor:'#111'}}><Image source={{uri:image}} style={{width:'100%',height:220,resizeMode:'contain'}}/></View>:<View style={{height:150,borderRadius:12,borderWidth:1,borderColor:'#ddd',alignItems:'center',justifyContent:'center',backgroundColor:'#fafafa'}}><MaterialCommunityIcons name="image-plus" size={42} color={colors.textMuted}/><Text style={{marginTop:8,color:colors.textMuted}}>Nenhuma imagem selecionada</Text></View>}<View style={{flexDirection:'row',gap:8,marginTop:10}}><TouchableOpacity style={[authStyles.secondaryButton,{flex:1}]} onPress={chooseImage}><MaterialCommunityIcons name="image-plus" size={20} color={colors.primary}/><Text style={authStyles.secondaryButtonText}>Escolher imagem</Text></TouchableOpacity>{image?<TouchableOpacity style={[authStyles.secondaryButton,{flex:1}]} onPress={editImage}><MaterialCommunityIcons name="image-edit" size={20} color={colors.primary}/><Text style={authStyles.secondaryButtonText}>Editar imagem</Text></TouchableOpacity>:null}</View></View>
 {message?<Text style={authStyles.loadingSubtitle}>{message}</Text>:null}
 <TouchableOpacity style={authStyles.primaryButton} onPress={save} disabled={busy}>{busy?<ActivityIndicator color={colors.white}/>:<Text style={authStyles.primaryButtonText}>{content.cta}</Text>}</TouchableOpacity>
 </View></ScrollView>;
}
