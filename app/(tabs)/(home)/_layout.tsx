import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeLayout() {
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

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
          title: 'Plantual',
          headerTitleStyle: { fontWeight: '700', fontSize: 22, letterSpacing: -0.4 },
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} hitSlop={8} testID="sign-out-button">
              <LogOut size={20} color={Colors.textSecondary} strokeWidth={1.8} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
