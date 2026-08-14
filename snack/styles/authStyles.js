import { Platform, StyleSheet } from 'react-native';
import { colors } from './colors';

const cardShadow = Platform.select({
  web: {
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)',
  },
  default: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});

export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    ...Platform.select({
      web: { boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.18)' },
      default: {
        shadowColor: colors.shadow,
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
      },
    }),
  },
  logoMarkText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  loadingTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
  },
  loadingSubtitle: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  loadingSpinner: {
    marginTop: 22,
  },
  hero: {
    marginBottom: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
  },
  heroText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    ...cardShadow,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  guestButton: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '800',
  },
});
