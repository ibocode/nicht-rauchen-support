import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { quitData } from '@/utils/quitData';

export default function Index() {
  const [isOnboarded, setIsOnboarded] = useState(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      // Ensure quitData is initialized before checking
      await quitData.init();
      
      // Safety check
      if (!quitData || typeof quitData.isProUser !== 'function') {
        console.log('quitData not ready yet');
        setIsOnboarded(false);
        return;
      }

      const isPro = await quitData.isProUser();
      setIsOnboarded(isPro);
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setIsOnboarded(false);
    }
  };

  if (isOnboarded === null) {
    return null;
  }

  return <Redirect href={isOnboarded ? '/(tabs)/today' : '/onboarding'} />;
}
