// Prima brand system — blush/rose/ivory palette, Playfair Display (headings)
// + Poppins (body). See PendingApprovalScreen-style flat usage: colors.* /
// fonts.* are read directly by every screen's StyleSheet, no theming provider.
export const colors = {
  background: '#F7ECE8', // Blush
  card: '#FBF6F4',       // Ivory
  primary: '#D9B7B1',    // Rose — buttons, active states, brand accent
  primaryDark: '#C39992', // pressed/emphasis variant of Rose, replaces old flat primary shadows
  secondary: '#C9A89C',  // Sand — secondary accents, chips, dividers
  dark: '#33333C',       // Charcoal — headings, body text
  green: '#7A9E7E',       // muted sage — success/open/confirmed states, softened to fit the palette
  red: '#C4756B',         // muted terracotta — errors/cancelled, softened to fit the palette
  textMuted: '#8C8378',
  border: '#E7D9D3',
  overlay: 'rgba(51,51,60,0.55)',
};

export const fonts = {
  heading: 'PlayfairDisplay_700Bold',
  headingSemibold: 'PlayfairDisplay_600SemiBold',
  body: 'Poppins_400Regular',
  bodyMedium: 'Poppins_500Medium',
  bodySemibold: 'Poppins_600SemiBold',
  bodyBold: 'Poppins_700Bold',
};

export const radius = {
  sm: 10,
  md: 18,
  lg: 26,
  full: 999,
};

export const shadow = {
  shadowColor: '#33333C',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
