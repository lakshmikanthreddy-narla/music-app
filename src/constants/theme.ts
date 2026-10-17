export const COLORS = {
  background: '#0D0D0D',
  surface: '#1B1B1B',
  surfaceLight: '#242424',
  surfaceRaised: '#1F1F1F',
  tabBar: '#111110',
  tabBarBorder: 'rgba(255, 255, 255, 0.06)',
  profileCard: '#0E0E0E',
  profileCardBorder: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.08)',
  hairline: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glass: 'rgba(27, 27, 27, 0.85)',
  
  activeWhite: '#FCFCFC',
  onWhite: '#000000',
  
  trendTop50: '#454444',
  trendViral: ['#C2453F', '#932931'] as const,
  
  text: {
    primary: '#FFFFFF',
    secondary: '#B4B6B5',
    meta: '#A4A5A4',
    muted: '#777777',
    gender: '#D9DAD9',
  },
  
  accent: {
    white: '#FCFCFC',
    black: '#000000',
    grey: '#1B1B1B',
    subtleGrey: '#2A2A2A',
    cyan: '#FCFCFC', // Fallback compatibility mapping
    cyanBright: '#FFFFFF',
    cyanGlow: 'rgba(255, 255, 255, 0.1)',
    green: '#FFFFFF',
    greenGlow: 'rgba(255, 255, 255, 0.1)',
    red: '#FF4444',
    redGlow: 'rgba(255, 68, 68, 0.2)',
    purple: '#2A2A2A',
    navyGradient: ['#0D0D0D', '#0D0D0D', '#0D0D0D'] as const,
  },
  
  player: {
    progressTrack: 'rgba(255, 255, 255, 0.25)',
    progressFill: '#FFFFFF',
  }
};

export const SIZES = {
  /**
   * Clearance a scrolling screen must leave at the bottom so the last row is
   * never trapped under the tab bar + mini player.
   */
  bottomInset: 150,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    pill: 999,
  }
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SHADOWS = {
  playButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  ambient: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  }
};
