import React from 'react';
import { Stack } from 'expo-router';
import { useSettings } from '@/providers/SettingsProvider';

export default function PlantsLayout() {
  const { colors } = useSettings();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Plants', headerTitleStyle: { fontWeight: '700', fontSize: 22, letterSpacing: -0.4 } }} />
      <Stack.Screen name="[id]" options={{ headerTitleStyle: { fontWeight: '700', fontSize: 18 } }} />
      <Stack.Screen name="info" options={{ headerTitleStyle: { fontWeight: '700', fontSize: 18 } }} />
    </Stack>
  );
}
