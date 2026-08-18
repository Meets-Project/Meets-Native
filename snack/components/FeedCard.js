import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { feedCardStyles } from '../styles/feedCardStyles';

export function FeedCard({ item }) {
  const navigation = useNavigation();
  // Apenas posts do tipo apresentação devem expor ações de avaliação.
  const isPresentation = item.type === 'presentation';
  const speakers = item.speakers || [];

  return (
    <View style={feedCardStyles.card}>
      <View style={feedCardStyles.cardHeader}>
        <Text style={feedCardStyles.avatarEmoji}>{item.avatar}</Text>
        <View style={feedCardStyles.authorInfo}>
          <Text style={feedCardStyles.authorName}>{item.author}</Text>
          <Text style={feedCardStyles.timestamp}>{item.timestamp}</Text>
        </View>
        {isPresentation ? (
          <View style={feedCardStyles.presentationBadge}>
            <Text style={feedCardStyles.presentationBadgeText}>Apresentacao</Text>
          </View>
        ) : null}
      </View>

      <Text style={feedCardStyles.cardContent}>{item.content}</Text>

      {isPresentation && item.title ? <Text style={feedCardStyles.presentationTitle}>{item.title}</Text> : null}

      {isPresentation && speakers.length ? (
        <View style={feedCardStyles.speakersBlock}>
          <Text style={feedCardStyles.speakersTitle}>Apresentadores</Text>
          {speakers.map((speaker) => (
            <View key={speaker.id} style={feedCardStyles.speakerRow}>
              <View style={feedCardStyles.speakerInfo}>
                <Text style={feedCardStyles.speakerAvatar}>{speaker.avatar || '🎤'}</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('SpeakerProfile', {
                      speakerId: speaker.id,
                      speakerName: speaker.name,
                      speakerAvatar: speaker.avatar || '🎤',
                    })
                  }
                >
                  <Text style={feedCardStyles.speakerName}>{speaker.name}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={feedCardStyles.speakerRateButton}
                onPress={() =>
                  // Abre a tela já focada no apresentador selecionado da lista pública do post.
                  navigation.navigate('PresentationRating', {
                    postId: item.id,
                    presentationId: item.presentationId,
                    presentationTitle: item.title || item.content,
                    speakers,
                    selectedSpeakerId: speaker.id,
                  })
                }
              >
                <Text style={feedCardStyles.speakerRateButtonText}>Avaliar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

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
        {isPresentation ? (
          <TouchableOpacity
            style={feedCardStyles.actionButton}
            onPress={() =>
              navigation.navigate('PresentationRating', {
                postId: item.id,
                presentationId: item.presentationId,
                presentationTitle: item.title || item.content,
                speakers,
              })
            }
          >
            <MaterialCommunityIcons name="star-outline" size={20} color={colors.textMuted} />
            <Text style={feedCardStyles.actionText}>Avaliar apresentacao</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
