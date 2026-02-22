import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useColorScheme } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';

export type TemperatureUnit = 'celsius' | 'fahrenheit' | 'auto';
export type AppLanguage = 'en' | 'es' | 'pt';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  temperatureUnit: TemperatureUnit;
  language: AppLanguage;
  themeMode: ThemeMode;
}

const DEFAULT_SETTINGS: AppSettings = {
  temperatureUnit: 'auto',
  language: 'en',
  themeMode: 'system',
};

const SETTINGS_KEY = 'plant_passport_settings_v1';

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const settingsQuery = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) return JSON.parse(stored) as AppSettings;
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      } catch (e) {
        console.log('Error loading settings:', e);
        return DEFAULT_SETTINGS;
      }
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    console.log('Settings updated:', updates);
  }, [settings]);

  const isDark = useMemo(() => {
    if (settings.themeMode === 'dark') return true;
    if (settings.themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [settings.themeMode, systemScheme]);

  const useCelsius = useMemo(() => {
    if (settings.temperatureUnit === 'celsius') return true;
    if (settings.temperatureUnit === 'fahrenheit') return false;
    return true;
  }, [settings.temperatureUnit]);

  const languageLabels: Record<AppLanguage, Record<string, string>> = useMemo(() => ({
    en: {
      home: 'Home',
      plants: 'Plants',
      community: 'Community',
      profile: 'Profile',
      settings: 'Settings',
      ranks: 'Ranks',
      myPlants: 'My Plants',
      scanPlant: 'Scan Plant',
      searchByName: 'Search by Name',
      takePhoto: 'Take Photo',
      chooseGallery: 'Choose from Gallery',
      identifyPlant: 'Identify Any Plant',
      temperature: 'Temperature Unit',
      language: 'Language',
      theme: 'Appearance',
      celsius: 'Celsius (°C)',
      fahrenheit: 'Fahrenheit (°F)',
      auto: 'Auto',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      english: 'English',
      spanish: 'Spanish',
      portuguese: 'Portuguese',
      allTime: 'All Time',
      thisWeek: 'This Week',
      shareYourWin: 'Share Your Win 🌿',
      newPost: 'New Post',
      preferences: 'Preferences',
      addPlant: 'Add Plant',
      searchPlaceholder: 'Search plant name...',
      noResults: 'No results found',
      searching: 'Searching...',
    },
    es: {
      home: 'Inicio',
      plants: 'Plantas',
      community: 'Comunidad',
      profile: 'Perfil',
      settings: 'Ajustes',
      ranks: 'Ranking',
      myPlants: 'Mis Plantas',
      scanPlant: 'Escanear Planta',
      searchByName: 'Buscar por Nombre',
      takePhoto: 'Tomar Foto',
      chooseGallery: 'Elegir de Galería',
      identifyPlant: 'Identificar Cualquier Planta',
      temperature: 'Unidad de Temperatura',
      language: 'Idioma',
      theme: 'Apariencia',
      celsius: 'Celsius (°C)',
      fahrenheit: 'Fahrenheit (°F)',
      auto: 'Automático',
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema',
      english: 'Inglés',
      spanish: 'Español',
      portuguese: 'Portugués',
      allTime: 'Todo el Tiempo',
      thisWeek: 'Esta Semana',
      shareYourWin: 'Comparte Tu Logro 🌿',
      newPost: 'Nueva Publicación',
      preferences: 'Preferencias',
      addPlant: 'Agregar Planta',
      searchPlaceholder: 'Buscar nombre de planta...',
      noResults: 'Sin resultados',
      searching: 'Buscando...',
    },
    pt: {
      home: 'Início',
      plants: 'Plantas',
      community: 'Comunidade',
      profile: 'Perfil',
      settings: 'Configurações',
      ranks: 'Ranking',
      myPlants: 'Minhas Plantas',
      scanPlant: 'Escanear Planta',
      searchByName: 'Buscar por Nome',
      takePhoto: 'Tirar Foto',
      chooseGallery: 'Escolher da Galeria',
      identifyPlant: 'Identificar Qualquer Planta',
      temperature: 'Unidade de Temperatura',
      language: 'Idioma',
      theme: 'Aparência',
      celsius: 'Celsius (°C)',
      fahrenheit: 'Fahrenheit (°F)',
      auto: 'Automático',
      light: 'Claro',
      dark: 'Escuro',
      system: 'Sistema',
      english: 'Inglês',
      spanish: 'Espanhol',
      portuguese: 'Português',
      allTime: 'Todo o Tempo',
      thisWeek: 'Esta Semana',
      shareYourWin: 'Compartilhe Sua Conquista 🌿',
      newPost: 'Nova Publicação',
      preferences: 'Preferências',
      addPlant: 'Adicionar Planta',
      searchPlaceholder: 'Buscar nome da planta...',
      noResults: 'Nenhum resultado encontrado',
      searching: 'Buscando...',
    },
  }), []);

  const t = useCallback((key: string): string => {
    return languageLabels[settings.language]?.[key] || languageLabels.en[key] || key;
  }, [settings.language, languageLabels]);

  return {
    settings,
    updateSettings,
    isDark,
    useCelsius,
    t,
    isLoading: settingsQuery.isLoading,
  };
});
