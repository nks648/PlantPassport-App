import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PlantProvider } from "@/providers/PlantProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { trpc, trpcClient } from "@/lib/trpc";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inLoginPage = segments[0] === ('login' as string);

    if (!session && !inLoginPage) {
      router.replace('/login' as never);
    } else if (session && inLoginPage) {
      router.replace('/' as never);
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return null;
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});

function RootLayoutNav() {
  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="scan" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="scan-result" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <PlantProvider>
              <RootLayoutNav />
            </PlantProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
