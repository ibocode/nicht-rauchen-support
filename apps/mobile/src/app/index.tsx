import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { quitData } from '@/utils/quitData';

type RouteState = 'loading' | 'tabs' | 'paywall' | 'onboarding';

export default function Index() {
  const [route, setRoute] = useState<RouteState>('loading');

  useEffect(() => {
    determineRoute();
  }, []);

  const determineRoute = async () => {
    try {
      await quitData.init();

      // 1. Pro/Paid user? → Go directly to the app.
      const isPro = await quitData.isProUser();
      if (isPro) {
        setRoute('tabs');
        return;
      }

      // 2. Not paid. Has the user completed onboarding steps?
      //    If yes → show paywall again (don't repeat the whole flow).
      //    If no  → start from the beginning.
      const hasOnboarded = await quitData.hasCompletedOnboarding();
      setRoute(hasOnboarded ? 'paywall' : 'onboarding');
    } catch (error) {
      console.error('Error determining route:', error);
      setRoute('onboarding');
    }
  };

  if (route === 'loading') {
    return null; // Splash screen is shown by _layout.tsx
  }

  if (route === 'tabs') {
    return <Redirect href="/(tabs)/today" />;
  }

  // Both 'paywall' and 'onboarding' go to the onboarding screen.
  // The screen uses the 'initialStep' param to decide where to start.
  return (
    <Redirect
      href={route === 'paywall' ? '/onboarding?initialStep=paywall' : '/onboarding'}
    />
  );
}
