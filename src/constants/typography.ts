import { Platform } from 'react-native';

// Use Plus Jakarta Sans on both platforms
// Load via expo-font in _layout.tsx
export const fonts = {
  regular:     'PlusJakartaSans_400Regular',
  medium:      'PlusJakartaSans_500Medium',
  semiBold:    'PlusJakartaSans_600SemiBold',
  bold:        'PlusJakartaSans_700Bold',
  extraBold:   'PlusJakartaSans_800ExtraBold',
};

export const typography = {
  h1:      { fontSize: 28, fontFamily: fonts.bold,      letterSpacing: -0.5, lineHeight: 34 },
  h2:      { fontSize: 22, fontFamily: fonts.bold,      letterSpacing: -0.3, lineHeight: 28 },
  h3:      { fontSize: 18, fontFamily: fonts.semiBold,  lineHeight: 24 },
  h4:      { fontSize: 16, fontFamily: fonts.semiBold,  lineHeight: 22 },
  body:    { fontSize: 15, fontFamily: fonts.regular,   lineHeight: 22 },
  bodyMed: { fontSize: 15, fontFamily: fonts.medium,    lineHeight: 22 },
  small:   { fontSize: 13, fontFamily: fonts.regular,   lineHeight: 18 },
  caption: { fontSize: 12, fontFamily: fonts.regular,   lineHeight: 16 },
  label:   { fontSize: 13, fontFamily: fonts.semiBold,  letterSpacing: 0.3 },
  price:   { fontSize: 26, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  priceSm: { fontSize: 18, fontFamily: fonts.bold,      letterSpacing: -0.3 },
};
