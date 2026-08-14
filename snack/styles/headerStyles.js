import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logo: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  label: {
    color: '#e6efff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 6,
  },
  description: {
    color: '#dce7fb',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: '100%',
  },
});
