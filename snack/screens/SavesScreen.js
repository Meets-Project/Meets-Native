import React,{useCallback,useState} from 'react';
import { ActivityIndicator,FlatList,Text,View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../styles/screenStyles';
import { getSaves } from '../services/api';
export function SavesScreen(){const [data,setData]=useState([]);const [loading,setLoading]=useState(true);useFocusEffect(useCallback(()=>{let a=true;(async()=>{try{setData(await getSaves());}finally{if(a)setLoading(false);}})();return()=>{a=false;};},[]));if(loading)return <View style={[screenStyles.listContent,{alignItems:'center'}]}><ActivityIndicator/></View>;return <FlatList data={data} keyExtractor={i=>i.id} contentContainerStyle={screenStyles.listContent} renderItem={({item})=><View style={screenStyles.sectionCard}><Text style={screenStyles.rowTitle}>{item.content}</Text><Text style={screenStyles.rowSubtitle}>Por {item.author_name}</Text></View>} ListEmptyComponent={<View style={screenStyles.sectionCard}><Text style={screenStyles.sectionText}>Você ainda não salvou nada.</Text></View>} ItemSeparatorComponent={()=> <View style={screenStyles.separator}/>}/>;}
