import React,{useState} from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { feedCardStyles } from '../styles/feedCardStyles';
import { toggleLike,toggleSave } from '../services/api';

export function FeedCard({item}){
 const navigation=useNavigation();const [likes,setLikes]=useState(item.likes||0);const [saved,setSaved]=useState(false);
 async function like(){try{const r=await toggleLike(item.id);setLikes(r.likes);}catch{}}
 async function save(){try{const r=await toggleSave(item.id);setSaved(r.saved);}catch{}}
 return <View style={feedCardStyles.card}><View style={feedCardStyles.cardHeader}><Text style={feedCardStyles.avatarEmoji}>{item.avatar}</Text><View style={feedCardStyles.authorInfo}><Text style={feedCardStyles.authorName}>{item.author}</Text><Text style={feedCardStyles.timestamp}>{item.timestamp}</Text></View></View>
 <Text style={feedCardStyles.cardContent}>{item.content}</Text>{item.image?<View style={feedCardStyles.cardImage}><Image source={{uri:item.image}} style={feedCardStyles.cardImageImage} resizeMode="cover" /></View>:null}
 <View style={feedCardStyles.cardFooter}>
  <TouchableOpacity style={feedCardStyles.actionButton} onPress={like}><MaterialCommunityIcons name="heart-outline" size={20} color={colors.primary}/><Text style={feedCardStyles.actionText}>{likes}</Text></TouchableOpacity>
  <TouchableOpacity style={feedCardStyles.actionButton} onPress={()=>navigation.navigate('chat')}><MaterialCommunityIcons name="comment-outline" size={20} color={colors.textMuted}/><Text style={feedCardStyles.actionText}>Comentar</Text></TouchableOpacity>
  <TouchableOpacity style={feedCardStyles.actionButton} onPress={save}><MaterialCommunityIcons name={saved?'bookmark':'bookmark-outline'} size={20} color={saved?colors.primary:colors.textMuted}/></TouchableOpacity>
 </View></View>;
}
