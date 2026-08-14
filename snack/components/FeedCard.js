import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { feedCardStyles } from '../styles/feedCardStyles';

export function FeedCard({ item }) {
  const navigation = useNavigation();

  return (
    <View style={feedCardStyles.card}>
      <View style={feedCardStyles.cardHeader}>
        <Text style={feedCardStyles.avatarEmoji}>{item.avatar}</Text>
        <View style={feedCardStyles.authorInfo}>
          <Text style={feedCardStyles.authorName}>{item.author}</Text>
          <Text style={feedCardStyles.timestamp}>{item.timestamp}</Text>
        </View>
      </View>

      <Text style={feedCardStyles.cardContent}>{item.content}</Text>

      {item.image ? (
        <View style={feedCardStyles.cardImage}>
          <Text style={feedCardStyles.cardImageEmoji}>{item.image}</Text>
        </View>
      ) : null}

      <View style={feedCardStyles.cardFooter}>
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={() => navigation.navigate('favorites')}>
          <MaterialCommunityIcons name="heart-outline" size={20} color={colors.primary} />
          <Text style={feedCardStyles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={() => navigation.navigate('chat')}>
          <MaterialCommunityIcons name="comment-outline" size={20} color={colors.textMuted} />
          <Text style={feedCardStyles.actionText}>Comentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={() => navigation.navigate('create')}>
          <MaterialCommunityIcons name="share-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
