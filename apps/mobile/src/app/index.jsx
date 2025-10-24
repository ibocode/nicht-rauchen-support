import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quitData } from '@/utils/quitData';

export default function Index() {
  const [isOnboarded, setIsOnboarded] = useState(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      // Prüfe sowohl app_onboarded als auch ob Settings existieren
      const [onboarded, settings] = await Promise.all([
        AsyncStorage.getItem('app_onboarded'),
        quitData.getSettings()
      ]);
      
      // Wenn app_onboarded explizit auf 'true' gesetzt ist, ist die App onboarded
      if (onboarded === 'true') {
        setIsOnboarded(true);
        return;
      }
      
      // Wenn app_onboarded explizit auf 'false' gesetzt ist (Reset), zeige Onboarding
      if (onboarded === 'false') {
        setIsOnboarded(false);
        return;
      }
      
      // Wenn app_onboarded nicht existiert, prüfe Settings als Fallback
      const hasSettings = settings && Object.keys(settings).length > 0;
      setIsOnboarded(hasSettings);
      
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
