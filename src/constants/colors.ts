export const darkTheme = {
  mode: 'dark' as const,

  // Backgrounds
  background:    '#0D1117',
  surface:       '#161B22',
  surfaceRaised: '#21262D',
  overlay:       'rgba(0,0,0,0.6)',

  // Borders
  border:        '#30363D',
  borderSubtle:  'rgba(255,255,255,0.06)',

  // Text
  textPrimary:   '#F0F6FC',
  textSecondary: '#8B949E',
  textMuted:     '#484F58',
  textInverse:   '#0D1117',

  // Brand — deep green → emerald
  primary:       '#0A6E4E',
  primaryLight:  '#12A376',
  primaryGrad:   ['#0A6E4E', '#12A376', '#1DDBA0'] as string[],

  // Accent — warm gold
  accent:        '#F4A825',
  accentLight:   '#FFD166',
  accentGrad:    ['#F4A825', '#FFD166'] as string[],

  // Semantic
  success:       '#1DDBA0',
  successBg:     'rgba(29,219,160,0.12)',
  danger:        '#E63946',
  dangerBg:      'rgba(230,57,70,0.12)',
  warning:       '#F4A825',
  warningBg:     'rgba(244,168,37,0.12)',
  info:          '#58A6FF',
  infoBg:        'rgba(88,166,255,0.12)',

  // Cards
  cardBg:        'rgba(255,255,255,0.04)',
  cardBorder:    'rgba(255,255,255,0.08)',

  // Tab bar
  tabBarBg:      '#161B22',
  tabActive:     '#12A376',
  tabInactive:   '#484F58',

  // Shadows (minimal on dark — use glow instead)
  shadow:        'rgba(0,0,0,0.6)',
};

export const lightTheme = {
  mode: 'light' as const,

  // Backgrounds
  background:    '#F6F8FA',
  surface:       '#FFFFFF',
  surfaceRaised: '#EEF1F4',
  overlay:       'rgba(0,0,0,0.4)',

  // Borders
  border:        '#D0D7DE',
  borderSubtle:  'rgba(0,0,0,0.06)',

  // Text
  textPrimary:   '#1C2128',
  textSecondary: '#57606A',
  textMuted:     '#8C959F',
  textInverse:   '#F0F6FC',

  // Brand — same gradient, works on light too
  primary:       '#0A6E4E',
  primaryLight:  '#12A376',
  primaryGrad:   ['#0A6E4E', '#12A376', '#1DDBA0'] as string[],

  // Accent
  accent:        '#F4A825',
  accentLight:   '#FFD166',
  accentGrad:    ['#F4A825', '#FFD166'] as string[],

  // Semantic
  success:       '#0A6E4E',
  successBg:     'rgba(10,110,78,0.08)',
  danger:        '#CF222E',
  dangerBg:      'rgba(207,34,46,0.08)',
  warning:       '#9A6700',
  warningBg:     'rgba(154,103,0,0.08)',
  info:          '#0969DA',
  infoBg:        'rgba(9,105,218,0.08)',

  // Cards
  cardBg:        '#FFFFFF',
  cardBorder:    '#D0D7DE',

  // Tab bar
  tabBarBg:      '#FFFFFF',
  tabActive:     '#0A6E4E',
  tabInactive:   '#8C959F',

  // Shadows
  shadow:        'rgba(27,31,35,0.15)',
};

export type Theme = typeof darkTheme;
