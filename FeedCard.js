import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { feedCardStyles } from '../styles/feedCardStyles';
import { toggleLike, toggleSave } from '../services/api';

export function FeedCard({ item }) {
  const navigation = useNavigation();
  const [likes, setLikes] = useState(Number(item.likes || 0));
  const [saved, setSaved] = useState(false);
  const isPresentation = item.type === 'presentation';
  const isEvent = item.type === 'event';
  const speakers = Array.isArray(item.speakers) ? item.speakers : [];

  async function like() {
    try { const r = await toggleLike(item.id); setLikes(Number(r.likes || 0)); } catch {}
  }
  async function save() {
    try { const r = await toggleSave(item.id); setSaved(Boolean(r.saved)); } catch {}
  }

  return (
    <View style={feedCardStyles.card}>
      <View style={feedCardStyles.cardHeader}>
        <Text style={feedCardStyles.avatarEmoji}>{item.avatar || '👤'}</Text>
        <View style={feedCardStyles.authorInfo}>
          <Text style={feedCardStyles.authorName}>{item.author || 'Usuário'}</Text>
          <Text style={feedCardStyles.timestamp}>{item.timestamp || ''}</Text>
        </View>
        {(isPresentation || isEvent) ? (
          <View style={feedCardStyles.presentationBadge}>
            <Text style={feedCardStyles.presentationBadgeText}>{isEvent ? 'Evento' : 'Apresentação'}</Text>
          </View>
        ) : null}
      </View>

      {(isPresentation || isEvent) && item.title ? <Text style={feedCardStyles.presentationTitle}>{item.title}</Text> : null}
      {isEvent ? (
        <View style={feedCardStyles.eventMeta}>
          <Text style={feedCardStyles.eventMetaText}>📅 {item.event_date ? new Date(`${item.event_date}T00:00:00`).toLocaleDateString('pt-BR') : 'Data não informada'}{item.event_time ? ` às ${String(item.event_time).slice(0,5)}` : ''}</Text>
          <Text style={feedCardStyles.eventMetaText}>📍 {item.location || 'Local não informado'}</Text>
        </View>
      ) : null}
      <Text style={feedCardStyles.cardContent}>{item.content}</Text>

      {isPresentation && speakers.length > 0 ? (
        <View style={feedCardStyles.speakersBlock}>
          <Text style={feedCardStyles.speakersTitle}>Apresentadores</Text>
          {speakers.map((speaker) => (
            <View key={speaker.id} style={feedCardStyles.speakerRow}>
              <View style={feedCardStyles.speakerInfo}>
                <Text style={feedCardStyles.speakerAvatar}>{speaker.avatar || '🎤'}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SpeakerProfile', {
                  speakerId: speaker.id, speakerName: speaker.name, speakerAvatar: speaker.avatar || '🎤',
                })}>
                  <Text style={feedCardStyles.speakerName}>{speaker.name}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={feedCardStyles.speakerRateButton}
                onPress={() => navigation.navigate('PresentationRating', {
                  postId: item.id,
                  presentationId: item.presentation_id,
                  presentationTitle: item.title || item.content,
                  speakers,
                  selectedSpeakerId: speaker.id,
                })}
              >
                <Text style={feedCardStyles.speakerRateButtonText}>Avaliar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {item.image ? (
        <View style={feedCardStyles.cardImage}>
          <Image source={{ uri: item.image }} style={feedCardStyles.cardImageImage} resizeMode="cover" />
        </View>
      ) : null}

      <View style={feedCardStyles.cardFooter}>
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={like}>
          <MaterialCommunityIcons name="heart-outline" size={20} color={colors.primary} />
          <Text style={feedCardStyles.actionText}>{likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={() => navigation.navigate('chat')}>
          <MaterialCommunityIcons name="comment-outline" size={20} color={colors.textMuted} />
          <Text style={feedCardStyles.actionText}>Comentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={save}>
          <MaterialCommunityIcons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? colors.primary : colors.textMuted} />
        </TouchableOpacity>
        {isPresentation ? (
          <TouchableOpacity style={feedCardStyles.actionButton} onPress={() => navigation.navigate('PresentationRating', {
            postId: item.id,
            presentationId: item.presentation_id,
            presentationTitle: item.title || item.content,
            speakers,
          })}>
            <MaterialCommunityIcons name="star-outline" size={20} color={colors.textMuted} />
            <Text style={feedCardStyles.actionText}>Avaliar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
