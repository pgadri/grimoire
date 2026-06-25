export const Colors = {
  background: '#EDE9E3',
  card: '#FFFFFF',
  text: '#1A2332',
  textSecondary: '#8B8B8B',
  textTertiary: '#BDBDBD',
  sectionLabel: '#A0A0A0',
  primary: '#2A1B5E',
  primaryLight: '#3D2878',
  accent: '#7C5CBF',
  gold: '#F0A500',
  border: '#E8E4DE',
  tabActive: '#2A1B5E',
  tabInactive: '#B0ACAA',
  success: '#22C55E',
  error: '#EF4444',
  overlay: 'rgba(26,35,50,0.6)',
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
}

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 50,
}

export const Shadow = {
  card: {
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
}

export const Typography = {
  greeting: { fontSize: 24, fontWeight: '700' as const },
  sectionLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.2 },
  cardTitle: { fontSize: 16, fontWeight: '600' as const },
  cardBody: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  button: { fontSize: 15, fontWeight: '600' as const },
  largeNumber: { fontSize: 28, fontWeight: '700' as const },
  tabLabel: { fontSize: 10, fontWeight: '500' as const },
}
