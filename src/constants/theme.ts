export type ThemeMode = 'dark' | 'light' | 'system';

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
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};
