export const COLORS = {
  background: '#0a0a0a',
  surface: '#141414',
  surfaceElevated: '#1e1e1e',
  surfaceHigh: '#2a2a2a',
  border: '#2a2a2a',
  borderLight: '#3a3a3a',

  primary: '#e63946',
  primaryDark: '#c1121f',
  primaryLight: '#ff6b6b',

  accent: '#f4a261',

  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#606060',
  textInverse: '#0a0a0a',

  success: '#2a9d8f',
  warning: '#f4a261',
  error: '#e63946',

  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
} as const;
