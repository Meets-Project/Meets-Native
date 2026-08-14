import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const bottomNavStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  item: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  itemActive: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
