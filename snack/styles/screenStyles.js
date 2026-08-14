import { Platform, StyleSheet } from 'react-native';
import { colors } from './colors';

const sectionShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' },
  default: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

const profileHeroShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' },
  default: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

export const screenStyles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  backendStatusCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  backendStatusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  backendStatusText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  separator: {
    height: 16,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    ...sectionShadow,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowItemLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.secondarySoft,
    color: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  createButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  profileHeroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...profileHeroShadow,
    alignItems: 'center',
  },
  profileAvatarWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatar: {
    fontSize: 56,
    marginBottom: 8,
  },
  profileMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  profileMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  profileMetaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  profileActionPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  profileActionPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  profileActionSecondary: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareIcon: {
    color: colors.primary,
  },
  profileActionSecondaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  profileRole: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  achievementItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  achievementIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementTextWrap: {
    flex: 1,
  },
});
