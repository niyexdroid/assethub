export const fonts = {
  regular:   'Poppins_400Regular',
  medium:    'Poppins_500Medium',
  semiBold:  'Poppins_600SemiBold',
  bold:      'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
};

export const typography = {
  h1:      { fontSize: 28, fontFamily: fonts.bold,      letterSpacing: -0.5, lineHeight: 36 },
  h2:      { fontSize: 22, fontFamily: fonts.bold,      letterSpacing: -0.3, lineHeight: 30 },
  h3:      { fontSize: 18, fontFamily: fonts.semiBold,  lineHeight: 26 },
  h4:      { fontSize: 16, fontFamily: fonts.semiBold,  lineHeight: 24 },
  body:    { fontSize: 15, fontFamily: fonts.regular,   lineHeight: 23 },
  bodyMed: { fontSize: 15, fontFamily: fonts.medium,    lineHeight: 23 },
  small:   { fontSize: 13, fontFamily: fonts.regular,   lineHeight: 19 },
  caption: { fontSize: 12, fontFamily: fonts.regular,   lineHeight: 17 },
  label:   { fontSize: 13, fontFamily: fonts.semiBold,  letterSpacing: 0.3 },
  price:   { fontSize: 26, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  priceSm: { fontSize: 18, fontFamily: fonts.bold,      letterSpacing: -0.3 },
};
