import { Tabs, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Animated, Platform } from 'react-native';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_500Medium,
} from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PALETTE } from '@/constants/theme';
import { quitData } from '@/utils/quitData';

// Animierte Icon Komponente für smoothen Tab-Wechsel Effekt
const TabIcon = ({ focused, name, color, iconName, iconNameOutline }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ scale: scaleAnim }] }}>
      <Ionicons
        name={focused ? iconName : iconNameOutline}
        size={24}
        color={color}
      />
    </Animated.View>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(null);
  
  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
  });

  // SECURITY: Verify user has paid before allowing access to tabs
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const isPro = await quitData.isProUser();
        setIsAuthorized(isPro);
      } catch (error) {
        console.error('Authorization check failed:', error);
        setIsAuthorized(false);
      }
    };
    checkAuthorization();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await quitData.getSettings();
        setDarkModeEnabled(settings.darkModeEnabled !== false);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const theme = useMemo(() => darkModeEnabled ? PALETTE.dark : PALETTE.light, [darkModeEnabled]);

  // Show loading while checking authorization
  if (!fontsLoaded || isAuthorized === null) {
    return null;
  }
  
  // Redirect to onboarding if not authorized
  if (!isAuthorized) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        // animation: 'fade', // DEAKTIVIERT: Verursacht "Grauer Screen"-Bug bei schnellem Wechsel
        detachInactiveScreens: false, // Beibehalten für schnelleren Wechsel
        tabBarStyle: {
          backgroundColor: darkModeEnabled ? '#121217' : '#FFFFFF', 
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
          paddingTop: 12,
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 70,
          elevation: 0, 
          shadowOpacity: 0, 
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Poppins_500Medium',
          marginTop: 4,
        },
        sceneContainerStyle: {
          backgroundColor: theme.background[0], // Dynamischer Hintergrund für beide Modes
        }
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Heute',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              iconName="checkmark-circle" 
              iconNameOutline="checkmark-circle-outline" 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Kalender',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              iconName="calendar" 
              iconNameOutline="calendar-outline" 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="streak"
        options={{
          title: 'Serie',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              iconName="flame" 
              iconNameOutline="flame-outline" 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              iconName="settings" 
              iconNameOutline="settings-outline" 
            />
          ),
        }}
      />
    </Tabs>
  );
}
