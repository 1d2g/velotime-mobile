export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentTheme = 'rose' | 'blue' | 'violet' | 'amber';

export interface AccentPalette {
  label: string;
  swatch: string;
  darkPrimary: string;
  darkHover: string;
  darkMuted: string;
  darkText: string;
  darkHighlight: string;
  lightPrimary: string;
  lightHover: string;
  lightMuted: string;
  lightText: string;
  lightHighlight: string;
}

export const ACCENT_PALETTES: Record<AccentTheme, AccentPalette> = {
  rose: {
    label: 'VeloTime Rose',
    swatch: '#F43F5E',
    darkPrimary: '#F43F5E',
    darkHover: '#E11D48',
    darkMuted: 'rgba(244, 63, 94, 0.16)',
    darkText: '#FDA4AF',
    darkHighlight: 'rgba(244, 63, 94, 0.12)',
    lightPrimary: '#E11D48',
    lightHover: '#BE123C',
    lightMuted: '#FFF1F2',
    lightText: '#9F1239',
    lightHighlight: '#FFF1F2',
  },
  blue: {
    label: 'Cobalt Blue',
    swatch: '#3B82F6',
    darkPrimary: '#3B82F6',
    darkHover: '#2563EB',
    darkMuted: 'rgba(59, 130, 246, 0.16)',
    darkText: '#93C5FD',
    darkHighlight: 'rgba(59, 130, 246, 0.12)',
    lightPrimary: '#2563EB',
    lightHover: '#1D4ED8',
    lightMuted: '#EFF6FF',
    lightText: '#1E40AF',
    lightHighlight: '#EFF6FF',
  },
  violet: {
    label: 'Electric Violet',
    swatch: '#8B5CF6',
    darkPrimary: '#8B5CF6',
    darkHover: '#7C3AED',
    darkMuted: 'rgba(139, 92, 246, 0.16)',
    darkText: '#C4B5FD',
    darkHighlight: 'rgba(139, 92, 246, 0.12)',
    lightPrimary: '#7C3AED',
    lightHover: '#6D28D9',
    lightMuted: '#F5F3FF',
    lightText: '#5B21B6',
    lightHighlight: '#F5F3FF',
  },
  amber: {
    label: 'Solar Amber',
    swatch: '#F59E0B',
    darkPrimary: '#F59E0B',
    darkHover: '#D97706',
    darkMuted: 'rgba(245, 158, 11, 0.16)',
    darkText: '#FCD34D',
    darkHighlight: 'rgba(245, 158, 11, 0.12)',
    lightPrimary: '#D97706',
    lightHover: '#B45309',
    lightMuted: '#FFFBEB',
    lightText: '#92400E',
    lightHighlight: '#FFFBEB',
  },
};

export interface ThemeColors {
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceSubtle: string;
  surfaceHover: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryHover: string;
  primaryMuted: string;
  primaryText: string;
  primaryContrast: string;
  text: string;
  textMuted: string;
  textDim: string;
  accent: string;
  danger: string;
  warning: string;
  inputBg: string;
  cardHighlight: string;
}

export const darkTheme: ThemeColors = {
  isDark: true,
  bg: '#0F172A', // Slate 900
  surface: '#182032', // Deep Slate Surface
  surfaceSubtle: '#1E293B', // Slate 800
  surfaceHover: '#28354D',
  border: '#334155', // Slate 700
  borderSubtle: '#1E293B',
  primary: '#F43F5E', // VeloTime Brand Rose-500
  primaryHover: '#E11D48', // Rose-600
  primaryMuted: 'rgba(244, 63, 94, 0.16)',
  primaryText: '#FDA4AF', // Rose-300
  primaryContrast: '#FFFFFF',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  accent: '#38BDF8',
  danger: '#EF4444',
  warning: '#F59E0B',
  inputBg: '#090D16',
  cardHighlight: 'rgba(244, 63, 94, 0.12)',
};

export const lightTheme: ThemeColors = {
  isDark: false,
  bg: '#E5E7EB', // VeloTime Website Body: Gray-200
  surface: '#FFFFFF', // Clean White Cards
  surfaceSubtle: '#F8FAFC', // Slate-50
  surfaceHover: '#F1F5F9', // Slate-100
  border: '#CBD5E1', // VeloTime Website Grid Border: #CBD5E1
  borderSubtle: '#E2E8F0', // Slate-200
  primary: '#E11D48', // VeloTime Brand Rose-600
  primaryHover: '#BE123C', // Rose-700
  primaryMuted: '#FFF1F2', // VeloTime Highlight: Rose-50
  primaryText: '#9F1239', // Rose-800
  primaryContrast: '#FFFFFF',
  text: '#0F172A', // Slate-900
  textMuted: '#64748B', // Slate-500
  textDim: '#94A3B8', // Slate-400
  accent: '#0284C7',
  danger: '#E11D48',
  warning: '#D97706',
  inputBg: '#FFFFFF',
  cardHighlight: '#FFF1F2',
};

// Default fallback export
export const Colors = darkTheme;

export function getThemedColors(isDark: boolean, accent: AccentTheme = 'rose'): ThemeColors {
  const base = isDark ? darkTheme : lightTheme;
  const palette = ACCENT_PALETTES[accent] || ACCENT_PALETTES.rose;
  return {
    ...base,
    primary: isDark ? palette.darkPrimary : palette.lightPrimary,
    primaryHover: isDark ? palette.darkHover : palette.lightHover,
    primaryMuted: isDark ? palette.darkMuted : palette.lightMuted,
    primaryText: isDark ? palette.darkText : palette.lightText,
    cardHighlight: isDark ? palette.darkHighlight : palette.lightHighlight,
  };
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};
