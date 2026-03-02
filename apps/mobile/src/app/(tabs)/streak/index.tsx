import {
  View,
  Text,
  ScrollView,
  Animated,
  StyleSheet,
  Easing,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Inter_400Regular,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { quitData } from '@/utils/quitData';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, SPACING, RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

// Golden Week is special - it's a 7-day challenge, not a streak milestone
// But we show it as the top milestone in the timeline
const milestoneList = [
  { days: 7, label: '1 Woche rauchfrei' },
  { days: 14, label: '2 Wochen rauchfrei' },
  { days: 30, label: '1 Monat rauchfrei' },
  { days: 60, label: '2 Monate rauchfrei' },
  { days: 90, label: '3 Monate rauchfrei' },
  { days: 180, label: '6 Monate rauchfrei' },
  { days: 365, label: '1 Jahr rauchfrei' },
];

// --- Health Data ---
const healthMilestones = [
  { title: "Puls & Blutdruck", description: "Normalisiert sich auf Nichtraucher-Niveau.", daysRequired: 0.014 }, // ~20 min (displayed as done if > 0)
  { title: "Sauerstoffgehalt", description: "Kohlenmonoxid ist abgebaut, Sauerstoff normal.", daysRequired: 0.33 }, // 8h
  { title: "Geruch & Geschmack", description: "Nervenenden regenerieren sich, Sinne schärfen sich.", daysRequired: 2 },
  { title: "Energie-Level", description: "Atmung fällt leichter, körperliche Energie steigt.", daysRequired: 3 },
  { title: "Zahnfleisch & Durchblutung", description: "Bessere Durchblutung, gesünderes Zahnfleisch.", daysRequired: 10 },
  { title: "Lungenfunktion", description: "Lungenkapazität verbessert sich spürbar.", daysRequired: 14 }, // Starts improving sign.
  { title: "Husten & Atemwege", description: "Flimmerhärchen wachsen nach, Lunge reinigt sich.", daysRequired: 30 },
  { title: "Herz-Kreislauf", description: "Risiko für Herz-Erkrankungen halbiert sich.", daysRequired: 365 },
];

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
      <FloatingParticle startX="20%" startY="15%" size={30} color={theme.primary} delay={0} duration={8000} />
      <FloatingParticle startX="70%" startY="30%" size={20} color={theme.success} delay={2000} duration={9000} />
      <FloatingParticle startX="50%" startY="80%" size={35} color={theme.money} delay={1500} duration={7000} />
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="50%" rx="60%" ry="50%" fx="50%" fy="50%" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={theme.primary} stopOpacity="0.08" />
            <Stop offset="1" stopColor={theme.background[0]} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="50%" r="600" fill="url(#grad)" />
      </Svg>
    </View>
  );
};

import { FadeInView } from '@/components/FadeInView';

// Helper Component für Glass Cards
const GlassCard = ({ children, style, theme }) => (
  <View style={[{
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: RADIUS.m,
    padding: SPACING.m
  }, style]}>
    {children}
  </View>
);

export default function StreakScreen() {
  const insets = useSafeAreaInsets();

  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [smokingPreferences, setSmokingPreferences] = useState({
    cigarettesPerDay: 20,
    pricePerPack: 6.50,
    cigarettesPerPack: 20,
    yearsSmoked: 0,
    monthsSmoked: 0
  });

  const [lifetimeStats, setLifetimeStats] = useState({
    totalDays: 0,
    totalCigarettes: 0,
    totalPacks: 0,
    totalMoney: 0,
    lifeRegainedHours: 0,
  });

  const [goldenWeek, setGoldenWeek] = useState(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_700Bold,
  });

  const theme = useMemo(() => darkModeEnabled ? PALETTE.dark : PALETTE.light, [darkModeEnabled]);

  const loadData = useCallback(async () => {
    try {
      const [streak, longest, total, settings, lifetime, gw] = await Promise.all([
        quitData.getCurrentStreak(),
        quitData.getLongestStreak(),
        quitData.getTotalDaysSinceStart(),
        quitData.getSettings(),
        quitData.getLifetimeStats(),
        quitData.getGoldenWeek(),
      ]);

      setCurrentStreak(streak);
      setLongestStreak(longest);
      setTotalDays(total);
      setLifetimeStats(lifetime);
      setGoldenWeek(gw);

      if (settings) {
        setSmokingPreferences({
          cigarettesPerDay: settings.cigarettesPerDay || 20,
          pricePerPack: settings.pricePerPack || 6.50,
          cigarettesPerPack: settings.cigarettesPerPack || 20,
          yearsSmoked: settings.yearsSmoked || 0,
          monthsSmoked: settings.monthsSmoked || 0,
        });
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  }, []);

  const calculateCigarettesNotSmoked = useCallback(() => {
    return currentStreak * smokingPreferences.cigarettesPerDay;
  }, [currentStreak, smokingPreferences.cigarettesPerDay]);

  const calculateMoneySaved = useCallback(() => {
    const cigarettesPerPack = smokingPreferences.cigarettesPerPack || 20;
    const pricePerPack = smokingPreferences.pricePerPack;
    const cigarettesPerDay = smokingPreferences.cigarettesPerDay;
    const totalCigarettes = currentStreak * cigarettesPerDay;
    const packsNotSmoked = totalCigarettes / cigarettesPerPack;
    const moneySaved = packsNotSmoked * pricePerPack;
    return moneySaved.toFixed(2);
  }, [currentStreak, smokingPreferences]);

  // NEU: Motivations-Text basierend auf Streak
  const getMotivationText = useCallback(() => {
    const days = currentStreak;

    if (days === 0) return "Der beste Zeitpunkt zu starten ist jetzt.";
    if (days <= 2) return "Der schwerste Schritt ist getan. Bleib stark!";
    if (days <= 5) return "Dein Körper entgiftet sich bereits spürbar.";
    if (days <= 10) return "Die erste Woche ist fast geschafft. Weiter so!";
    if (days <= 20) return "Du baust eine neue, gesunde Identität auf.";
    if (days <= 30) return "Fast ein Monat! Deine Lunge dankt dir.";
    if (days <= 60) return "Du hast die Kontrolle zurückgewonnen.";
    if (days <= 90) return "Ein Quartal Freiheit. Unglaubliche Leistung!";
    if (days <= 180) return "Ein halbes Jahr! Du bist eine Inspiration.";
    if (days <= 365) return "Fast ein Jahr. Du bist nicht mehr aufzuhalten.";

    return "Ein freies Leben. Du bist eine Legende.";
  }, [currentStreak]);

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

  // useFocusEffect alone is sufficient — it fires on initial mount AND on tab focus.
  // Removing the duplicate useEffect to prevent double-load and potential race conditions.
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.background[0] }} />;

  return (
    <FadeInView style={{ flex: 1, backgroundColor: theme.background[0] }}>
      <LinearGradient colors={theme.background} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <BackgroundArt theme={theme} />
      <StatusBar style={darkModeEnabled ? "light" : "dark"} />

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + 100, paddingHorizontal: SPACING.l }}>
        <View>

          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 28, color: theme.text, marginBottom: SPACING.xl }}>Deine Reise</Text>

          {/* Haupt-Serie Karte */}
          <View style={{ alignItems: 'center', marginBottom: SPACING.xxl, overflow: 'visible' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: SPACING.s }}>
              AKTUELL
            </Text>

            <Text style={{
              fontSize: 80,
              fontFamily: 'Inter_700Bold',
              color: theme.text,
              textShadowColor: theme.primaryGlow,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 25,
              padding: 30, // WICHTIG: Gibt dem Schatten Platz
            }}>
              {currentStreak}
            </Text>
            <Text style={{ fontSize: 16, fontFamily: 'Poppins_400Regular', color: theme.textSecondary }}>
              Tage Rauchfrei
            </Text>

            {/* NEU: Kontext-Anzeige basierend auf Onboarding-Daten */}
            <View style={{
              marginTop: SPACING.m,
              backgroundColor: theme.surfaceHighlight,
              paddingHorizontal: SPACING.m,
              paddingVertical: 8,
              borderRadius: RADIUS.s,
              maxWidth: '80%'
            }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.primary, textAlign: 'center', lineHeight: 20 }}>
                {getMotivationText()}
              </Text>
            </View>
          </View>

          {/* Statistiken */}
          <View style={{ flexDirection: 'row', gap: SPACING.m, marginBottom: SPACING.xl }}>
            <GlassCard style={{ flex: 1, alignItems: 'center' }} theme={theme}>
              <Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: theme.success }}>{longestStreak}</Text>
              <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: theme.textSecondary, marginTop: 4 }}>Rekord (Tage)</Text>
            </GlassCard>
            <GlassCard style={{ flex: 1, alignItems: 'center' }} theme={theme}>
              <Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: theme.primary }}>{totalDays}</Text>
              <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: theme.textSecondary, marginTop: 4 }}>Gesamt (Tage)</Text>
            </GlassCard>
          </View>

          {/* Statistiken (Aktuelle Serie) */}
          <GlassCard style={{ marginBottom: SPACING.xl }} theme={theme}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: theme.text, marginBottom: SPACING.l }}>Dein Fortschritt (Aktuelle Serie)</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.successGlow, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="heart" size={24} color={theme.success} />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: theme.text }}>{calculateCigarettesNotSmoked()}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: theme.textSecondary }}>Zigaretten</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="wallet" size={24} color={theme.moneyClassic} />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: theme.text }}>{calculateMoneySaved()}€</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: theme.textSecondary }}>Gespart</Text>
              </View>
            </View>
          </GlassCard>

          {/* NEU: Lifetime Stats (Unabhängig von Serie) */}
          <GlassCard style={{ marginBottom: SPACING.xl, borderColor: theme.primary, borderWidth: 1 }} theme={theme}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: theme.primary, marginBottom: SPACING.l }}>Deine Gesamtbilanz (Lifetime)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: SPACING.l }}>
              {/* Geld */}
              <View style={{ width: '50%', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text }}>{lifetimeStats.totalMoney}€</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: theme.textSecondary }}>Gesamt gespart</Text>
              </View>
              {/* Zigaretten */}
              <View style={{ width: '50%', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text }}>{lifetimeStats.totalCigarettes}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: theme.textSecondary }}>Zigaretten vermieden</Text>
              </View>
              {/* Schachteln */}
              <View style={{ width: '50%', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text }}>{lifetimeStats.totalPacks}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: theme.textSecondary }}>Schachteln nicht gekauft</Text>
              </View>
              {/* Leben */}
              <View style={{ width: '50%', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.success }}>+{lifetimeStats.lifeRegainedHours}h</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: theme.textSecondary }}>Lebenszeit gewonnen</Text>
              </View>
            </View>
          </GlassCard>

          {/* NEU: Körper-Regeneration */}
          <View style={{ marginBottom: SPACING.xl }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: theme.text, marginBottom: SPACING.l }}>Körper-Regeneration</Text>

            {healthMilestones.map((item, index) => {
              // Calculate progress (simple linear: if days >= required => 100%, else %)
              // For better visualization, we can assume a "start window".
              // Let's just do simple % of required days for now.
              let progress = 0;
              if (currentStreak >= item.daysRequired) {
                progress = 1;
              } else {
                progress = currentStreak / item.daysRequired;
              }

              const isCompleted = progress >= 1;

              return (
                <GlassCard key={index} style={{ marginBottom: SPACING.m, padding: SPACING.m }} theme={theme}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: isCompleted ? theme.success : theme.text }}>
                      {item.title}
                    </Text>
                    {isCompleted ? (
                      <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                    ) : (
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: theme.primary }}>
                        {Math.floor(progress * 100)}%
                      </Text>
                    )}
                  </View>

                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: theme.textSecondary, marginBottom: 12 }}>
                    {item.description}
                  </Text>

                  {/* Progress Bar */}
                  <View style={{ height: 6, backgroundColor: theme.surfaceHighlight, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{
                      width: `${progress * 100}%`,
                      height: '100%',
                      backgroundColor: isCompleted ? theme.success : theme.primary
                    }} />
                  </View>
                </GlassCard>
              );
            })}
          </View>

          {/* Timeline Meilensteine */}
          <View style={{ paddingLeft: SPACING.m }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: theme.text, marginBottom: SPACING.l }}>Meilensteine</Text>

            <View style={{ marginLeft: 8, borderLeftWidth: 2, borderLeftColor: theme.border, paddingLeft: 24, paddingBottom: 20 }}>
              {/* GOLDEN WEEK - Oberster Meilenstein */}
              {goldenWeek && (
                <View style={{ marginBottom: SPACING.xl, position: 'relative' }}>
                  {/* Dot on Timeline */}
                  <View style={{
                    position: 'absolute',
                    left: -31,
                    top: 0,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: goldenWeek.status === 'completed' ? '#FFD700' :
                      goldenWeek.status === 'active' ? theme.background[0] : theme.background[0],
                    borderWidth: 3,
                    borderColor: goldenWeek.status === 'completed' ? '#FFD700' :
                      goldenWeek.status === 'active' ? '#FFD700' : theme.border,
                    zIndex: 2,
                    shadowColor: goldenWeek.status === 'completed' ? '#FFD700' : '#FFD700',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 5
                  }} />

                  <View style={{
                    backgroundColor: goldenWeek.status === 'completed' ? 'rgba(255, 215, 0, 0.1)' :
                      goldenWeek.status === 'active' ? 'rgba(255, 215, 0, 0.05)' : 'transparent',
                    borderRadius: RADIUS.m,
                    padding: SPACING.m,
                    borderWidth: goldenWeek.status !== 'failed' ? 1 : 0,
                    borderColor: '#FFD700'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Ionicons name="star" size={20} color={goldenWeek.status === 'completed' ? '#FFD700' :
                        goldenWeek.status === 'active' ? '#FFD700' : theme.textMuted} />
                      <Text style={{
                        fontFamily: 'Poppins_700Bold',
                        fontSize: 18,
                        color: goldenWeek.status === 'completed' ? '#FFD700' :
                          goldenWeek.status === 'active' ? '#FFD700' : theme.textMuted
                      }}>
                        Die Goldene Woche
                      </Text>
                    </View>

                    <Text style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 12,
                      color: theme.textSecondary,
                      marginBottom: 12
                    }}>
                      {goldenWeek.status === 'completed'
                        ? '✅ Herausforderung gemeistert! Du hast die kritischste Phase überstanden.'
                        : goldenWeek.status === 'active'
                          ? `Tag ${goldenWeek.progress} von 7. Dein kritisches Fenster zum Erfolg.`
                          : '❌ Herausforderung verpasst. Diese Chance war einmalig.'}
                    </Text>

                    {goldenWeek.status === 'active' && (
                      <View style={{
                        backgroundColor: theme.surfaceHighlight,
                        height: 6,
                        borderRadius: 3,
                        overflow: 'hidden',
                        marginTop: 8
                      }}>
                        <View style={{
                          width: `${(goldenWeek.progress / 7) * 100}%`,
                          height: '100%',
                          backgroundColor: '#FFD700'
                        }} />
                      </View>
                    )}

                    {goldenWeek.status === 'completed' && (
                      <View style={{
                        flexDirection: 'row',
                        gap: 4,
                        marginTop: 8
                      }}>
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                          <View
                            key={day}
                            style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 2,
                              backgroundColor: '#FFD700'
                            }}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Standard Meilensteine */}
              {milestoneList.map((milestone, index) => {
                const isCompleted = currentStreak >= milestone.days;
                const isNext = currentStreak < milestone.days && (index === 0 || currentStreak >= milestoneList[index - 1].days);

                return (
                  <View key={milestone.days} style={{ marginBottom: SPACING.xl, position: 'relative' }}>
                    {/* Dot on Timeline */}
                    <View style={{
                      position: 'absolute',
                      left: -31,
                      top: 0,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: isCompleted ? theme.success : isNext ? theme.background[0] : theme.background[0],
                      borderWidth: 2,
                      borderColor: isCompleted ? theme.success : isNext ? theme.primary : theme.border,
                      zIndex: 1
                    }} />

                    <View style={{ opacity: isCompleted || isNext ? 1 : 0.4 }}>
                      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: isCompleted ? theme.success : isNext ? theme.primary : theme.textMuted }}>
                        {milestone.label}
                      </Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                        {milestone.days} Tage Ziel
                      </Text>

                      {isNext && (
                        <View style={{ marginTop: 8, backgroundColor: theme.surfaceHighlight, height: 4, borderRadius: 2, overflow: 'hidden' }}>
                          <View style={{ width: `${(currentStreak / milestone.days) * 100}%`, height: '100%', backgroundColor: theme.primary }} />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </FadeInView>
  );
}
