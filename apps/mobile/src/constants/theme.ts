
export const PALETTE = {
  // Dark Mode "Deep Vitality"
  dark: {
    background: ['#121217', '#161821', '#0d0d11'], // Tiefes, edles Grau-Blau-Schwarz
    surface: 'rgba(255, 255, 255, 0.03)', // Sehr subtiles Glas
    surfaceHighlight: 'rgba(255, 255, 255, 0.08)', // Helleres Glas für Interaktion
    border: 'rgba(255, 255, 255, 0.06)',
    
    text: '#FFFFFF',
    textSecondary: '#8F9BB3', // Kühles Grau
    textMuted: '#525C70',

    // Akzente - Vibrant & Modern
    primary: '#2DD4BF', // Teal-Mint - Steht für frischen Atem/Gesundheit
    primaryGlow: 'rgba(45, 212, 191, 0.3)',
    
    success: '#4ADE80', // Modernes Grün
    successGlow: 'rgba(74, 222, 128, 0.25)',
    
    error: '#FB7185', // Weiches Rose-Red statt hartem Rot
    errorGlow: 'rgba(251, 113, 133, 0.25)',
    
    money: '#F472B6', // Pink/Gold Mix für "Reward" (Mal was anderes als Gelb) oder klassisch Gold
    moneyClassic: '#FBBF24',
  },
  // Light Mode "Clean Slate"
  light: {
    background: ['#F8F9FC', '#EFF1F5', '#E3E6EB'], // Sehr helles, kühles Grau
    surface: '#FFFFFF',
    surfaceHighlight: '#F8FAFC',
    border: '#E2E8F0',
    
    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',

    primary: '#0D9488', // Dunkleres Teal
    primaryGlow: 'rgba(13, 148, 136, 0.2)',
    
    success: '#059669',
    successGlow: 'rgba(5, 150, 105, 0.15)',
    
    error: '#E11D48',
    errorGlow: 'rgba(225, 29, 72, 0.15)',
    
    money: '#D97706',
    moneyClassic: '#D97706',
  }
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  s: 12,
  m: 20, // Standard Card Radius
  l: 32, // Buttons
  full: 9999,
};

