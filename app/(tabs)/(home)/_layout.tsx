import React from 'react';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Plant Passport',
          headerTitleStyle: { fontWeight: '700', fontSize: 22, letterSpacing: -0.4 },
        }}
      />
    </Stack>
  );
}
