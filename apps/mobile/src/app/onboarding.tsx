import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet, Easing, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PALETTE, SPACING, RADIUS } from '@/constants/theme';
import { quitData } from '@/utils/quitData';
import { purchaseService } from '@/utils/purchases';
import {
  useFonts,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

const { width, height } = Dimensions.get('window');

// --- Visual Assets ---

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

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.8, 0] });

  return (
    <Animated.View style={{ position: 'absolute', left: startX, top: startY, transform: [{ translateY }], opacity }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="10" fill={color} opacity={0.6} />
      </Svg>
    </Animated.View>
  );
};

// Global Background Particles
const BackgroundParticles = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <FloatingParticle startX="10%" startY="20%" size={15} color={PALETTE.dark.primary} duration={6000} />
    <FloatingParticle startX="85%" startY="15%" size={25} color={PALETTE.dark.success} delay={1000} duration={7000} />
    <FloatingParticle startX="20%" startY="60%" size={10} color={PALETTE.dark.primary} delay={2000} duration={5500} />
    <FloatingParticle startX="80%" startY="70%" size={18} color={PALETTE.dark.success} delay={500} duration={8000} />
    <FloatingParticle startX="50%" startY="40%" size={12} color={PALETTE.dark.primary} delay={3000} duration={6500} />
  </View>
);

const Logo = () => (
  <View style={{ width: 80, height: 80, borderRadius: 25, backgroundColor: PALETTE.dark.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 1, borderColor: PALETTE.dark.primary }}>
    <Ionicons name="leaf" size={40} color={PALETTE.dark.primary} />
  </View>
);

// --- Components ---


// New Reactive Button Component
const PrimaryButton = ({ onPress, title }) => {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false // Color interpolation needs native driver false or trick
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false
    }).start();
  };

  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.98]
  });

  const backgroundColor = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PALETTE.dark.surfaceHighlight, PALETTE.dark.primary]
  });

  const textColor = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#121217']
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[
        styles.buttonPrimary,
        {
          transform: [{ scale }],
          backgroundColor,
          shadowOpacity: pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
          shadowColor: PALETTE.dark.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 15,
          borderColor: pressAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.1)', PALETTE.dark.primary] })
        }
      ]}>
        <Animated.Text style={[
          styles.buttonText,
          { color: textColor }
        ]}>
          {title}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const ProgressBar = ({ progress }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={{ height: 4, backgroundColor: PALETTE.dark.surfaceHighlight, borderRadius: 2, overflow: 'hidden', marginTop: SPACING.s }}>
      <Animated.View style={{
        width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        height: '100%',
        backgroundColor: PALETTE.dark.primary
      }} />
    </View>
  );
};

const OptionCard = ({ title, icon, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      backgroundColor: selected ? PALETTE.dark.primaryGlow : PALETTE.dark.surface,
      borderColor: selected ? PALETTE.dark.primary : 'transparent',
      borderWidth: 1,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      marginBottom: SPACING.s,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.m
    }}
  >
    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: selected ? PALETTE.dark.primary : PALETTE.dark.surfaceHighlight, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={20} color={selected ? '#FFF' : PALETTE.dark.textMuted} />
    </View>
    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: PALETTE.dark.text, flex: 1 }}>{title}</Text>
    {selected && <Ionicons name="checkmark-circle" size={20} color={PALETTE.dark.primary} />}
  </TouchableOpacity>
);

const StepperControl = ({ value, onIncrement, onDecrement, suffix = '', label }) => (
  <View style={{ marginBottom: SPACING.l }}>
    {label && <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: PALETTE.dark.textMuted, marginBottom: 8, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.l }}>
      <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDecrement(); }} style={styles.stepperButton}>
        <Ionicons name="remove" size={24} color={PALETTE.dark.text} />
      </TouchableOpacity>
      <View style={{ minWidth: 80, alignItems: 'center' }}>
        <Text style={styles.stepperValue}>{value}<Text style={{ fontSize: 20, color: PALETTE.dark.textMuted }}>{suffix}</Text></Text>
      </View>
      <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onIncrement(); }} style={[styles.stepperButton, { borderColor: PALETTE.dark.primary, backgroundColor: 'rgba(45, 212, 191, 0.1)' }]}>
        <Ionicons name="add" size={24} color={PALETTE.dark.primary} />
      </TouchableOpacity>
    </View>
  </View>
);

const QuickChips = ({ options, onSelect, current }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: SPACING.s }}>
    {options.map((val) => (
      <TouchableOpacity
        key={val}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(val); }}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 14,
          borderRadius: RADIUS.full,
          backgroundColor: current === val ? PALETTE.dark.primary : PALETTE.dark.surfaceHighlight,
        }}
      >
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: current === val ? '#FFF' : PALETTE.dark.textMuted, fontSize: 13 }}>
          {val}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const PlanOption = ({ title, price, originalPrice, subtext, badge, badgeColor, sticker, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={{
      backgroundColor: selected ? 'rgba(45, 212, 191, 0.1)' : 'rgba(255,255,255,0.03)',
      borderColor: selected ? PALETTE.dark.primary : 'rgba(255,255,255,0.1)',
      borderWidth: selected ? 2 : 1,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      marginBottom: SPACING.s,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: sticker ? 12 : 0, // Platz für Sticker
      overflow: 'visible'
    }}
  >
    {sticker && (
      <View style={{
        position: 'absolute',
        top: -11,
        left: 16,
        backgroundColor: PALETTE.dark.primary,
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 6,
        zIndex: 10,
        borderWidth: 2,
        borderColor: '#121217' // Fake Border für Cut-Out Effekt
      }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 10, color: '#121217', textTransform: 'uppercase' }}>
          {sticker}
        </Text>
      </View>
    )}
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: PALETTE.dark.text }}>{title}</Text>
        {badge && (
          <View style={{ backgroundColor: badgeColor || PALETTE.dark.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#121217' }}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        {originalPrice && (
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: PALETTE.dark.textMuted, textDecorationLine: 'line-through' }}>
            {originalPrice}
          </Text>
        )}
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: PALETTE.dark.text }}>{price}</Text>
      </View>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: PALETTE.dark.textSecondary }}>{subtext}</Text>
    </View>
    <View style={{
      width: 24, height: 24, borderRadius: 12,
      borderWidth: 2, borderColor: selected ? PALETTE.dark.primary : PALETTE.dark.textMuted,
      alignItems: 'center', justifyContent: 'center'
    }}>
      {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: PALETTE.dark.primary }} />}
    </View>
  </TouchableOpacity>
);

// --- Main Screen ---
export default function OnboardingScreen() {
  const router = useRouter();
  const { initialStep } = useLocalSearchParams<{ initialStep?: string }>();

  // If routed with ?initialStep=paywall, jump directly to the paywall (step 11).
  // This happens when a user completed onboarding but hasn't paid yet (app restart).
  const [step, setStep] = useState(initialStep === 'paywall' ? 11 : 0);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [answers, setAnswers] = useState({
    yearsSmoked: 5,
    monthsSmoked: 0,
    cigarettesPerDay: 15,
    cigarettesPerPack: 20,
    packPrice: 8.00,
    motivation: '',
  });

  // Paywall State
  const [selectedPlan, setSelectedPlan] = useState('yearly'); // 'yearly' | 'weekly'

  // RevenueCat State
  const [offerings, setOfferings] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Load Prices
  useEffect(() => {
    const loadOffers = async () => {
      try {
        const currentOfferings = await purchaseService.getOfferings();
        if (currentOfferings) {
          setOfferings(currentOfferings);
        }
      } catch (e) {
        console.log('Error loading offers', e);
      } finally {
        setIsLoadingPrice(false);
      }
    };
    loadOffers();
  }, []);

  const handlePurchase = async () => {
    if (!offerings) {
      Alert.alert("Fehler", "Verbindung zum Store fehlgeschlagen. Bitte prüfe deine Internetverbindung.");
      return;
    }

    setIsPurchasing(true);
    try {
      const pkgToBuy = selectedPlan === 'yearly'
        ? offerings.annual
        : offerings.weekly;

      if (!pkgToBuy) {
        // Fallback: find the correct package by identifier type rather than taking [0] blindly.
        // availablePackages[0] could be the wrong plan if annual is null but weekly exists.
        const fallback = selectedPlan === 'yearly'
          ? offerings.availablePackages.find(p => p.packageType === 'ANNUAL')
          : offerings.availablePackages.find(p => p.packageType === 'WEEKLY');
        const finalPkg = fallback || offerings.availablePackages[0];
        if (finalPkg) {
          const success = await purchaseService.purchasePackage(finalPkg);
          if (success) await completeOnboarding();
        } else {
          Alert.alert("Fehler", "Produkte konnten nicht geladen werden.");
        }
        return;
      }

      const success = await purchaseService.purchasePackage(pkgToBuy);
      if (success) {
        await completeOnboarding();
      }
    } catch (e) {
      Alert.alert("Fehler", e.message || "Kauf fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const success = await purchaseService.restorePurchases();
      if (success) {
        Alert.alert("Erfolg", "Einkäufe wiederhergestellt!");
        await completeOnboarding();
      } else {
        Alert.alert("Info", "Keine aktiven Abos gefunden.");
      }
    } catch (e: any) {
      Alert.alert("Fehler", e?.message || "Wiederherstellung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      // CRITICAL: Always reset isPurchasing — even on error.
      // Without this, the button stays disabled forever after a network error.
      setIsPurchasing(false);
    }
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysisProgress = useRef(new Animated.Value(0)).current;
  const [analysisText, setAnalysisText] = useState('Initialisiere...');
  const [analysisSubtext, setAnalysisSubtext] = useState('');
  const [analysisIcon, setAnalysisIcon] = useState('analytics');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#121217' }} />;
  }

  const goToStep = (nextStep) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      // Small delay to allow layout to settle before fading in
      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }, 50);
    });
  };

  const handleNext = () => goToStep(step + 1);
  const handleBack = () => {
    if (step === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(step - 1);
  };

  const startAnalysis = () => {
    // Reset progress
    analysisProgress.setValue(0);

    // 1. Smooth Exit from Question (Fade Out)
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setIsAnalyzing(true);
      setAnalysisText('Analysiere Suchtprofil...');
      setAnalysisIcon('analytics');

      // 2. Smooth Entry to Analysis (Fade In)
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

      // --- 10 SECONDS ANALYSIS SEQUENCE ---
      Animated.sequence([
        Animated.timing(analysisProgress, { toValue: 0.1, duration: 1000, easing: Easing.linear, useNativeDriver: false }),
        Animated.timing(analysisProgress, { toValue: 0.2, duration: 1500, easing: Easing.linear, useNativeDriver: false }),
        Animated.timing(analysisProgress, { toValue: 0.5, duration: 2500, easing: Easing.bezier(0.2, 1, 0.2, 1), useNativeDriver: false }),
        Animated.timing(analysisProgress, { toValue: 0.7, duration: 2000, easing: Easing.linear, useNativeDriver: false }),
        Animated.timing(analysisProgress, { toValue: 0.9, duration: 2000, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(analysisProgress, { toValue: 1.0, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]).start(() => {
        // Save onboardingDate NOW — before paywall — so hasCompletedOnboarding()
        // correctly returns true on the next app start for free users.
        quitData.getOnboardingData().then(existing => {
          if (!existing.onboardingDate) {
            quitData.setOnboardingData({
              ...existing,
              cigarettesPerDay: answers.cigarettesPerDay,
              cigarettesPerPack: answers.cigarettesPerPack,
              pricePerPack: answers.packPrice,
              yearsSmoked: answers.yearsSmoked,
              monthsSmoked: answers.monthsSmoked,
              onboardingDate: new Date().toISOString(), // mark as onboarded (not paid yet)
            }).catch(err => console.warn('Could not save pre-paywall onboarding date:', err));
          }
        });
        // 3. Smooth Exit from Analysis (Fade Out)
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
          setStep(11);
          setIsAnalyzing(false);
          // 4. Smooth Entry to Paywall (Fade In)
          Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        });
      });

      // Text Timeline (Matches 10000ms) - PSYCHOLOGISCH OPTIMIERT
      const timeline = [
        { t: 0, text: 'Analysiere Gewohnheiten...', sub: 'Dein Rauchverhalten wird ausgewertet', icon: 'analytics' },
        { t: 2500, text: 'Berechne Gesundheitsrisiko...', sub: 'Lungenkapazität, Kreislauf, Regeneration', icon: 'pulse' },
        { t: 5000, text: 'Kalkuliere finanzielle Freiheit...', sub: 'Du könntest ein Vermögen sparen', icon: 'wallet' },
        { t: 7500, text: 'Erstelle Ausstiegsplan...', sub: 'Maßgeschneidert auf deinen Alltag', icon: 'construct' },
        { t: 9000, text: 'Dein Weg ist bereit.', sub: 'Der erste Schritt in die Freiheit.', icon: 'checkmark-circle' }
      ];

      timeline.forEach(({ t, text, sub, icon }) => {
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setAnalysisText(text);
          setAnalysisSubtext(sub);
          setAnalysisIcon(icon);
        }, t);
      });
    });
  };

  const renderContract = () => (
    <View style={[styles.contentContainer, { paddingHorizontal: SPACING.l }]}>
      <Text style={styles.question}>Ein letzter Gedanke.</Text>
      <Text style={styles.subtitle}>Bevor wir deinen Plan erstellen.</Text>

      <View style={{
        backgroundColor: '#1A1F2B', // Subtiles Surface
        padding: SPACING.xl,
        borderRadius: RADIUS.l,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 40,
        alignItems: 'center'
      }}>
        <Ionicons name="flag-outline" size={32} color={PALETTE.dark.primary} style={{ marginBottom: 16 }} />

        <Text style={{ fontFamily: 'Inter_500Medium', color: '#FFF', fontSize: 16, marginBottom: 12, textAlign: 'center' }}>
          "Ich bin bereit für die Veränderung."
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', color: PALETTE.dark.textSecondary, lineHeight: 24, fontSize: 14, textAlign: 'center' }}>
          Indem du jetzt weitermachst, triffst du eine bewusste Entscheidung für ein freies, gesundes Leben.
        </Text>
      </View>

      <View style={styles.bottomAction}>
        <PrimaryButton onPress={startAnalysis} title="Plan erstellen" />
      </View>
    </View>
  );

  const completeOnboarding = async () => {
    try {
      // SECURITY: Verify payment with RevenueCat before granting access
      const isVerified = await purchaseService.checkProStatus();

      if (!isVerified) {
        Alert.alert(
          'Zahlung wird verifiziert',
          'Bitte warte einen Moment während wir deine Zahlung bestätigen.'
        );
        // Wait 2 seconds and check again (sometimes takes a moment to sync)
        await new Promise(resolve => setTimeout(resolve, 2000));
        const isVerifiedRetry = await purchaseService.checkProStatus();

        if (!isVerifiedRetry) {
          Alert.alert(
            'Verifizierung fehlgeschlagen',
            'Deine Zahlung konnte nicht bestätigt werden. Bitte versuche "Einkäufe wiederherstellen" oder kontaktiere den Support.'
          );
          return;
        }
      }

      // Payment verified - proceed with onboarding completion
      const settings = {
        cigarettesPerDay: answers.cigarettesPerDay,
        cigarettesPerPack: answers.cigarettesPerPack,
        pricePerPack: answers.packPrice,
        pricePerWeek: (answers.packPrice / answers.cigarettesPerPack * answers.cigarettesPerDay) * 7,
        darkModeEnabled: true,
        motivationalQuotes: true,
        dailyNotification: true,
      };

      await quitData.init();
      await quitData.setSettings(settings);
      await quitData.setOnboardingData({
        ...answers,
        yearsSmoked: answers.yearsSmoked + (answers.monthsSmoked / 12),
        hasPaid: true,
        selectedPlan: selectedPlan,
        onboardingDate: new Date().toISOString(),
      });

      router.replace('/(tabs)/today');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Fehler', 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    }
  };

  // --- Render Helpers ---

  const renderInterstitial = ({ icon, title, text, buttonText = "Weiter" }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.l }}>
      <View style={{
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: SPACING.xl,
        borderWidth: 1, borderColor: PALETTE.dark.primary
      }}>
        <Ionicons name={icon} size={48} color={PALETTE.dark.primary} />
      </View>

      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#FFF', textAlign: 'center', marginBottom: SPACING.m }}>
        {title}
      </Text>

      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: PALETTE.dark.textSecondary, textAlign: 'center', lineHeight: 26 }}>
        {text}
      </Text>

      <View style={{ marginTop: 60, width: '100%' }}>
        <PrimaryButton onPress={handleNext} title={buttonText} />
      </View>
    </View>
  );

  const renderIntro = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Logo />
      <Text style={styles.title}>Deine Freiheit beginnt jetzt.</Text>
      <Text style={styles.subtitle}>
        Wir erstellen deinen persönlichen Ausstiegsplan. Basiert auf wissenschaftlichen Methoden.
      </Text>
      <View style={{ marginTop: 40, width: '100%' }}>
        <PrimaryButton onPress={handleNext} title="Los geht's" />
      </View>
    </View>
  );

  const renderDuration = () => (
    <View style={[styles.contentContainer, { paddingHorizontal: SPACING.l }]}>
      <Text style={styles.question}>Wie lange rauchst du schon?</Text>
      <View style={{ marginTop: 20 }}>
        <StepperControl label="JAHRE" value={answers.yearsSmoked} onDecrement={() => setAnswers(p => ({ ...p, yearsSmoked: Math.max(0, p.yearsSmoked - 1) }))} onIncrement={() => setAnswers(p => ({ ...p, yearsSmoked: Math.min(60, p.yearsSmoked + 1) }))} />
        <StepperControl label="MONATE" value={answers.monthsSmoked} onDecrement={() => setAnswers(p => ({ ...p, monthsSmoked: Math.max(0, p.monthsSmoked - 1) }))} onIncrement={() => setAnswers(p => ({ ...p, monthsSmoked: Math.min(11, p.monthsSmoked + 1) }))} />
      </View>
      <View style={styles.bottomAction}>
        <PrimaryButton onPress={handleNext} title="Weiter" />
      </View>
    </View>
  );

  const renderAmount = () => (
    <View style={[styles.contentContainer, { paddingHorizontal: SPACING.l }]}>
      <Text style={styles.question}>Wie viele Zigaretten am Tag?</Text>
      <View style={{ marginTop: 40 }}>
        <StepperControl value={answers.cigarettesPerDay} onDecrement={() => setAnswers(p => ({ ...p, cigarettesPerDay: Math.max(1, p.cigarettesPerDay - 1) }))} onIncrement={() => setAnswers(p => ({ ...p, cigarettesPerDay: Math.min(100, p.cigarettesPerDay + 1) }))} />
        <QuickChips options={[5, 10, 15, 20, 25, 30]} current={answers.cigarettesPerDay} onSelect={(val) => setAnswers(p => ({ ...p, cigarettesPerDay: val }))} />

        {/* Pain Feedback */}
        <Text style={{ textAlign: 'center', marginTop: 20, color: PALETTE.dark.error, fontSize: 13, fontFamily: 'Inter_500Medium', opacity: 0.8 }}>
          Das sind {answers.cigarettesPerDay * 365} Zigaretten pro Jahr.
        </Text>
      </View>
      <View style={styles.bottomAction}>
        <PrimaryButton onPress={handleNext} title="Weiter" />
      </View>
    </View>
  );

  const renderPackSize = () => (
    <View style={[styles.contentContainer, { paddingHorizontal: SPACING.l }]}>
      <Text style={styles.question}>Wie viele Zigaretten pro Schachtel?</Text>
      <Text style={styles.subtitle}>Für die präzise Berechnung.</Text>
      <View style={{ marginTop: 20 }}>
        <StepperControl value={answers.cigarettesPerPack} onDecrement={() => setAnswers(p => ({ ...p, cigarettesPerPack: Math.max(10, p.cigarettesPerPack - 1) }))} onIncrement={() => setAnswers(p => ({ ...p, cigarettesPerPack: Math.min(50, p.cigarettesPerPack + 1) }))} />
        <QuickChips options={[19, 20, 21, 22, 25, 30]} current={answers.cigarettesPerPack} onSelect={(val) => setAnswers(p => ({ ...p, cigarettesPerPack: val }))} />
      </View>
      <View style={styles.bottomAction}>
        <PrimaryButton onPress={handleNext} title="Weiter" />
      </View>
    </View>
  );

  const renderCost = () => {
    const dailyCost = answers.packPrice / answers.cigarettesPerPack * answers.cigarettesPerDay;
    const yearlyCost = dailyCost * 365;

    return (
      <View style={[styles.contentContainer, { paddingHorizontal: SPACING.l }]}>
        <Text style={styles.question}>Preis pro Schachtel?</Text>
        <View style={{ marginTop: 40 }}>
          <StepperControl value={answers.packPrice.toFixed(2)} suffix="€" onDecrement={() => setAnswers(p => ({ ...p, packPrice: Math.max(4, p.packPrice - 0.50) }))} onIncrement={() => setAnswers(p => ({ ...p, packPrice: Math.min(20, p.packPrice + 0.50) }))} />
          <QuickChips options={[7, 8, 9, 10, 12, 15]} current={answers.packPrice} onSelect={(val) => setAnswers(p => ({ ...p, packPrice: val }))} />

          {/* Pain Feedback */}
          <Text style={{ textAlign: 'center', marginTop: 20, color: PALETTE.dark.error, fontSize: 13, fontFamily: 'Inter_500Medium', opacity: 0.8 }}>
            Das sind {Math.round(yearlyCost).toLocaleString('de-DE')}€, die du jährlich verbrennst.
          </Text>
        </View>
        <View style={styles.bottomAction}>
          <PrimaryButton onPress={handleNext} title="Weiter" />
        </View>
      </View>
    );
  };

  const renderMotivation = () => (
    <View style={[styles.contentContainer, { paddingHorizontal: SPACING.l }]}>
      <Text style={styles.question}>Was ist dein Hauptgrund?</Text>
      <View style={{ marginTop: 20 }}>
        <OptionCard title="Gesundheit & Fitness" icon="heart" selected={answers.motivation === 'health'} onPress={() => { setAnswers(prev => ({ ...prev, motivation: 'health' })); handleNext(); }} />
        <OptionCard title="Geld sparen" icon="wallet" selected={answers.motivation === 'money'} onPress={() => { setAnswers(prev => ({ ...prev, motivation: 'money' })); handleNext(); }} />
        <OptionCard title="Familie & Freunde" icon="people" selected={answers.motivation === 'family'} onPress={() => { setAnswers(prev => ({ ...prev, motivation: 'family' })); handleNext(); }} />
        <OptionCard title="Freiheit von Sucht" icon="lock-open" selected={answers.motivation === 'freedom'} onPress={() => { setAnswers(prev => ({ ...prev, motivation: 'freedom' })); handleNext(); }} />
      </View>
    </View>
  );

  const renderAnalysis = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.l }}>
      <View style={{ width: 80, height: 80, marginBottom: 40 }}>
        <Ionicons name={analysisIcon} size={80} color={PALETTE.dark.primary} />
      </View>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 24, color: PALETTE.dark.text, textAlign: 'center', marginBottom: SPACING.s }}>{analysisText}</Text>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: PALETTE.dark.textMuted, textAlign: 'center', minHeight: 40 }}>{analysisSubtext}</Text>
      <View style={{ width: '100%', height: 6, backgroundColor: PALETTE.dark.surfaceHighlight, borderRadius: 3, marginTop: 40, overflow: 'hidden' }}>
        <Animated.View style={{ flex: 1, width: analysisProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: PALETTE.dark.primary }} />
      </View>
    </View>
  );

  const FeatureRow = ({ text }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <View style={{ backgroundColor: 'rgba(45, 212, 191, 0.1)', padding: 4, borderRadius: 10 }}>
        <Ionicons name="checkmark" size={16} color={PALETTE.dark.primary} />
      </View>
      <Text style={{ color: PALETTE.dark.text, fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 }}>{text}</Text>
    </View>
  );

  const renderPaywall = () => {
    const yearsFloat = answers.yearsSmoked + (answers.monthsSmoked / 12);
    const cigsPerDay = answers.cigarettesPerDay;
    const packSize = answers.cigarettesPerPack || 20;
    const price = answers.packPrice;

    // REVENUECAT DATA
    const yearlyPkg = offerings?.annual;
    const weeklyPkg = offerings?.weekly;

    const yearlyPriceStr = yearlyPkg?.product?.priceString || "29,99 €";
    const weeklyPriceStr = weeklyPkg?.product?.priceString || "5,99 €";

    const yearlyPriceNum = yearlyPkg?.product?.price || 29.99;
    const weeklyPriceNum = weeklyPkg?.product?.price || 5.99;

    // Only show free trial badge/text if RevenueCat actually has a trial configured.
    // Hardcoding "3 days free" when no trial exists is an Apple rejection risk + legal issue.
    const weeklyHasTrial = weeklyPkg?.product?.introductoryDiscount != null;

    // Berechne Brutto-Ersparnis für 1 Jahr
    const rawSavings = Math.round((cigsPerDay / packSize * price) * 365);

    // Abo-Kosten abziehen (Jahresabo vs. Wochenabo auf ein Jahr)
    const subscriptionCost = selectedPlan === 'yearly' ? yearlyPriceNum : (weeklyPriceNum * 52);
    const oneYearSavings = Math.max(0, Math.round(rawSavings - subscriptionCost));

    // Anker-Berechnung: Wie viele Schachteln entspricht der Jahrespreis?
    const packsEquivalent = (yearlyPriceNum / price).toFixed(1).replace('.', ',');

    return (
      <View style={{ flex: 1 }}>
        {/* CLEANER BACKGROUND: Subtiler Gradient von oben */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradient
            colors={['rgba(45, 212, 191, 0.08)', 'transparent']}
            style={{ width: '100%', height: 500 }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER NEU: Premium & Clean */}
          <View style={{ alignItems: 'center', marginTop: 80, marginBottom: 40, paddingHorizontal: 20 }}>
            <View style={{
              width: 72, height: 72,
              borderRadius: 24,
              backgroundColor: '#1A1F2B',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: 'rgba(45, 212, 191, 0.2)',
              marginBottom: 24,
              shadowColor: PALETTE.dark.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24
            }}>
              <Ionicons name="star" size={32} color={PALETTE.dark.primary} />
            </View>

            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#FFF', textAlign: 'center', marginBottom: 12, lineHeight: 36 }}>
              Entfessele dein{'\n'}volles Potenzial.
            </Text>

            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: PALETTE.dark.textSecondary, textAlign: 'center', lineHeight: 24, maxWidth: 300 }}>
              Nutze wissenschaftliche Methoden, um dauerhaft rauchfrei zu bleiben.
            </Text>
          </View>

          {/* Emotionaler Kontext: Ersparnis */}
          <View style={{ paddingHorizontal: SPACING.l, marginBottom: 30 }}>
            <View style={{
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              borderRadius: RADIUS.l,
              padding: SPACING.l,
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.2)',
              alignItems: 'center',
              overflow: 'hidden' // Important for contained glow
            }}>
              <View style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, backgroundColor: PALETTE.dark.success, opacity: 0.1, borderRadius: 75 }} />

              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: PALETTE.dark.textSecondary, textAlign: 'center', marginBottom: 4 }}>
                Dein Gewinn <Text style={{ color: '#FFF', fontFamily: 'Inter_700Bold' }}>NUR</Text> im ersten Jahr
              </Text>

              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 42, color: PALETTE.dark.success, marginVertical: 4 }}>
                {oneYearSavings.toLocaleString('de-DE')}€
              </Text>

              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: PALETTE.dark.textSecondary, marginTop: 4, textAlign: 'center' }}>
                Investiere in deine Träume, nicht in Rauch.
              </Text>
            </View>
          </View>

          {/* Preis-Anker: App Kosten vs Zigaretten */}
          <View style={{ paddingHorizontal: SPACING.l, marginBottom: 30 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: PALETTE.dark.textMuted, textAlign: 'center', marginBottom: 16 }}>
              Die App kostet dich im Jahr weniger als:
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
              <View style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 16, minWidth: 100 }}>
                <Ionicons name="cube" size={24} color={PALETTE.dark.error} style={{ marginBottom: 4 }} />
                <Text style={{ fontFamily: 'Poppins_700Bold', color: '#FFF', fontSize: 16 }}>~{packsEquivalent}</Text>
                <Text style={{ fontSize: 10, color: PALETTE.dark.textSecondary }}>Schachteln</Text>
              </View>
              <Text style={{ color: PALETTE.dark.textMuted, fontFamily: 'Inter_600SemiBold' }}>vs.</Text>
              <View style={{ alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 16, minWidth: 100, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <Ionicons name="heart-circle" size={28} color={PALETTE.dark.primary} style={{ marginBottom: 0 }} />
                <Text style={{ fontFamily: 'Poppins_700Bold', color: '#FFF', fontSize: 16 }}>Freiheit</Text>
                <Text style={{ fontSize: 10, color: PALETTE.dark.textSecondary }}>Für immer</Text>
              </View>
            </View>
          </View>

          {/* Feature List */}
          <View style={{ paddingHorizontal: SPACING.l, marginBottom: 30 }}>
            <FeatureRow text="Exakter Ersparnis- & Zeit-Rechner" />
            <FeatureRow text="Lückenloses Erfolgs-Tracking" />
            <FeatureRow text="Motivierende Statistik-Übersicht" />
            <FeatureRow text="Gesundheits-Fortschritt Visualisierung" />
          </View>

          {/* Pricing Options */}
          <View style={{ paddingHorizontal: SPACING.l, gap: 12, marginBottom: 30 }}>
            {isLoadingPrice ? (
              <ActivityIndicator size="large" color={PALETTE.dark.primary} style={{ marginVertical: 20 }} />
            ) : (
              <>
                <PlanOption
                  title="Jahres-Mitgliedschaft"
                  price={`${yearlyPriceStr} / Jahr`}
                  subtext="Das beste Angebot für deinen Erfolg"
                  badge="BELIEBTESTE WAHL"
                  sticker="BELIEBT"
                  selected={selectedPlan === 'yearly'}
                  onPress={() => setSelectedPlan('yearly')}
                />
                <PlanOption
                  title="Wöchentlich"
                  price={`${weeklyPriceStr} / Woche`}
                  subtext={weeklyHasTrial ? "Volle Flexibilität. 3 Tage kostenlos testen." : "Volle Flexibilität. Jederzeit kündbar."}
                  badge={weeklyHasTrial ? "3 TAGE GRATIS" : "FLEXIBEL"}
                  badgeColor={PALETTE.dark.success}
                  selected={selectedPlan === 'weekly'}
                  onPress={() => setSelectedPlan('weekly')}
                />
              </>
            )}
          </View>

          {/* Footer Action */}
          <View style={{ paddingHorizontal: SPACING.l, marginBottom: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: PALETTE.dark.textSecondary, fontSize: 12, marginBottom: 4 }}>
                {selectedPlan === 'yearly'
                  ? `${yearlyPriceStr} / Jahr. Sofortiger Zugriff.`
                  : `${weeklyPriceStr} / Woche nach 3 kostenlosen Test-Tagen.`}
              </Text>
            </View>

            <TouchableOpacity onPress={handlePurchase} activeOpacity={0.9} disabled={isPurchasing || isLoadingPrice}>
              <LinearGradient
                colors={[PALETTE.dark.primary, '#2DD4BF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: RADIUS.full,
                  paddingVertical: 16,
                  alignItems: 'center',
                  shadowColor: PALETTE.dark.primary,
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  opacity: (isPurchasing || isLoadingPrice) ? 0.7 : 1
                }}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#121217" />
                ) : (
                  <>
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 17, color: '#121217' }}>
                      {selectedPlan === 'yearly' ? "Rauchfreies Leben starten" : (weeklyHasTrial ? "Jetzt 3 Tage gratis testen" : "Jetzt starten")}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: 'rgba(0,0,0,0.6)', marginTop: 2 }}>
                      {selectedPlan === 'yearly' ? 'Spare langfristig maximal' : 'Jederzeit kündbar in den Einstellungen'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRestore}
              style={{ marginTop: 20, padding: 10 }}
              disabled={isPurchasing}
            >
              <Text style={{ textAlign: 'center', color: PALETTE.dark.textMuted, fontSize: 12, fontFamily: 'Inter_500Medium', textDecorationLine: 'underline', opacity: isPurchasing ? 0.5 : 1 }}>
                Einkäufe wiederherstellen
              </Text>
            </TouchableOpacity>

            <Text style={{ textAlign: 'center', color: PALETTE.dark.textSecondary, fontSize: 10, marginTop: 10 }}>
              Abo verlängert sich automatisch. Kündbar bis 24h vor Ablauf.
            </Text>

            {/* Apple-Pflicht: EULA + Datenschutz Links (Guideline 3.1.2) */}
            <View style={{ marginTop: 16, alignItems: 'center', paddingHorizontal: 10 }}>
              <Text style={{ color: PALETTE.dark.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 18 }}>
                Mit dem Kauf stimmst du den{' '}
                <Text
                  style={{ textDecorationLine: 'underline', color: PALETTE.dark.textSecondary }}
                  onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
                >
                  Nutzungsbedingungen (EULA)
                </Text>
                {' '}und der{' '}
                <Text
                  style={{ textDecorationLine: 'underline', color: PALETTE.dark.textSecondary }}
                  onPress={() => Linking.openURL('https://nicht-rauchen-privacy.netlify.app/privacy-policy.html')}
                >
                  Datenschutzerklärung
                </Text>
                {' '}zu.
              </Text>
            </View>
          </View>

        </ScrollView>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#121217' }}>
      <Stack.Screen options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#121217' } }} />

      {/* GLOBAL PARTICLES */}
      <BackgroundParticles />

      <View style={{ flex: 1, paddingTop: step === 11 ? 0 : 60, paddingBottom: 34 }}>
        {step > 0 && step < 11 && !isAnalyzing && (
          <View style={{ marginBottom: 30, paddingHorizontal: SPACING.l }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="arrow-back" size={24} color={PALETTE.dark.text} />
              </TouchableOpacity>
              <View style={{ width: 24 }} />
            </View>
            <ProgressBar progress={Math.min(1, step / 11)} />
          </View>
        )}

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {isAnalyzing ? renderAnalysis() : (
            <>
              {step === 0 && <View style={{ flex: 1, paddingHorizontal: SPACING.l }}>{renderIntro()}</View>}
              {step === 1 && renderMotivation()}
              {step === 2 && renderInterstitial({
                icon: 'star',
                title: 'Exzellenter Grund.',
                text: 'Wenn du weißt, WARUM du aufhörst, ist das WIE viel einfacher. Wir behalten dein Ziel fest im Blick.',
                buttonText: 'Weiter'
              })}
              {step === 3 && renderDuration()}
              {step === 4 && renderInterstitial({
                icon: 'fitness',
                title: 'Starker Wille.',
                text: 'Dein Körper ist ein Wunderwerk. Schon 20 Minuten nach der letzten Zigarette beginnt er, sich zu heilen. Wir unterstützen dich dabei, diesen Weg konsequent zu gehen.',
                buttonText: 'Weiter so'
              })}
              {step === 5 && renderAmount()}
              {step === 6 && renderInterstitial({
                icon: 'trophy',
                title: 'Du bist nicht allein.',
                text: 'Der durchschnittliche Nutzer braucht 3 Versuche. Mit unserem wissenschaftlichen System klappt es diesmal endgültig.',
                buttonText: 'Ich schaffe das'
              })}
              {step === 7 && renderPackSize()}
              {step === 8 && renderInterstitial({
                icon: 'cash',
                title: 'Teure Gewohnheit.',
                text: 'Tabakpreise steigen jedes Jahr. Wir rechnen gleich mal aus, was dich das wirklich kostet.',
                buttonText: 'Zur Berechnung'
              })}
              {step === 9 && renderCost()}
              {step === 10 && renderContract()}
              {step === 11 && renderPaywall()}
            </>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', textAlign: 'center', marginBottom: SPACING.m },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: PALETTE.dark.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 24, paddingHorizontal: SPACING.m },
  question: { fontSize: 24, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', marginBottom: SPACING.m, textAlign: 'center' },
  contentContainer: { flex: 1, justifyContent: 'center' },
  bottomAction: { marginTop: 60, width: '100%' },
  buttonPrimary: { backgroundColor: PALETTE.dark.surfaceHighlight, paddingVertical: 16, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  buttonText: { fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', fontSize: 16 },
  stepperButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: PALETTE.dark.border },
  stepperValue: { fontSize: 36, fontFamily: 'Poppins_600SemiBold', color: PALETTE.dark.text }
});
