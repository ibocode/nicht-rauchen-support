import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  Dimensions,
  StyleSheet,
  Platform,
  Easing
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
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
import { useFocusEffect } from '@react-navigation/native';
import { quitData } from '@/utils/quitData';
import { notificationService } from '@/utils/notifications';
import { shouldShowAppReview } from '@/utils/storeReview';
import { AppReviewModal } from '@/components/AppReviewModal';
import { PALETTE, SPACING, RADIUS } from '@/constants/theme';

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

// --- Artistic Elements ---

// Ein einzelnes schwebendes Teilchen (Blütenblatt / Partikel)
const FloatingParticle = ({ delay = 0, duration = 4000, size = 20, startX, startY, color }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: duration,
          easing: Easing.inOut(Easing.sin), // Organische Bewegung
          useNativeDriver: true,
          delay: delay,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40] // Schwebt nach oben
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 20, 0] // Schwingt seitlich
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.8, 0.4] // Pulsierende Transparenz
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        transform: [{ translateY }, { translateX }],
        opacity
      }}
    >
      {/* Abstraktes Blütenblatt / Organische Form */}
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M12 2C12 2 14 8 18 10C22 12 22 14 18 16C14 18 12 22 12 22C12 22 10 18 6 16C2 14 2 12 6 10C10 8 12 2 12 2Z"
          fill={color}
          opacity={0.6}
        />
      </Svg>
    </Animated.View>
  );
};

const BackgroundArt = ({ theme, intensity }) => {
  // Erzeugt eine lebendige, aber ruhige Atmosphäre
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Wir platzieren zufällige Partikel im Hintergrund */}
      <FloatingParticle startX="10%" startY="20%" size={30} color={theme.primary} delay={0} duration={6000} />
      <FloatingParticle startX="80%" startY="15%" size={24} color={theme.success} delay={1000} duration={7000} />
      <FloatingParticle startX="30%" startY="40%" size={15} color={theme.primary} delay={2500} duration={5500} />
      <FloatingParticle startX="70%" startY="60%" size={35} color={theme.success} delay={500} duration={8000} />
      <FloatingParticle startX="15%" startY="75%" size={20} color={theme.primary} delay={3000} duration={6500} />
      <FloatingParticle startX="85%" startY="85%" size={25} color={theme.money} delay={1500} duration={7500} />

      {/* Großer, weicher Gradient Spot oben rechts für Lichtstimmung */}
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad" cx="80%" cy="10%" rx="60%" ry="40%" fx="80%" fy="10%" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={theme.primary} stopOpacity="0.15" />
            <Stop offset="1" stopColor={theme.background[0]} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="80%" cy="10%" r="600" fill="url(#grad)" />
      </Svg>
    </View>
  );
};


// Helper Component für Glass Cards
const GlassCard = ({ children, style, intensity = 20, colors, onPress }) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      style={[{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: RADIUS.m,
        padding: SPACING.m
      }, style]}
    >
      {children}
    </Container>
  );
};

import { FadeInView } from '@/components/FadeInView';
import { GoldenWeekCard } from '@/components/GoldenWeekCard';
import { GoldenWeekIntroModal } from '@/components/GoldenWeekIntroModal';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // ... rest of imports/state ...

  const [todayStatus, setTodayStatus] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');
  const [showQuotes, setShowQuotes] = useState(true);
  const [todayDate, setTodayDate] = useState('');
  const [smokingPreferences, setSmokingPreferences] = useState({
    cigarettesPerDay: 20,
    pricePerPack: 6.50,
    cigarettesPerPack: 20, // Default auf 20
  });
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false); // Neu für Korrektur
  const [showGoldenWeekIntro, setShowGoldenWeekIntro] = useState(false); // NEW

  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const breathingAnim = useRef(new Animated.Value(0)).current; // 0 to 1
  const [breathingState, setBreathingState] = useState('Bereit?'); // Text status
  const [cycleCount, setCycleCount] = useState(0);
  const TOTAL_CYCLES = 8;
  const [isFinished, setIsFinished] = useState(false);

  // Restoration of accidentally deleted refs:
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const congratulationsScale = useRef(new Animated.Value(0)).current;
  const congratulationsOpacity = useRef(new Animated.Value(0)).current;

  const startBreathing = useCallback(() => {
    setCycleCount(1);
    setIsFinished(false);
    setBreathingState('Einatmen');
    breathingAnim.setValue(0);
    runBreathingCycle();
  }, []);

  const runBreathingCycle = () => {
    Animated.sequence([
      Animated.timing(breathingAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }), // Ein
      Animated.timing(breathingAnim, { toValue: 1, duration: 4000, useNativeDriver: true }), // Halten
      Animated.timing(breathingAnim, { toValue: 0, duration: 4000, easing: Easing.linear, useNativeDriver: true }), // Aus
    ]).start(({ finished }) => {
      if (finished) {
        setCycleCount(prev => {
          const next = prev + 1;
          if (next > TOTAL_CYCLES) {
            setIsFinished(true);
            return prev;
          }
          // Restart Loop
          runBreathingCycle();
          return next;
        });
      }
    });
  };

  // Text Sync Effect - Reacts to Cycle Change to restart text timer
  useEffect(() => {
    if (showSOSModal && !isFinished && cycleCount > 0) {
      setBreathingState('Einatmen (4s)');

      const t1 = setTimeout(() => setBreathingState('Halten (4s)'), 4000);
      const t2 = setTimeout(() => setBreathingState('Ausatmen (4s)'), 8000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [cycleCount, showSOSModal, isFinished]);

  // Init/Reset when Modal opens
  useEffect(() => {
    if (showSOSModal) {
      startBreathing();
    } else {
      breathingAnim.stopAnimation();
      breathingAnim.setValue(0);
      setIsFinished(false);
      setCycleCount(0);
    }
  }, [showSOSModal]);


  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Theme Selection
  const theme = useMemo(() => darkModeEnabled ? PALETTE.dark : PALETTE.light, [darkModeEnabled]);

  useEffect(() => {
    quitData.init().catch(err => console.error('Failed to init quitData:', err));
  }, []);

  // Logic: Berechnungen & Data Loading
  const calculateCigarettesNotSmoked = useCallback(() => {
    return currentStreak * smokingPreferences.cigarettesPerDay;
  }, [currentStreak, smokingPreferences.cigarettesPerDay]);

  // NEU: Berechne Lebenszeit (in Stunden)
  const calculateLifeRegained = useCallback(() => {
    const cigs = calculateCigarettesNotSmoked();
    const minutesSaved = cigs * 11; // 11 Minuten pro Zigarette
    return Math.floor(minutesSaved / 60); // In Stunden
  }, [calculateCigarettesNotSmoked]);

  const calculateMoneySaved = useCallback(() => {
    const cigarettesPerPack = smokingPreferences.cigarettesPerPack || 20; // Fallback
    const pricePerPack = smokingPreferences.pricePerPack;
    const cigarettesPerDay = smokingPreferences.cigarettesPerDay;
    const totalCigarettes = currentStreak * cigarettesPerDay;
    const packsNotSmoked = totalCigarettes / cigarettesPerPack;
    const moneySaved = packsNotSmoked * pricePerPack;
    return Math.floor(moneySaved); // Floor for clean UI
  }, [currentStreak, smokingPreferences]);

  const loadWeekData = useCallback(async () => {
    try {
      const today = new Date();
      const currentDayOfWeek = (today.getDay() + 6) % 7;
      const mondayDate = new Date(today);
      mondayDate.setDate(today.getDate() - currentDayOfWeek);
      const weekDays = [];

      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(mondayDate);
        targetDate.setDate(mondayDate.getDate() + i);
        // Use local date instead of UTC
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

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
      setIsLoading(true);
      const [status, streak, settings] = await Promise.all([
        quitData.getDayStatus(),
        quitData.getCurrentStreak(),
        quitData.getSettings(),
      ]);

      setTodayStatus(status);
      setCurrentStreak(streak);
      setSmokingPreferences({
        cigarettesPerDay: settings.cigarettesPerDay || 20,
        pricePerPack: settings.pricePerPack || 6.50,
        cigarettesPerPack: settings.cigarettesPerPack || 20, // Lade Packungsgröße
      });
      setDarkModeEnabled(settings.darkModeEnabled !== false);

      // Check Golden Week Intro
      const goldenWeek = await quitData.getGoldenWeek();
      if (!goldenWeek.introSeen && goldenWeek.status !== 'failed') {
        // Add small delay for better UX
        setTimeout(() => setShowGoldenWeekIntro(true), 1000);
      }

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
      await loadWeekData();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadWeekData]);

  // Loads data on every focus (tab switch, back navigation).
  // useFocusEffect alone is sufficient — it also fires on initial mount.
  // Do NOT add a separate useEffect here as that would cause a double-load on first render.
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleCheckInPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowQuestionModal(true);
  }, []);

  const handleStatusCorrection = useCallback(() => {
    if (todayStatus !== null) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowCorrectionModal(true);
    }
  }, [todayStatus]);

  const handleCorrectionConfirm = useCallback(async (newStatus) => {
    setShowCorrectionModal(false);

    // Notification Logic
    await notificationService.resolveLateReminder();

    if (newStatus === 'smoked') {
      await quitData.markDayAsSmoked();
    } else {
      await quitData.setDayStatus(new Date(), 'success');

      // Golden Week: Auto-complete if active and user is smoke-free
      // completeGoldenDay is idempotent - safe to call multiple times
      await quitData.completeGoldenDay();

      // Milestone Check: getCurrentStreak() already reflects the new streak
      // after setDayStatus('success') was called. Check the current value directly.
      const updatedStreak = await quitData.getCurrentStreak();
      const milestones = [7, 14, 30, 60, 90, 180, 365];
      if (milestones.includes(updatedStreak)) {
        await notificationService.scheduleMilestoneReminder(updatedStreak);
      }

      // App Store Bewertung nach erstem Check-in (mit Verzögerung)
      setTimeout(async () => {
        const shouldShow = await shouldShowAppReview();
        if (shouldShow) {
          setShowReviewModal(true);
        }
      }, 3000);
    }
    await loadData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [loadData]);


  const handleQuestionAnswer = useCallback(async (answer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowQuestionModal(false);

    // Notification Logic
    await notificationService.resolveLateReminder();

    if (answer === 'success') {
      setShowCongratulations(true);
      Animated.parallel([
        Animated.spring(congratulationsScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
        Animated.timing(congratulationsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(congratulationsScale, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(congratulationsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          setShowCongratulations(false);
          congratulationsScale.setValue(0);
          congratulationsOpacity.setValue(0);
        });
      }, 3000);

      await quitData.setDayStatus(new Date(), 'success');

      // Golden Week: Auto-complete if active and user is smoke-free
      // completeGoldenDay is idempotent - safe to call multiple times
      await quitData.completeGoldenDay();

      // Milestone Check: getCurrentStreak() already reflects the new streak
      // after setDayStatus('success') was called. Check the current value directly.
      const updatedStreak = await quitData.getCurrentStreak();
      const milestones = [7, 14, 30, 60, 90, 180, 365];
      if (milestones.includes(updatedStreak)) {
        await notificationService.scheduleMilestoneReminder(updatedStreak);
      }

      await loadData();

      // App Store Bewertung nach erstem Check-in (mit Verzögerung)
      // Warte 3 Sekunden nach dem Check-in, damit der Nutzer die Gratulation sieht
      setTimeout(async () => {
        const shouldShow = await shouldShowAppReview();
        if (shouldShow) {
          setShowReviewModal(true);
        }
      }, 3000);
    } else {
      await quitData.markDayAsSmoked();
      await loadData();
    }
  }, [congratulationsScale, congratulationsOpacity, loadData]);

  // Derived State
  const hasCheckedInToday = todayStatus !== null;
  const isSmokedToday = todayStatus === 'smoked';

  if (!fontsLoaded || isLoading) {
    return <View style={{ flex: 1, backgroundColor: theme.background[0] }} />;
  }

  return (
    // WICHTIG: FadeInView wrapped den gesamten Screen-Inhalt für stabile Animation
    <FadeInView style={{ flex: 1, backgroundColor: theme.background[0] }}>
      {/* Statischer Hintergrund Gradient */}
      <LinearGradient
        colors={theme.background}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Künstlerische Elemente im Hintergrund */}
      <BackgroundArt theme={theme} />

      <StatusBar style={darkModeEnabled ? "light" : "dark"} />

      {/* SOS BUTTON */}
      <TouchableOpacity
        onPress={() => setShowSOSModal(true)}
        style={{
          position: 'absolute',
          top: insets.top + 10, // Safe Area respected
          right: 20,
          backgroundColor: '#ef4444', // Signal Red
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          zIndex: 999, // Always on top
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          shadowColor: '#ef4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5
        }}
      >
        <Ionicons name="medical" size={16} color="#fff" />
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>SOS</Text>
      </TouchableOpacity>

      <View
        style={{
          flex: 1,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + SPACING.l,
            paddingBottom: insets.bottom + 100,
            paddingHorizontal: SPACING.l,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* GOLDEN WEEK CHALLENGE (Top Priority) */}
          <GoldenWeekCard />

          {/* HEADER SECTION */}
          <View style={{ alignItems: 'center', marginBottom: SPACING.xxl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.s }}>
              <Ionicons name="leaf-outline" size={14} color={theme.primary} />
              <Text style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 12,
                color: theme.primary,
                letterSpacing: 1.5,
                textTransform: 'uppercase'
              }}>
                Aktuelle Serie
              </Text>
            </View>

            {/* MAIN STREAK INDICATOR */}
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: SPACING.m, overflow: 'visible' }}>
              <Text style={{
                fontSize: 100,
                fontFamily: 'Inter_700Bold',
                color: isSmokedToday ? theme.error : theme.text,
                includeFontPadding: false,
                lineHeight: 110,
                textShadowColor: isSmokedToday ? theme.errorGlow : theme.primaryGlow,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 25,
                padding: 30, // WICHTIG: Gibt dem Schatten Platz innerhalb des Text-Elements
              }}>
                {currentStreak}
              </Text>

              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
                color: theme.textSecondary,
                marginTop: -SPACING.xs
              }}>
                {currentStreak === 1 ? 'Tag Rauchfrei' : 'Tage Rauchfrei'}
              </Text>
            </View>
          </View>

          {/* ACTIONS */}
          <View style={{ marginBottom: SPACING.xxl }}>
            {!hasCheckedInToday ? (
              <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleCheckInPress}
                >
                  <LinearGradient
                    colors={[theme.primary, '#22c55e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: RADIUS.l,
                      paddingVertical: SPACING.l,
                      alignItems: 'center',
                      shadowColor: theme.primary,
                      shadowOpacity: 0.3,
                      shadowRadius: 20,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 8,
                    }}
                  >
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#FFFFFF' }}>
                      Heute abhaken
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <TouchableOpacity
                onPress={handleStatusCorrection}
                activeOpacity={0.7}
                style={{
                  backgroundColor: todayStatus === 'success' ? theme.successGlow : 'rgba(239, 68, 68, 0.1)',
                  borderColor: todayStatus === 'success' ? theme.success : theme.error,
                  borderWidth: 1,
                  borderRadius: RADIUS.l,
                  padding: SPACING.m,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8
                }}>
                <Ionicons
                  name={todayStatus === 'success' ? "checkmark-circle" : "alert-circle"}
                  size={20}
                  color={todayStatus === 'success' ? theme.success : theme.error}
                />
                <Text style={{
                  fontFamily: 'Poppins_600SemiBold',
                  fontSize: 16,
                  color: todayStatus === 'success' ? theme.success : theme.error
                }}>
                  {todayStatus === 'success' ? 'Heute rauchfrei' : 'Heute geraucht'}
                </Text>
                <Ionicons name="pencil" size={14} color={theme.textMuted} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </TouchableOpacity>
            )}
          </View>

          {/* WEEKLY OVERVIEW */}
          <View style={{ marginBottom: SPACING.xl }}>
            <Text style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 14,
              color: theme.textMuted,
              marginBottom: SPACING.m,
              marginLeft: SPACING.xs
            }}>
              DIESE WOCHE
            </Text>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: theme.surface,
              borderRadius: RADIUS.m,
              padding: SPACING.l,
              borderWidth: 1,
              borderColor: theme.border
            }}>
              {weekData.map((day, index) => {
                const isSuccess = day.status === 'success';
                const isSmoked = day.status === 'smoked';

                return (
                  <View key={index} style={{ alignItems: 'center', gap: 8 }}>
                    <Text style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 11,
                      color: day.isToday ? theme.text : theme.textMuted
                    }}>
                      {day.dayName}
                    </Text>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: isSuccess ? theme.success : isSmoked ? theme.error : 'transparent',
                      borderWidth: isSuccess || isSmoked ? 0 : 1,
                      borderColor: day.isToday ? theme.text : theme.border,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isSuccess && <Ionicons name="checkmark" size={18} color="#fff" />}
                      {isSmoked && <Ionicons name="close" size={18} color="#fff" />}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* STATS GRID */}
          {/* 2-Spalten Layout für die Stats */}
          <View style={{ flexDirection: 'row', gap: SPACING.m, marginBottom: SPACING.xl }}>
            {/* 1. Karte: Lebenszeit */}
            <GlassCard style={{ flex: 1 }} colors={theme}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <View style={{ padding: 6, backgroundColor: theme.successGlow, borderRadius: 8 }}>
                  <Ionicons name="hourglass-outline" size={18} color={theme.success} />
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: theme.textMuted }}>Leben</Text>
              </View>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 22, color: theme.text }}>
                +{calculateLifeRegained()}
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: theme.textSecondary }}>
                Stunden gewonnen
              </Text>
            </GlassCard>

            {/* 2. Karte: Geld (Präzise) */}
            <GlassCard style={{ flex: 1 }} colors={theme}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <View style={{ padding: 6, backgroundColor: 'rgba(251, 191, 36, 0.15)', borderRadius: 8 }}>
                  <Ionicons name="wallet-outline" size={18} color={theme.moneyClassic} />
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: theme.textMuted }}>Geld</Text>
              </View>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 22, color: theme.text }}>
                {calculateMoneySaved()}€
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: theme.textSecondary }}>
                Gespart (präzise)
              </Text>
            </GlassCard>
          </View>

          {/* 3. Reihe: Zigaretten vermieden */}
          <GlassCard style={{ marginBottom: SPACING.xl }} colors={theme}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.m }}>
                <View style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
                  <Ionicons name="skull-outline" size={20} color={theme.textMuted} />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: theme.text }}>
                    {calculateCigarettesNotSmoked()} Zigaretten
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: theme.textSecondary }}>
                    Nicht geraucht
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>


          {/* NEXT MILESTONE */}
          <GlassCard colors={theme}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.s }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: theme.text }}>Nächster Meilenstein</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: theme.primary }}>
                {currentStreak < 7 ? '7 Tage' : currentStreak < 30 ? '30 Tage' : '100 Tage'}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={{
              height: 8,
              backgroundColor: theme.surfaceHighlight,
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: SPACING.s
            }}>
              <View style={{
                width: `${Math.min(100, (currentStreak / (currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : 100)) * 100)}%`,
                height: '100%',
                backgroundColor: theme.primary,
                borderRadius: 4
              }} />
            </View>

            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: theme.textMuted }}>
              Weiter so! Du bist auf dem besten Weg.
            </Text>
          </GlassCard>

        </ScrollView>
      </View>

      {/* MODALS */}

      {/* 1. Frage Modal (Check-In) */}
      <Modal
        visible={showQuestionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: theme.background[1],
            borderRadius: RADIUS.l,
            padding: SPACING.xl,
            width: '100%',
            maxWidth: 340,
            borderWidth: 1,
            borderColor: theme.border
          }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 24, color: theme.text, textAlign: 'center', marginBottom: SPACING.s }}>
              Ehrlichkeit zählt.
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: SPACING.xl }}>
              Hast du heute geraucht?
            </Text>

            <View style={{ gap: SPACING.m }}>
              <TouchableOpacity
                onPress={() => handleQuestionAnswer('success')}
                style={{ backgroundColor: theme.success, padding: SPACING.m, borderRadius: RADIUS.m, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>Nein, ich war stark</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuestionAnswer('smoked')}
                style={{ backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.error, padding: SPACING.m, borderRadius: RADIUS.m, alignItems: 'center' }}
              >
                <Text style={{ color: theme.error, fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>Ja, leider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Korrektur Modal */}
      <Modal
        visible={showCorrectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCorrectionModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowCorrectionModal(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        >
          <View style={{
            backgroundColor: theme.background[1],
            borderTopLeftRadius: RADIUS.l,
            borderTopRightRadius: RADIUS.l,
            padding: SPACING.xl,
            paddingBottom: insets.bottom + SPACING.l,
            borderWidth: 1,
            borderColor: theme.border
          }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: theme.text, marginBottom: SPACING.l, textAlign: 'center' }}>
              Eintrag korrigieren
            </Text>

            {todayStatus === 'success' ? (
              <TouchableOpacity
                onPress={() => handleCorrectionConfirm('smoked')}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: theme.error,
                  borderWidth: 1,
                  padding: SPACING.m,
                  borderRadius: RADIUS.m,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Ionicons name="alert-circle" size={20} color={theme.error} />
                <Text style={{ color: theme.error, fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>
                  Ich habe doch geraucht
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleCorrectionConfirm('success')}
                style={{
                  backgroundColor: theme.successGlow,
                  borderColor: theme.success,
                  borderWidth: 1,
                  padding: SPACING.m,
                  borderRadius: RADIUS.m,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={{ color: theme.success, fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>
                  Ich war doch rauchfrei
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setShowCorrectionModal(false)}
              style={{ marginTop: SPACING.m, padding: SPACING.s, alignItems: 'center' }}
            >
              <Text style={{ color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 3. Gratulations Overlay */}
      {showCongratulations && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 1000 // Ensure it's on top
        }}>
          <Animated.View style={{ transform: [{ scale: congratulationsScale }], opacity: congratulationsOpacity }}>
            <View style={{
              backgroundColor: theme.success,
              padding: SPACING.xxl,
              borderRadius: 40, // Stark abgerundet
              alignItems: 'center',
              shadowColor: theme.success,
              shadowOpacity: 0.6,
              shadowRadius: 50,
              elevation: 30,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)'
            }}>
              <Text style={{ fontSize: 60, marginBottom: SPACING.m }}>🎉</Text>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#fff' }}>Starke Leistung!</Text>
            </View>
          </Animated.View>
        </View>
      )}

      {/* App Review Modal */}
      <AppReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onReview={() => {
          // Optional: Analytics oder andere Aktionen nach Bewertung
        }}
      />

      {/* 4. SOS Breathing Modal */}
      <Modal
        visible={showSOSModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSOSModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#101512', justifyContent: 'center', alignItems: 'center' }}>
          <StatusBar style="light" />

          <TouchableOpacity
            onPress={() => setShowSOSModal(false)}
            style={{ position: 'absolute', top: 60, right: 30, padding: 10, zIndex: 10 }}
          >
            <Ionicons name="close" size={32} color="#fff" opacity={0.5} />
          </TouchableOpacity>

          {!isFinished ? (
            <>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 22, color: '#4ade80', marginBottom: 60, letterSpacing: 2 }}>
                NOTFALL HILFE
              </Text>

              {/* Breathing Circle */}
              <View style={{ height: 300, justifyContent: 'center', alignItems: 'center', marginBottom: 40 }}>
                {/* Outer Glow */}
                <Animated.View style={{
                  width: 250,
                  height: 250,
                  borderRadius: 125,
                  backgroundColor: '#4ade80',
                  opacity: 0.2,
                  transform: [{ scale: breathingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.4] }) }]
                }} />

                {/* Inner Circle */}
                <Animated.View style={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: '#22c55e',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: "#4ade80",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 30,
                  elevation: 20,
                  transform: [{ scale: breathingAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }]
                }}>
                  <Ionicons name="leaf" size={60} color="#fff" />
                </Animated.View>
              </View>

              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 32, color: '#fff', marginBottom: 10 }}>
                {breathingState}
              </Text>

              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#4ade80', marginBottom: 30 }}>
                Runde {Math.min(cycleCount, TOTAL_CYCLES)} von {TOTAL_CYCLES}
              </Text>

              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#ffffff80', textAlign: 'center', paddingHorizontal: 40 }}>
                Fokussiere dich nur auf deinen Atem. Das Verlangen geht vorbei.
              </Text>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingHorizontal: 30 }}>
              <View style={{
                width: 120, height: 120, borderRadius: 60,
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                justifyContent: 'center', alignItems: 'center', marginBottom: 30,
                borderWidth: 2, borderColor: '#4ade80'
              }}>
                <Ionicons name="checkmark" size={60} color="#4ade80" />
              </View>

              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 32, color: '#fff', marginBottom: 16, textAlign: 'center' }}>
                Welle überstanden.
              </Text>

              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#ffffff90', textAlign: 'center', marginBottom: 60, lineHeight: 24 }}>
                Du hast die Kontrolle behalten. Dein Körper dankt dir für diese Ruhepause.
              </Text>

              <TouchableOpacity
                onPress={() => setShowSOSModal(false)}
                style={{
                  backgroundColor: '#4ade80',
                  paddingHorizontal: 40,
                  paddingVertical: 16,
                  borderRadius: 30,
                  shadowColor: '#4ade80',
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 4 }
                }}
              >
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#064e3b' }}>
                  Zurück zur App
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* 5. Golden Week Intro Modal */}
      <GoldenWeekIntroModal
        visible={showGoldenWeekIntro}
        onClose={() => setShowGoldenWeekIntro(false)}
      />

    </FadeInView>
  );
}