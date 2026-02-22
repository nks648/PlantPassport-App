import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PlantProvider } from "@/providers/PlantProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { trpc, trpcClient } from "@/lib/trpc";

try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  console.log('[Layout] SplashScreen.preventAutoHideAsync error:', e);
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="scan-result" options={{ headerShown: false }} />
    </Stack>
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
          <SettingsProvider>
            <PlantProvider>
              <RootLayoutNav />
            </PlantProvider>
          </SettingsProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
