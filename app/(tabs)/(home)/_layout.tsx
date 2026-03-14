import React from 'react';
import { Stack } from 'expo-router';
import { useSettings } from '@/providers/SettingsProvider';

export default function HomeLayout() {
  const { colors } = useSettings();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Plant Passport',
          headerTitleStyle: { fontWeight: '700', fontSize: 22 },
        }}
      />
    </Stack>
  );
}
