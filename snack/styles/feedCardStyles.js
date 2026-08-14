import { Platform, StyleSheet } from 'react-native';
import { colors } from './colors';

const cardShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' },
  default: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export const feedCardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    ...cardShadow,
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
  cardImagePreview: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  cardImagePreviewImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.primarySoft,
  },
  cardImageCaption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: colors.textMuted,
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
});
