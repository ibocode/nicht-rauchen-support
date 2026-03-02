
import { useAuth } from '@/utils/auth/useAuth';
import { useAuthStore } from '@/utils/auth/store';
import { Stack } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { notificationService } from '@/utils/notifications';
import { purchaseService } from '@/utils/purchases';
import { analyticsService } from '@/utils/analytics';
import { quitData } from '@/utils/quitData';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import SplashScreenComponent from '@/components/SplashScreenComponent';

// Verhindere Auto-Hide des nativen Splash Screens (nur einmal beim App-Start)
SplashScreen.preventAutoHideAsync().catch(error => {
  console.warn('Error preventing splash screen auto-hide:', error);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Fallback für Auth-Init bei Fehlern
    const ensureAuthReady = () => {
      useAuthStore.setState({ isReady: true, auth: null });
    };

    const initializeApp = async () => {
      try {
        // Initialisiere App-Daten (Kritisch)
        await quitData.init();
        await purchaseService.init();
        await analyticsService.initialize();
      } catch (error) {
        console.error('Failed to init services:', error);
      }

      // Starte Auth sofort, um UI anzuzeigen (Kritisch)
      try {
        initiate();
      } catch (error) {
        console.error('Failed to initiate auth:', error);
        ensureAuthReady();
      }

      // Initialisiere Benachrichtigungen im Hintergrund (Nicht-Kritisch für Start)
      notificationService.initializeOnAppStart()
        .then(() => notificationService.refillNotifications())
        .catch(err => console.log('Notification init failed (non-critical):', err));
    };

    initializeApp().catch(error => {
      console.error('Fatal initialization error:', error);
      ensureAuthReady();
    });
  }, [initiate]);

  // Benachrichtigungsbehandlung für Weiterleitung zur App
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data;
      if (data?.action === 'open_app') {
        // SECURITY: Verify payment before navigating
        try {
          const isPro = await quitData.isProUser();
          if (isPro) {
            router.push('/(tabs)/today');
          } else {
            // User not paid, redirect to onboarding
            router.push('/onboarding');
          }
        } catch (error) {
          console.error('Failed to verify pro status on notification:', error);
          // On error, redirect to index for proper check
          router.push('/');
        }
      }
    });

    return () => subscription.remove();
  }, [router]);

  // Stabiler Callback mit useCallback
  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right', // Konsistente Slide-Animation
            presentation: 'card', // Standard Karten-Präsentation
            contentStyle: { backgroundColor: '#121217' }, // Fix white flash
          }}
          initialRouteName="index"
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="onboarding"
            options={{
              animation: 'fade', // Onboarding soll sanft einfaden
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              animation: 'fade', // Nach Onboarding/Splash sanft zu Tabs faden
            }}
          />
        </Stack>

        {showSplash && (
          <SplashScreenComponent
            isReady={isReady}
            onFinish={handleSplashFinish}
          />
        )}
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
