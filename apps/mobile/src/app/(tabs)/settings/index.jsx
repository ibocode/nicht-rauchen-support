import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  StyleSheet,
  Easing
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import { useFocusEffect } from '@react-navigation/native';
import { quitData } from '@/utils/quitData';
import { notificationService } from '@/utils/notifications';
import { purchaseService } from '@/utils/purchases';
import { PALETTE, SPACING, RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

// --- Artistic Background Reuse ---
const FloatingParticle = ({ delay = 0, duration = 4000, size = 20, startX, startY, color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, delay: delay }),
        Animated.timing(anim, { toValue: 0, duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });
  const translateX = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 20, 0] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.8, 0.4] });
  return (
    <Animated.View style={{ position: 'absolute', left: startX, top: startY, transform: [{ translateY }, { translateX }], opacity }}>
       <Svg width={size} height={size} viewBox="0 0 24 24">
         <Path d="M12 2C12 2 14 8 18 10C22 12 22 14 18 16C14 18 12 22 12 22C12 22 10 18 6 16C2 14 2 12 6 10C10 8 12 2 12 2Z" fill={color} opacity={0.6} />
       </Svg>
    </Animated.View>
  );
};

const BackgroundArt = ({ theme }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <FloatingParticle startX="10%" startY="80%" size={25} color={theme.primary} delay={500} duration={7000} />
      <FloatingParticle startX="85%" startY="15%" size={35} color={theme.success} delay={0} duration={8000} />
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad" cx="20%" cy="90%" rx="60%" ry="40%" fx="20%" fy="90%" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={theme.primary} stopOpacity="0.08" />
            <Stop offset="1" stopColor={theme.background[0]} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="20%" cy="90%" r="600" fill="url(#grad)" />
      </Svg>
    </View>
  );
};

import { FadeInView } from '@/components/FadeInView';

// --- Components ---
const SettingCard = ({ title, children, theme }) => (
  <View style={{
    backgroundColor: theme.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.l,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: theme.border,
  }}>
    <Text style={{
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: theme.textMuted,
      marginBottom: SPACING.m,
      textTransform: 'uppercase',
      letterSpacing: 1
    }}>
      {title}
    </Text>
    {children}
  </View>
);

const SettingRow = ({ label, subLabel, children, theme, isLast }) => (
  <View style={{ 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: SPACING.s,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: theme.border,
    marginBottom: isLast ? 0 : SPACING.s
  }}>
    <View style={{ flex: 1, paddingRight: SPACING.m }}>
      <Text style={{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: theme.text }}>{label}</Text>
      {subLabel && <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: theme.textSecondary, marginTop: 2 }}>{subLabel}</Text>}
    </View>
    {children}
  </View>
);

const CounterControl = ({ value, onIncrement, onDecrement, theme, suffix = '', step = 1 }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.s, backgroundColor: theme.background[0], padding: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: theme.border }}>
    <TouchableOpacity onPress={onDecrement} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surfaceHighlight, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="remove" size={18} color={theme.text} />
    </TouchableOpacity>
    <Text style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: theme.text, minWidth: 40, textAlign: 'center' }}>{value}{suffix}</Text>
    <TouchableOpacity onPress={onIncrement} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="add" size={18} color="#fff" />
    </TouchableOpacity>
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State
  const [checkinEnabled, setCheckinEnabled] = useState(true);
  const [checkinTime, setCheckinTime] = useState({ hour: 18, minute: 0 });
  
  const [motivationEnabled, setMotivationEnabled] = useState(true);
  const [motivationTime, setMotivationTime] = useState({ hour: 9, minute: 0 });

  const [notificationPermission, setNotificationPermission] = useState('undetermined');
  
  // Smoking Data
  const [cigarettesPerDay, setCigarettesPerDay] = useState(20);
  const [pricePerPack, setPricePerPack] = useState(7.00);
  const [cigarettesPerPack, setCigarettesPerPack] = useState(20);
  const [yearsSmoked, setYearsSmoked] = useState(0);
  
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // Theme
  const theme = useMemo(() => darkModeEnabled ? PALETTE.dark : PALETTE.light, [darkModeEnabled]);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await quitData.getSettings();
      if (settings) {
        setCigarettesPerDay(settings.cigarettesPerDay || 20);
        setPricePerPack(settings.pricePerPack || 7.00);
        setCigarettesPerPack(settings.cigarettesPerPack || 20);
        setYearsSmoked(settings.yearsSmoked || 0);
        setDarkModeEnabled(settings.darkModeEnabled !== false);
      }

      const permission = await notificationService.getPermissionStatus();
      setNotificationPermission(permission);
      
      const checkinSettings = await notificationService.getCheckinSettings();
      setCheckinEnabled(checkinSettings.enabled);
      setCheckinTime(checkinSettings.time || { hour: 18, minute: 0 });

      const motivationSettings = await notificationService.getMotivationSettings();
      setMotivationEnabled(motivationSettings.enabled);
      setMotivationTime(motivationSettings.time || { hour: 9, minute: 0 });

    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      const settings = {
        cigarettesPerDay,
        pricePerPack,
        cigarettesPerPack,
        yearsSmoked,
        motivationalQuotes: motivationEnabled,
        dailyNotification: checkinEnabled,
        darkModeEnabled, 
      };
      await quitData.setSettings(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [cigarettesPerDay, pricePerPack, cigarettesPerPack, yearsSmoked, motivationEnabled, checkinEnabled, darkModeEnabled]);

  const handleToggleCheckin = useCallback(async (value) => {
    if (value) {
      const success = await notificationService.requestPermission();
      if (success) {
        await notificationService.setCheckinEnabled(true);
        setCheckinEnabled(true);
      } else {
        Alert.alert('Berechtigung erforderlich', 'Bitte aktivieren Sie Benachrichtigungen in den iOS-Einstellungen.');
        setCheckinEnabled(false);
      }
    } else {
      await notificationService.setCheckinEnabled(false);
      setCheckinEnabled(false);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleToggleMotivation = useCallback(async (value) => {
    if (value) {
      const success = await notificationService.requestPermission();
      if (success) {
        await notificationService.setMotivationEnabled(true);
        setMotivationEnabled(true);
      } else {
        Alert.alert('Berechtigung erforderlich', 'Bitte aktivieren Sie Benachrichtigungen in den iOS-Einstellungen.');
        setMotivationEnabled(false);
      }
    } else {
      await notificationService.setMotivationEnabled(false);
      setMotivationEnabled(false);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleCheckinTimeChange = useCallback(async (hour, minute) => {
    await notificationService.setCheckinTime(hour, minute);
    setCheckinTime({ hour, minute });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleResetData = useCallback(() => {
    Alert.alert(
      'Daten zurücksetzen',
      'Möchten Sie wirklich alle Daten löschen? Dies kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'smoking_quit_checkins', 'smoking_quit_start_date', 'smoking_quit_reminders', 'smoking_quit_settings', 'smoking_quit_onboarding'
            ]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Alert.alert('Erfolgreich', 'Bitte starten Sie die App neu.');
          },
        },
      ]
    );
  }, []);

  useFocusEffect(useCallback(() => { loadSettings(); }, [loadSettings]));
  useEffect(() => { saveSettings(); }, [saveSettings]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.background[0] }} />;

  return (
    <FadeInView style={{ flex: 1, backgroundColor: theme.background[0] }}>
      <LinearGradient colors={theme.background} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <BackgroundArt theme={theme} />
      <StatusBar style={darkModeEnabled ? "light" : "dark"} />

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + 100, paddingHorizontal: SPACING.l }}>
        <View>
          
          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 28, color: theme.text, marginBottom: SPACING.xl }}>Einstellungen</Text>

          {/* Benachrichtigungen */}
          <SettingCard title="Benachrichtigungen" theme={theme}>
            {/* Check-in */}
            <SettingRow label="Täglicher Check-in" subLabel="Kurze Abfrage am Abend" theme={theme}>
               <Switch
                  value={checkinEnabled}
                  onValueChange={handleToggleCheckin}
                  trackColor={{ false: theme.surfaceHighlight, true: theme.primary }}
                  thumbColor={'#FFF'}
                  ios_backgroundColor={theme.surfaceHighlight}
                />
            </SettingRow>
            
            {checkinEnabled && (
               <View style={{ marginTop: SPACING.xs, marginBottom: SPACING.l, alignItems: 'center' }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.m }}>
                    <CounterControl 
                      value={checkinTime.hour.toString().padStart(2, '0')} 
                      theme={theme}
                      onDecrement={() => handleCheckinTimeChange(checkinTime.hour - 1 < 0 ? 23 : checkinTime.hour - 1, checkinTime.minute)}
                      onIncrement={() => handleCheckinTimeChange(checkinTime.hour + 1 > 23 ? 0 : checkinTime.hour + 1, checkinTime.minute)}
                    />
                    <Text style={{ color: theme.textMuted, fontSize: 20 }}>:</Text>
                    <CounterControl 
                      value={checkinTime.minute.toString().padStart(2, '0')} 
                      theme={theme}
                      onDecrement={() => handleCheckinTimeChange(checkinTime.hour, checkinTime.minute - 15 < 0 ? 45 : checkinTime.minute - 15)}
                      onIncrement={() => handleCheckinTimeChange(checkinTime.hour, checkinTime.minute + 15 > 45 ? 0 : checkinTime.minute + 15)}
                    />
                 </View>
               </View>
            )}

            {/* Motivation */}
            <SettingRow label="Tägliche Motivation" subLabel="2x täglich zu zufälligen Zeiten" theme={theme} isLast>
               <Switch
                  value={motivationEnabled}
                  onValueChange={handleToggleMotivation}
                  trackColor={{ false: theme.surfaceHighlight, true: theme.success }} // Grün für Motivation
                  thumbColor={'#FFF'}
                  ios_backgroundColor={theme.surfaceHighlight}
                />
            </SettingRow>
          </SettingCard>

          {/* Profil */}
          <SettingCard title="Rauchverhalten" theme={theme}>

            <SettingRow label="Zigaretten pro Tag" subLabel="Durchschnitt" theme={theme}>
               <CounterControl 
                 value={cigarettesPerDay} 
                 theme={theme}
                 onDecrement={() => { setCigarettesPerDay(Math.max(1, cigarettesPerDay - 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                 onIncrement={() => { setCigarettesPerDay(Math.min(100, cigarettesPerDay + 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
               />
            </SettingRow>
            
            <SettingRow label="Preis pro Schachtel" subLabel="In Euro" theme={theme}>
               <CounterControl 
                 value={pricePerPack.toFixed(2)} 
                 suffix="€"
                 theme={theme}
                 onDecrement={() => { setPricePerPack(Math.max(1, pricePerPack - 0.50)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                 onIncrement={() => { setPricePerPack(Math.min(50, pricePerPack + 0.50)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
               />
            </SettingRow>

            <SettingRow label="Stück pro Schachtel" subLabel="Zigaretten" theme={theme} isLast>
               <CounterControl 
                 value={cigarettesPerPack} 
                 theme={theme}
                 onDecrement={() => { setCigarettesPerPack(Math.max(10, cigarettesPerPack - 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                 onIncrement={() => { setCigarettesPerPack(Math.min(50, cigarettesPerPack + 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
               />
            </SettingRow>
          </SettingCard>

          {/* Abo & Käufe */}
          <SettingCard title="Abo & Käufe" theme={theme}>
            <TouchableOpacity
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const success = await purchaseService.restorePurchases();
                if (success) {
                  Alert.alert("Erfolg", "Deine Einkäufe wurden wiederhergestellt!");
                } else {
                  Alert.alert("Info", "Keine aktiven Abonnements gefunden.");
                }
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: SPACING.s,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
                marginBottom: SPACING.s
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                <Ionicons name="refresh" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: theme.text }}>Einkäufe wiederherstellen</Text>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: theme.textSecondary }}>Nach Neuinstallation oder Gerätewechsel</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL('https://apps.apple.com/account/subscriptions');
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: SPACING.s
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                <Ionicons name="card" size={18} color={theme.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: theme.text }}>Abo verwalten</Text>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: theme.textSecondary }}>Kündigung, Zahlungsmethode ändern</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </SettingCard>

          {/* Danger Zone */}
          <View style={{ marginTop: SPACING.l }}>
            <TouchableOpacity
              onPress={handleResetData}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: RADIUS.m,
                padding: SPACING.m,
                borderWidth: 1,
                borderColor: theme.error,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: SPACING.s
              }}
            >
              <Ionicons name="trash-outline" size={20} color={theme.error} />
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: theme.error, fontSize: 14 }}>
                Alle Daten löschen
              </Text>
            </TouchableOpacity>
            <Text style={{ textAlign: 'center', marginTop: SPACING.m, color: theme.textMuted, fontSize: 10, fontFamily: 'Inter_400Regular' }}>
              Version 1.0.0 • Made with Vitality
            </Text>
          </View>

        </View>
      </ScrollView>
    </FadeInView>
  );
}