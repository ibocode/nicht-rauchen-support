import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { quitData } from '@/utils/quitData';

const { width, height } = Dimensions.get('window');

const motivationalQuotes = [
  'Ein Tipp – ein Tag näher dran.',
  'Du schaffst das.',
  'Halte deine Serie – du kannst das.',
  'Jeder Tag zählt.',
  'Du bist stärker als du denkst.',
  'Kleine Schritte. Großer Erfolg.',
  'Bleib beim Ziel: rauchfrei werden.',
  'Dein Körper dankt dir.',
];

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [todayStatus, setTodayStatus] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');
  const [showQuotes, setShowQuotes] = useState(true);
  const [todayDate, setTodayDate] = useState('');
  const [smokingPreferences, setSmokingPreferences] = useState({
    cigarettesPerDay: 20,
    pricePerPack: 6.50,
    cigarettesPerPack: 20,
  });
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);

  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef(null);
  const flameGlowAnimation = useRef(new Animated.Value(0)).current;
  const congratulationsScale = useRef(new Animated.Value(0)).current;
  const congratulationsOpacity = useRef(new Animated.Value(0)).current;

  const numberScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    quitData.init();
    
    // Sanftere Flamme-Animation - langsamer und ruhiger
    const flameLoop = Animated.loop(
      Animated.sequence([
        // Sanftes Flackern
        Animated.timing(flameGlowAnimation, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(flameGlowAnimation, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(flameGlowAnimation, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(flameGlowAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        // Längere Pause
        Animated.timing(flameGlowAnimation, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(flameGlowAnimation, {
          toValue: 0.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(flameGlowAnimation, {
          toValue: 0.7,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(flameGlowAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();
    
    return () => {
      pulseLoopRef.current?.stop?.();
      flameLoop.stop();
    };
  }, [flameGlowAnimation]);

  // Farben im Onboarding-Stil
  const colors = useMemo(() => {
    if (darkModeEnabled) {
      return {
        background: ['#0A0F0A', '#0F1A0F', '#0A0F0A'],
        cardBackground: 'rgba(255, 255, 255, 0.05)',
        cardBorder: 'rgba(255, 255, 255, 0.1)',
        textPrimary: '#FFFFFF',
        textSecondary: '#A1A1AA',
        success: '#10B981',
        successBg: 'rgba(16, 185, 129, 0.1)',
        error: '#EF4444',
        errorBg: 'rgba(239, 68, 68, 0.1)',
        money: '#F59E0B',
        moneyBg: 'rgba(245, 158, 11, 0.1)',
        flame: isSmokedToday ? '#EF4444' : '#10B981',
        flameGlow: isSmokedToday ? '#EF4444' : '#10B981',
        streakNumber: '#10B981',
        streakText: '#A1A1AA',
        weekTitle: '#A1A1AA',
        weekDay: '#71717A',
        weekToday: '#10B981',
        weekSuccess: '#10B981',
        weekSmoked: '#EF4444',
        weekNeutral: 'rgba(255, 255, 255, 0.05)',
        weekBorder: 'rgba(255, 255, 255, 0.1)',
        primary: '#10B981',
        buttonBg: 'rgba(255, 255, 255, 0.1)',
        buttonBorder: 'rgba(255, 255, 255, 0.2)',
      };
    } else {
      return {
        background: ['#F8FAFC', '#F1F5F9', '#E2E8F0'],
        cardBackground: '#FFFFFF',
        cardBorder: '#E2E8F0',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        success: '#10B981',
        successBg: '#ECFDF5',
        error: '#EF4444',
        errorBg: '#FEF2F2',
        money: '#F59E0B',
        moneyBg: '#FFFBEB',
        flame: isSmokedToday ? '#EF4444' : '#10B981',
        flameGlow: isSmokedToday ? '#EF4444' : '#10B981',
        streakNumber: '#059669',
        streakText: '#6B7280',
        weekTitle: '#6B7280',
        weekDay: '#9CA3AF',
        weekToday: '#6B7280',
        weekSuccess: '#10B981',
        weekSmoked: '#EF4444',
        weekNeutral: '#F3F4F6',
        weekBorder: '#D1D5DB',
        primary: '#10B981',
        buttonBg: '#F3F4F6',
        buttonBorder: '#D1D5DB',
      };
    }
  }, [darkModeEnabled, isSmokedToday]);

  const calculateCigarettesNotSmoked = useCallback(() => {
    return currentStreak * smokingPreferences.cigarettesPerDay;
  }, [currentStreak, smokingPreferences.cigarettesPerDay]);

  const calculateMoneySaved = useCallback(() => {
    const cigarettesPerPack = smokingPreferences.cigarettesPerPack;
    const pricePerPack = smokingPreferences.pricePerPack;
    const cigarettesPerDay = smokingPreferences.cigarettesPerDay;
    
    const totalCigarettes = currentStreak * cigarettesPerDay;
    const packsNotSmoked = totalCigarettes / cigarettesPerPack;
    const moneySaved = packsNotSmoked * pricePerPack;
    
    return Math.floor(moneySaved);
  }, [currentStreak, smokingPreferences]);

  const calculateHealthImprovement = useCallback(() => {
    // Basierend auf medizinischen Studien:
    // Nach 24h: Herzfrequenz und Blutdruck normalisieren sich
    // Nach 1 Woche: Sauerstoffgehalt im Blut steigt
    // Nach 1 Monat: Lungenfunktion verbessert sich um 30%
    // Nach 3 Monaten: Kreislauf verbessert sich deutlich
    
    if (currentStreak < 1) return 0;
    if (currentStreak < 7) return Math.min(15, currentStreak * 2); // Bis 15% in der ersten Woche
    if (currentStreak < 30) return Math.min(30, 15 + (currentStreak - 7) * 0.7); // Bis 30% im ersten Monat
    return Math.min(50, 30 + (currentStreak - 30) * 0.3); // Bis 50% danach
  }, [currentStreak]);

  const loadWeekData = useCallback(async () => {
    try {
      const today = new Date();
      const currentDayOfWeek = (today.getDay() + 6) % 7; // Montag = 0
      
      // Berechne Montag der aktuellen Woche
      const mondayDate = new Date(today);
      mondayDate.setDate(today.getDate() - currentDayOfWeek);
      
      const weekDays = [];
      
      // Lade Daten für alle 7 Tage der Woche
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(mondayDate);
        targetDate.setDate(mondayDate.getDate() + i);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        try {
          const dayStatus = await quitData.getDayStatus(dateStr);
          weekDays.push({
            date: targetDate,
            dateStr: dateStr,
            status: dayStatus,
            isToday: i === currentDayOfWeek,
            dayName: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][i],
          });
        } catch (error) {
          // Wenn kein Status gefunden, setze auf null
          weekDays.push({
            date: targetDate,
            dateStr: dateStr,
            status: null,
            isToday: i === currentDayOfWeek,
            dayName: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][i],
          });
        }
      }
      
      setWeekData(weekDays);
    } catch (error) {
      console.error('Error loading week data:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [status, streak, settings] = await Promise.all([
        quitData.getDayStatus(),
        quitData.getCurrentStreak(),
        quitData.getSettings(),
      ]);

      setTodayStatus(status);
      setCurrentStreak(streak);
      
      // Lade Rauchgewohnheiten
      setSmokingPreferences({
        cigarettesPerDay: settings.cigarettesPerDay || 20,
        pricePerPack: settings.pricePerPack || 6.50,
        cigarettesPerPack: 20, // Feste Anzahl pro Schachtel
      });

      // Lade Dunklen Modus
      setDarkModeEnabled(settings.darkModeEnabled !== false);

      const today = new Date();
      const dateStr = today.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setTodayDate(dateStr);

      const allowQuotes = settings?.motivationalQuotes !== false;
      setShowQuotes(allowQuotes);

      if (allowQuotes) {
        const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        setCurrentQuote(quote);
      } else {
        setCurrentQuote('');
      }
      
      // Lade Wochen-Daten
      await loadWeekData();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [loadWeekData]);

  const fadeIn = useCallback(() => {
    fadeAnimation.setValue(0);
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [fadeAnimation]);

  useFocusEffect(
    useCallback(() => {
      fadeIn();
      loadData();
    }, [fadeIn, loadData]),
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const triggerPulse = useCallback(() => {
    pulseLoopRef.current?.stop?.();
    pulseAnimation.setValue(0);
    const pulseSequence = Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]);
    const loop = Animated.loop(pulseSequence, { iterations: 2 });
    pulseLoopRef.current = loop;
    loop.start(() => pulseAnimation.setValue(0));
  }, [pulseAnimation]);

  const handleCheckIn = useCallback(async () => {
    if (todayStatus === 'success') {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.92,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const success = await quitData.checkInToday();
    if (success) {
      await loadData();
      triggerPulse();
    }
  }, [loadData, scaleAnimation, todayStatus, triggerPulse]);

  const handleMarkSmoked = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    const success = await quitData.markDayAsSmoked();
    if (success) {
      await loadData();
    }
  }, [loadData]);

  const handleMarkSuccess = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const success = await quitData.setDayStatus(new Date(), 'success');
    if (success) {
      await loadData();
    }
  }, [loadData]);

  const handleAbhakPress = useCallback(() => {
    if (todayStatus === null) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowQuestionModal(true);
    }
  }, [todayStatus]);

  // Prüfe ob heute bereits ein Status gesetzt wurde
  const hasCheckedInToday = todayStatus !== null;

  const handleQuestionAnswer = useCallback(async (answer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowQuestionModal(false);
    
    if (answer === 'success') {
      // Zeige Congratulations-Animation
      setShowCongratulations(true);
      
      // Starte Animation
      Animated.parallel([
        Animated.spring(congratulationsScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(congratulationsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Nach 3 Sekunden Animation beenden
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(congratulationsScale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(congratulationsOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowCongratulations(false);
          congratulationsScale.setValue(0);
          congratulationsOpacity.setValue(0);
        });
      }, 3000);

      // Status setzen
      await quitData.setDayStatus(new Date(), 'success');
      await loadData();
    } else {
      // Geraucht markieren
      await quitData.markDayAsSmoked();
      await loadData();
    }
  }, [congratulationsScale, congratulationsOpacity, loadData]);

  const quickActions = useMemo(
    () => [
      {
        key: 'calendar',
        icon: 'calendar-outline',
        title: 'Kalender ansehen',
        subtitle: 'Verlauf checken und motiviert bleiben.',
        target: '/(tabs)/calendar',
      },
      {
        key: 'streak',
        icon: 'flame-outline',
        title: 'Serien & Ziele',
        subtitle: 'Meilensteine und Fortschritt ansehen.',
        target: '/(tabs)/streak',
      },
      {
        key: 'settings',
        icon: 'settings-outline',
        title: 'Einstellungen',
        subtitle: 'Benachrichtigungen und Premium.',
        target: '/(tabs)/settings',
      },
    ],
    [],
  );

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0F0A' }}>
        <LinearGradient
          colors={['#0A0F0A', '#0F1A0F', '#0A0F0A']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
    );
  }

  const isSmokedToday = todayStatus === 'smoked';
  const numberColor = isSmokedToday ? '#FF5F6F' : colors.streakNumber;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background[0] }}>
      <LinearGradient
        colors={colors.background}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
      <StatusBar style={darkModeEnabled ? "light" : "dark"} />

      <Animated.View style={{ flex: 1, opacity: fadeAnimation }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: 20,
            flexGrow: 1,
            justifyContent: 'space-between',
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', gap: 40, paddingTop: 60 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins_600SemiBold',
                color: '#8CA0C5',
              }}
            >
              Aktuelle Serie
            </Text>

            <View style={{ alignItems: 'center', gap: 16 }}>
              {/* Moderne animierte Flamme */}
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {/* Äußerer Glow-Ring - kleiner */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: isSmokedToday ? '#EF4444' : colors.flameGlow,
                    opacity: flameGlowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.1, 0.3],
                    }),
                    transform: [
                      {
                        scale: flameGlowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1.1],
                        }),
                      },
                    ],
                  }}
                />
                
                {/* Mittlerer Glow-Ring - kleiner */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: isSmokedToday ? '#EF4444' : colors.flameGlow,
                    opacity: flameGlowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 0.4],
                    }),
                    transform: [
                      {
                        scale: flameGlowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1.05],
                        }),
                      },
                    ],
                  }}
                />
                
                {/* Flamme Icon - kleiner */}
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: flameGlowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.98, 1.02],
                        }),
                      },
                      {
                        rotate: flameGlowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['-0.5deg', '0.5deg'],
                        }),
                      },
                    ],
                    shadowColor: isSmokedToday ? '#EF4444' : colors.flameGlow,
                    shadowOpacity: flameGlowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.6],
                    }),
                    shadowRadius: flameGlowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 15],
                    }),
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 10,
                  }}
                >
                  <Text style={{ fontSize: 36, color: isSmokedToday ? '#EF4444' : colors.flame }}>🔥</Text>
                </Animated.View>
              </View>

              {/* Animierte Zahl */}
              <Animated.Text
                style={{
                  fontSize: 120,
                  fontFamily: 'Inter_700Bold',
                  color: numberColor,
                  lineHeight: 140,
                  transform: [{ scale: numberScale }],
                  textAlign: 'center',
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                }}
              >
                {currentStreak}
              </Animated.Text>

              {/* Week Streak Text */}
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.streakText,
                  textAlign: 'center',
                }}
              >
                {currentStreak === 1 ? 'Tag' : 'Tage'} in Folge rauchfrei
              </Text>

              {/* Wochen-Fortschritt */}
              <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins_400Regular',
                    color: colors.weekTitle,
                    marginBottom: 16,
                  }}
                >
                  Diese Woche
                </Text>
                
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  width: '100%',
                  paddingHorizontal: 8,
                }}>
                  {weekData.map((day, index) => {
                    // Bestimme die Farbe basierend auf dem echten Status
                    let backgroundColor = colors.weekNeutral;
                    let borderColor = colors.weekBorder;
                    let textColor = colors.weekDay;
                    let shadowColor = 'transparent';
                    let elevation = 0;
                    
                    if (day.status === 'success') {
                      backgroundColor = colors.weekSuccess;
                      borderColor = colors.weekSuccess;
                      textColor = darkModeEnabled ? '#062015' : '#FFFFFF';
                      shadowColor = colors.weekSuccess;
                      elevation = 4;
                    } else if (day.status === 'smoked') {
                      backgroundColor = colors.weekSmoked;
                      borderColor = colors.weekSmoked;
                      textColor = darkModeEnabled ? '#2B1424' : '#FFFFFF';
                      shadowColor = colors.weekSmoked;
                      elevation = 4;
                    } else if (day.isToday) {
                      backgroundColor = colors.weekToday;
                      borderColor = colors.weekToday;
                      textColor = darkModeEnabled ? '#1A2332' : '#FFFFFF';
                      shadowColor = colors.weekToday;
                      elevation = 4;
                    }
                    
                    return (
                      <View key={index} style={{ alignItems: 'center', gap: 3 }}>
                        {/* Wochentag-Label */}
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: 'Poppins_600SemiBold',
                            color: day.isToday ? colors.weekToday : colors.weekDay,
                          }}
                        >
                          {day.dayName}
                        </Text>
                        
                        {/* Status-Kreis */}
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: backgroundColor,
                            borderWidth: 2,
                            borderColor: borderColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: shadowColor,
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: elevation,
                          }}
                        >
                          {day.status === 'success' && (
                            <Text style={{ color: textColor, fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                          )}
                          {day.status === 'smoked' && (
                            <Text style={{ color: textColor, fontSize: 12, fontWeight: 'bold' }}>✗</Text>
                          )}
                          {!day.status && day.isToday && (
                            <View
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#FFFFFF',
                              }}
                            />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

            </View>
          </View>

          <View style={{ gap: 32 }}>
            {/* Abhak-Knopf oder normale Buttons */}
            {!hasCheckedInToday ? (
              <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleAbhakPress}
                  style={{
                    borderRadius: 28,
                    paddingVertical: 24,
                    backgroundColor: colors.primary,
                    borderWidth: 2,
                    borderColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins_600SemiBold',
                      color: '#FFFFFF',
                      textAlign: 'center',
                    }}
                  >
                    ✓ Heute abhaken
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 16,
                }}
              >
                <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnimation }] }}>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleMarkSuccess}
                    disabled={todayStatus === 'success'}
                    style={{
                      borderRadius: 28,
                      paddingVertical: 20,
                      backgroundColor: todayStatus === 'success' ? colors.successBg : colors.buttonBg,
                      borderWidth: 2,
                      borderColor: todayStatus === 'success' ? colors.success : colors.buttonBorder,
                      opacity: 1,
                      shadowColor: todayStatus === 'success' ? colors.success : colors.buttonBorder,
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins_600SemiBold',
                        color: todayStatus === 'success' ? colors.success : colors.textPrimary,
                        textAlign: 'center',
                      }}
                    >
                      {todayStatus === 'success' ? '✓ Nicht geraucht' : 'Nicht geraucht'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleMarkSmoked}
                  style={{
                    flex: 1,
                    borderRadius: 28,
                    paddingVertical: 20,
                    backgroundColor: todayStatus === 'success' ? colors.errorBg : colors.buttonBg,
                    borderWidth: 2,
                    borderColor: todayStatus === 'success' ? colors.error : colors.buttonBorder,
                    opacity: todayStatus === 'success' ? 0.6 : 1,
                    shadowColor: todayStatus === 'success' ? colors.error : colors.buttonBorder,
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Poppins_600SemiBold',
                      color: todayStatus === 'success' ? colors.textSecondary : colors.error,
                      textAlign: 'center',
                    }}
                  >
                    Geraucht
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Professionelle Statistiken */}
            <View style={{ gap: 16 }}>
              <View
                style={{
                  backgroundColor: colors.cardBackground,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.cardBorder,
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.textPrimary,
                    marginBottom: 16,
                    textAlign: 'center',
                  }}
                >
                  Heutiger Fortschritt
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: colors.successBg,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontSize: 28, color: colors.success }}>🚭</Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.textSecondary,
                      }}
                    >
                      Nicht geraucht
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins_600SemiBold',
                        color: colors.textPrimary,
                      }}
                    >
                      {calculateCigarettesNotSmoked()}
                    </Text>
                  </View>
                  
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: colors.moneyBg,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontSize: 28, color: colors.money }}>💰</Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.textSecondary,
                      }}
                    >
                      Geld gespart
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins_600SemiBold',
                        color: colors.textPrimary,
                      }}
                    >
                      {calculateMoneySaved()}€
                    </Text>
                  </View>
                </View>
              </View>

              {/* Nächster Meilenstein */}
              <View
                style={{
                  backgroundColor: colors.cardBackground,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.cardBorder,
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.textPrimary,
                    marginBottom: 12,
                    textAlign: 'center',
                  }}
                >
                  Nächster Meilenstein
                </Text>
                
                {currentStreak < 7 ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.textSecondary,
                        marginBottom: 8,
                      }}
                    >
                      Erste Woche rauchfrei
                    </Text>
                    <View
                      style={{
                        width: '100%',
                        height: 12,
                        backgroundColor: colors.weekNeutral,
                        borderRadius: 6,
                        overflow: 'hidden',
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: `${(currentStreak / 7) * 100}%`,
                          backgroundColor: colors.success,
                          borderRadius: 6,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.textSecondary,
                      }}
                    >
                      {7 - currentStreak} Tage bis zur ersten Woche
                    </Text>
                  </View>
                ) : currentStreak < 30 ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.textSecondary,
                        marginBottom: 8,
                      }}
                    >
                      Erster Monat rauchfrei
                    </Text>
                    <View
                      style={{
                        width: '100%',
                        height: 12,
                        backgroundColor: colors.weekNeutral,
                        borderRadius: 6,
                        overflow: 'hidden',
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: `${(currentStreak / 30) * 100}%`,
                          backgroundColor: '#53FF94',
                          borderRadius: 6,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.textSecondary,
                      }}
                    >
                      {30 - currentStreak} Tage bis zum ersten Monat
                    </Text>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.success,
                        marginBottom: 8,
                      }}
                    >
                      🎉 Großartig! Du hast bereits einen Monat geschafft!
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.textSecondary,
                      }}
                    >
                      Weiter so! Dein nächster Meilenstein ist 100 Tage.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Frage-Modal */}
      <Modal
        visible={showQuestionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: '#000000',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
          <View style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 24,
            padding: 32,
            borderWidth: 2,
            borderColor: colors.cardBorder,
            width: '100%',
            maxWidth: 340,
            shadowColor: '#000',
            shadowOpacity: 0.8,
            shadowRadius: 25,
            shadowOffset: { width: 0, height: 15 },
            elevation: 25,
          }}>
            <Text style={{
              fontSize: 24,
              fontFamily: 'Poppins_700Bold',
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: 16,
            }}>
              Hast du heute geraucht?
            </Text>
            
            <Text style={{
              fontSize: 16,
              fontFamily: 'Poppins_400Regular',
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24,
            }}>
              Sei ehrlich mit dir selbst. Jeder Tag zählt!
            </Text>

            <View style={{ gap: 16 }}>
              <TouchableOpacity
                onPress={() => handleQuestionAnswer('success')}
                style={{
                  backgroundColor: colors.success,
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  shadowColor: colors.success,
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 8,
                }}
              >
                <Text style={{
                  fontSize: 18,
                  fontFamily: 'Poppins_600SemiBold',
                  color: '#FFFFFF',
                }}>
                  ✓ Nicht geraucht
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuestionAnswer('smoked')}
                style={{
                  backgroundColor: colors.error,
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  shadowColor: colors.error,
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 8,
                }}
              >
                <Text style={{
                  fontSize: 18,
                  fontFamily: 'Poppins_600SemiBold',
                  color: '#FFFFFF',
                }}>
                  ✗ Geraucht
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Congratulations-Animation */}
      {showCongratulations && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000000',
        }}>
          <Animated.View style={{
            transform: [{ scale: congratulationsScale }],
            opacity: congratulationsOpacity,
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: colors.success,
              borderRadius: 24,
              padding: 40,
              alignItems: 'center',
              shadowColor: colors.success,
              shadowOpacity: 1,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 20 },
              elevation: 30,
              borderWidth: 3,
              borderColor: '#FFFFFF',
            }}>
              <Text style={{
                fontSize: 80,
                marginBottom: 20,
              }}>
                🎉
              </Text>
              <Text style={{
                fontSize: 28,
                fontFamily: 'Poppins_700Bold',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 12,
              }}>
                Gratulation!
              </Text>
              <Text style={{
                fontSize: 18,
                fontFamily: 'Poppins_600SemiBold',
                color: '#FFFFFF',
                textAlign: 'center',
                opacity: 1,
              }}>
                Du hast heute nicht geraucht!
              </Text>
            </View>
          </Animated.View>
        </View>
      )}
      </LinearGradient>
    </View>
  );
}