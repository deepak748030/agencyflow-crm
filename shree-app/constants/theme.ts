import { Platform } from 'react-native';

const tintColorLight = '#D4A017';
const tintColorDark = '#FFD700';

export const Colors = {
  light: {
    text: '#2D1810',
    background: '#FFF8E7',
    tint: tintColorLight,
    icon: '#8B6914',
    tabIconDefault: '#8B6914',
    tabIconSelected: tintColorLight,
    primary: '#D4A017',
    primaryDark: '#B8860B',
    headerBg: '#FFEB3B',
    accent: '#FF9800',
    cardBg: '#FFFDE7',
    border: '#FFD54F',
  },
  dark: {
    text: '#FFF8E1',
    background: '#1A1200',
    tint: tintColorDark,
    icon: '#FFD54F',
    tabIconDefault: '#FFD54F',
    tabIconSelected: tintColorDark,
    primary: '#FFD700',
    primaryDark: '#FFC107',
    headerBg: '#3E2723',
    accent: '#FF9800',
    cardBg: '#2D2000',
    border: '#5D4037',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
