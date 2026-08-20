import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SourceSerif4_400Regular from '@expo-google-fonts/source-serif-4/400Regular';
import SourceSerif4_500Medium from '@expo-google-fonts/source-serif-4/500Medium';
import Inter_300Light from '@expo-google-fonts/inter/300Light';
import Inter_400Regular from '@expo-google-fonts/inter/400Regular';
import Inter_500Medium from '@expo-google-fonts/inter/500Medium';

import { AnimatedSplash } from '@/components/AnimatedSplash';
import { useProfile } from '@/state/profileStore';
import { useSettings } from '@/state/settingsStore';
import { useToday } from '@/state/todayStore';
import { useTheme } from '@/theme/useTheme';
import { TIMING } from '@/motion/useMotion';

SplashScreen.preventAutoHideAsync().catch(() => {});

const allHydrated = () =>
  useSettings.persist.hasHydrated() &&
  useProfile.persist.hasHydrated() &&
  useToday.persist.hasHydrated();

export default function RootLayout() {
  const theme = useTheme();

  const [fontsLoaded, fontError] = useFonts({
    SourceSerif4_400Regular,
    SourceSerif4_500Medium,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
  });

  // Every persisted store must land before the first paint, or the app flashes
  // the default palette and then snaps to the chosen one.
  //
  // Read through zustand's own persist API rather than a flag on the state.
  // hasHydrated is authoritative and cannot be missed, whereas a flag set from
  // outside an action never notifies subscribers, which is exactly how an
  // earlier version of this file deadlocked on the splash screen forever.
  const [storesReady, setStoresReady] = useState(allHydrated);

  useEffect(() => {
    if (storesReady) return;

    const check = () => {
      if (allHydrated()) setStoresReady(true);
    };

    const unsubscribe = [
      useSettings.persist.onFinishHydration(check),
      useProfile.persist.onFinishHydration(check),
      useToday.persist.onFinishHydration(check),
    ];
    // Hydration can finish between first render and this effect running.
    check();

    // Nothing about reading local storage justifies an unbootable app. If it
    // has not landed by now, start with defaults rather than hanging.
    const bail = setTimeout(() => setStoresReady(true), 4000);

    return () => {
      unsubscribe.forEach((u) => u());
      clearTimeout(bail);
    };
  }, [storesReady]);

  // A missing font must degrade to a system face, never block launch.
  const ready = (fontsLoaded || !!fontError) && storesReady;

  // The native splash holds until everything is loaded, then hands off to the
  // animated mark. Handing off rather than cross fading means the user never
  // sees an empty frame between the two.
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    // Paints behind modal transitions and during rotation, so no white flash
    // ever appears from underneath the app.
    SystemUI.setBackgroundColorAsync(theme.colors.bg).catch(() => {});
    // The theme is a stored user choice, so useColorScheme is never read. This
    // pushes the choice down to native chrome: keyboard, selection handles,
    // alerts and share sheets.
    Appearance.setColorScheme(theme.dim ? 'dark' : 'light');
  }, [theme]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={theme.dim ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: TIMING.base,
            contentStyle: { backgroundColor: theme.colors.bg },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(main)" />
          <Stack.Screen name="game/[key]" />
          <Stack.Screen
            name="set-complete"
            options={{ presentation: 'modal', gestureEnabled: false }}
          />
        </Stack>

        {/* Sits above the app, which is already mounted underneath, so the lift
            reveals a screen that is finished rather than one still settling. */}
        {introDone ? null : <AnimatedSplash onDone={() => setIntroDone(true)} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
