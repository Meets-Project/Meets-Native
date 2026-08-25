import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const feedCardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  cardContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardImageImage: { width: '100%', height: 260 },
  cardImage: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardImageEmoji: {
    fontSize: 64,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
  },

  presentationBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  presentationBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  eventMeta: { marginBottom: 10, gap: 4 },
  eventMetaText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  presentationTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  speakersBlock: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
  speakersTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  speakerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  speakerAvatar: { fontSize: 22, marginRight: 8 },
  speakerName: { fontSize: 13, fontWeight: '700', color: colors.text },
  speakerRateButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primary,
  },
  speakerRateButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
