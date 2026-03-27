import { Platform, NativeModules } from 'react-native';

function getDeviceLocale(): string {
  try {
    if (Platform.OS === 'web') {
      return navigator?.language || 'en-US';
    }
    const locale =
      NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
      NativeModules.I18nManager?.localeIdentifier ||
      'en_US';
    return locale.replace('_', '-');
  } catch {
    return 'en-US';
  }
}

const IMPERIAL_REGIONS = ['US', 'MM', 'LR', 'BS', 'KY', 'PW', 'MH'];

export function shouldUseCelsius(): boolean {
  const locale = getDeviceLocale();
  const parts = locale.split('-');
  const region = (parts[parts.length - 1] || '').toUpperCase();
  return !IMPERIAL_REGIONS.includes(region);
}

export function fToC(f: number): number {
  return Math.round((f - 32) * 5 / 9);
}

export function formatTempRange(minF: number, maxF: number, useCelsius: boolean): string {
  if (useCelsius) {
    return `${fToC(minF)}°–${fToC(maxF)}°C`;
  }
  return `${minF}°–${maxF}°F`;
}

export function getTempBarValues(minF: number, maxF: number, useCelsius: boolean): { min: number; max: number; scaleMin: number; scaleMax: number; unit: string } {
  if (useCelsius) {
    return {
      min: fToC(minF),
      max: fToC(maxF),
      scaleMin: fToC(40),
      scaleMax: fToC(120),
      unit: '°C',
    };
  }
  return { min: minF, max: maxF, scaleMin: 40, scaleMax: 120, unit: '°F' };
}
