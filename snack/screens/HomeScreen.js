import React,{useCallback,useState} from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { FeedCard } from '../components/FeedCard';
import { screenStyles } from '../styles/screenStyles';
import { getFeed } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../styles/colors';

export function HomeScreen(){
 const [items,setItems]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useFocusEffect(useCallback(()=>{let active=true;(async()=>{setLoading(true);try{const data=await getFeed();if(active)setItems(data);}catch(e){if(active)setError(e.message);}finally{if(active)setLoading(false);}})();return()=>{active=false;};},[]));
 if(loading)return <View style={[screenStyles.listContent,{justifyContent:'center',alignItems:'center',minHeight:360}]}><ActivityIndicator color={colors.primary}/><Text style={[screenStyles.sectionTitle,{marginTop:12}]}>Carregando feed...</Text></View>;
 return <FlatList data={items} keyExtractor={i=>i.id} renderItem={({item})=><FeedCard item={{...item,author:item.author?.name||'Usuário',avatar:item.author?.avatar||'👤',timestamp:new Date(item.created_at).toLocaleString('pt-BR')}}/>} contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false} ItemSeparatorComponent={()=> <View style={screenStyles.separator}/>} ListHeaderComponent={error?<View style={screenStyles.sectionCard}><Text style={screenStyles.sectionText}>{error}</Text></View>:null}/>;
}
