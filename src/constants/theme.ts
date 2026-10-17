export const COLORS = {
  background: '#060B18',
  surface: '#0A1128',
  surfaceLight: '#0E1A38',
  glass: 'rgba(10, 17, 40, 0.75)',
  surfaceRaised: '#0D1B36',
  hairline: 'rgba(0, 212, 255, 0.14)',
  glassBorder: 'rgba(0, 212, 255, 0.22)',
  
  text: {
    primary: '#FFFFFF',
    secondary: '#8A99AD',
    muted: '#4E5D78',
  },
  
  accent: {
    cyan: '#00D4FF',
    cyanBright: '#00F0FF',
    cyanGlow: 'rgba(0, 212, 255, 0.35)',
    green: '#00E676',
    greenGlow: 'rgba(0, 230, 118, 0.2)',
    red: '#FF3366',
    redGlow: 'rgba(255, 51, 102, 0.2)',
    purple: '#7928CA',
    navyGradient: ['#060B18', '#0A1128', '#0E1A38'] as const,
  },
  
  player: {
    progressTrack: 'rgba(0, 212, 255, 0.2)',
    progressFill: '#00D4FF',
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
  glass: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10, // For Android
  },
  ambient: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  }
};
