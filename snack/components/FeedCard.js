import React, { useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { feedCardStyles } from '../styles/feedCardStyles';
import { togglePostStar } from '../services/userApi';
import SaveModal from './SaveModal';
import ShareModal from './ShareModal';

function isRenderableImageUri(uri) {
  if (typeof uri !== 'string' || uri.length === 0) {
    return false;
  }

  return (
    uri.startsWith('data:') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('content://') ||
    uri.startsWith('asset://')
  );
}

export function FeedCard({ item }) {
  const navigation = useNavigation();
  const [saveVisible, setSaveVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [starred, setStarred] = useState(Boolean(item?.starred));
  const [likesCount, setLikesCount] = useState(Number(item?.likes || item?.stars || 0));

  async function handleToggleStar() {
    try {
      const result = await togglePostStar(item.id);
      const nextCount = Number(result?.stars || likesCount + (starred ? -1 : 1));
      setStarred(Boolean(result?.starred));
      setLikesCount(nextCount);
    } catch (_error) {
      Alert.alert('Não foi possível atualizar a estrela');
    }
  }

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

      {item.attachment?.type === 'image' && isRenderableImageUri(item.attachment.uri) ? (
        <View style={feedCardStyles.cardImagePreview}>
          <Image
            source={{ uri: item.attachment.uri }}
            style={feedCardStyles.cardImagePreviewImage}
            resizeMode="cover"
          />
          {item.attachment.name ? (
            <Text style={feedCardStyles.cardImageCaption}>{item.attachment.name}</Text>
          ) : null}
        </View>
      ) : null}

      {item.image && !(item.attachment?.type === 'image' && isRenderableImageUri(item.attachment.uri)) ? (
        <View style={feedCardStyles.cardImage}>
          <Text style={feedCardStyles.cardImageEmoji}>{item.image}</Text>
        </View>
      ) : null}

      <View style={feedCardStyles.cardFooter}>
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={handleToggleStar}>
          <MaterialCommunityIcons name={starred ? 'star' : 'star-outline'} size={20} color={colors.primary} />
          <Text style={feedCardStyles.actionText}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={() => navigation.navigate('Comments', { creation: item })}>
          <MaterialCommunityIcons name="comment-outline" size={20} color={colors.textMuted} />
          <Text style={feedCardStyles.actionText}>Comentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={() => setShareVisible(true)}>
          <MaterialCommunityIcons name="share-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <SaveModal visible={saveVisible} onClose={() => setSaveVisible(false)} creation={item} />
      <ShareModal visible={shareVisible} onClose={() => setShareVisible(false)} creation={item} navigation={navigation} />
    </View>
  );
}
