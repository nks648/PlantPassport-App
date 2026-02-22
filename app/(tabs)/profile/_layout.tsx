import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Profile', headerTitleStyle: { fontWeight: '700', fontSize: 22, letterSpacing: -0.4 } }} />
    </Stack>
  );
}
