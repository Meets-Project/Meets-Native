import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const feedCardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
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
  presentationBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presentationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  presentationTitle: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 10,
  },
  speakersBlock: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  speakersTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  speakerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speakerAvatar: {
    fontSize: 18,
  },
  speakerName: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  speakerRateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  speakerRateButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardImage: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardImageEmoji: {
    fontSize: 64,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
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
});
