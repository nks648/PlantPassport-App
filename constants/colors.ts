export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryMuted: string;
  accent: string;
  accentLight: string;
  background: string;
  backgroundWarm: string;
  card: string;
  cardSolid: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textLight: string;
  success: string;
  warning: string;
  error: string;
  streak: string;
  streakGlow: string;
  shadow: string;
  shadowMedium: string;
  divider: string;
  tabBar: string;
  tabBarBorder: string;
  overlay: string;
  waterBlue: string;
  waterBlueDark: string;
  gold: string;
  silver: string;
  bronze: string;
  xpPurple: string;
  humidityTeal: string;
  inputBackground: string;
  handleColor: string;
  elevatedBackground: string;
}

export const LightColors: ThemeColors = {
  primary: '#30D158',
  primaryLight: '#30D158',
  primaryDark: '#248A3D',
  primaryMuted: 'rgba(48, 209, 88, 0.12)',
  accent: '#007AFF',
  accentLight: '#5AC8FA',
  background: '#F2F2F7',
  backgroundWarm: '#E5E5EA',
  card: 'rgba(255, 255, 255, 0.92)',
  cardSolid: '#FFFFFF',
  cardBorder: 'rgba(60, 60, 67, 0.06)',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  textLight: '#FFFFFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  streak: '#FF9500',
  streakGlow: 'rgba(255, 149, 0, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  divider: 'rgba(60, 60, 67, 0.06)',
  tabBar: 'rgba(249, 249, 249, 0.94)',
  tabBarBorder: 'rgba(60, 60, 67, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  waterBlue: '#007AFF',
  waterBlueDark: '#0040DD',
  gold: '#FFD60A',
  silver: '#8E8E93',
  bronze: '#AC8E68',
  xpPurple: '#AF52DE',
  humidityTeal: '#30B0C7',
  inputBackground: 'rgba(60, 60, 67, 0.04)',
  handleColor: 'rgba(60, 60, 67, 0.1)',
  elevatedBackground: 'rgba(245, 245, 247, 0.95)',
};

export const DarkColors: ThemeColors = {
  primary: '#30D158',
  primaryLight: '#30D158',
  primaryDark: '#248A3D',
  primaryMuted: 'rgba(48, 209, 88, 0.18)',
  accent: '#0A84FF',
  accentLight: '#64D2FF',
  background: '#000000',
  backgroundWarm: '#1C1C1E',
  card: 'rgba(28, 28, 30, 0.92)',
  cardSolid: '#1C1C1E',
  cardBorder: 'rgba(84, 84, 88, 0.36)',
  text: '#FFFFFF',
  textSecondary: 'rgba(235, 235, 245, 0.6)',
  textTertiary: 'rgba(235, 235, 245, 0.3)',
  textLight: '#FFFFFF',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  streak: '#FF9F0A',
  streakGlow: 'rgba(255, 159, 10, 0.18)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.5)',
  divider: 'rgba(84, 84, 88, 0.36)',
  tabBar: 'rgba(30, 30, 30, 0.94)',
  tabBarBorder: 'rgba(84, 84, 88, 0.36)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  waterBlue: '#0A84FF',
  waterBlueDark: '#0040DD',
  gold: '#FFD60A',
  silver: '#98989D',
  bronze: '#AC8E68',
  xpPurple: '#BF5AF2',
  humidityTeal: '#64D2FF',
  inputBackground: 'rgba(120, 120, 128, 0.24)',
  handleColor: 'rgba(235, 235, 245, 0.3)',
  elevatedBackground: 'rgba(28, 28, 30, 0.95)',
};

const Colors = LightColors;
export default Colors;
