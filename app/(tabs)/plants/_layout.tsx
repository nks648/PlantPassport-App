import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function PlantsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Plants', headerTitleStyle: { fontWeight: '700', fontSize: 22, letterSpacing: -0.4 } }} />
      <Stack.Screen name="[id]" options={{ headerTitleStyle: { fontWeight: '700', fontSize: 18 } }} />
      <Stack.Screen name="info" options={{ headerTitleStyle: { fontWeight: '700', fontSize: 18 } }} />
    </Stack>
  );
}
