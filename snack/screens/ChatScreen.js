import React,{useCallback,useState} from 'react';
import {ActivityIndicator,FlatList,Text,View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors} from '../styles/colors';
import {screenStyles} from '../styles/screenStyles';
import {getChats} from '../services/api';
export function ChatScreen(){const [chats,setChats]=useState([]);const [loading,setLoading]=useState(true);useFocusEffect(useCallback(()=>{let a=true;(async()=>{try{setChats(await getChats());}finally{if(a)setLoading(false);}})();return()=>{a=false;};},[]));if(loading)return <View style={[screenStyles.listContent,{alignItems:'center'}]}><ActivityIndicator/></View>;return <FlatList data={chats} keyExtractor={i=>i.id} contentContainerStyle={screenStyles.listContent} ItemSeparatorComponent={()=> <View style={screenStyles.separator}/>} renderItem={({item})=><View style={screenStyles.sectionCard}><View style={screenStyles.rowLeft}><MaterialCommunityIcons name="message-processing-outline" size={22} color={colors.primary}/><View><Text style={screenStyles.rowTitle}>{item.name}</Text><Text style={screenStyles.rowSubtitle}>{item.preview}</Text></View></View>{item.unread>0?<Text style={screenStyles.badge}>{item.unread}</Text>:null}</View>} ListEmptyComponent={<View style={screenStyles.sectionCard}><Text style={screenStyles.sectionText}>Nenhuma conversa persistida ainda.</Text></View>}/>;}
