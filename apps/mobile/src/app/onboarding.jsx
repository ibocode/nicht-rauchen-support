import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import OnboardingScreen from '@/components/OnboardingScreen';

export default function Onboarding() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kurze Verzögerung für bessere UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = () => {
    // Navigiere zur Haupt-App
    router.replace('/(tabs)/today');
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#081023' }} />;
  }

  return (
    <OnboardingScreen onComplete={handleOnboardingComplete} />
  );
}