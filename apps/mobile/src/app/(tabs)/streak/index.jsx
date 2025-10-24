import {
  View,
  Text,
  ScrollView,
  Animated,
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
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { quitData } from '@/utils/quitData';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const milestoneList = [
  { days: 7, label: '1 Woche rauchfrei' },
  { days: 14, label: '2 Wochen rauchfrei' },
  { days: 30, label: '1 Monat rauchfrei' },
  { days: 60, label: '2 Monate rauchfrei' },
  { days: 90, label: '3 Monate rauchfrei' },
  { days: 180, label: '6 Monate rauchfrei' },
  { days: 365, label: '1 Jahr rauchfrei' },
];

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
  }); // Sofort auf true setzen

  const fadeAnimation = useRef(new Animated.Value(0)).current;

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
        streakNumber: '#10B981',
        streakText: '#A1A1AA',
        milestoneCompleted: '#10B981',
        milestoneCompletedBg: 'rgba(16, 185, 129, 0.1)',
        milestoneNext: '#10B981',
        milestoneNextBg: 'rgba(16, 185, 129, 0.1)',
        milestoneInactive: '#71717A',
        milestoneInactiveBg: 'rgba(255, 255, 255, 0.05)',
        progressBar: 'rgba(255, 255, 255, 0.1)',
        progressFill: '#10B981',
        money: '#F59E0B',
        moneyBg: 'rgba(245, 158, 11, 0.1)',
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
        streakNumber: '#059669',
        streakText: '#6B7280',
        milestoneCompleted: '#10B981',
        milestoneCompletedBg: '#ECFDF5',
        milestoneNext: '#3B82F6',
        milestoneNextBg: '#EFF6FF',
        milestoneInactive: '#9CA3AF',
        milestoneInactiveBg: '#F3F4F6',
        progressBar: '#E5E7EB',
        progressFill: '#3B82F6',
        money: '#F59E0B',
        moneyBg: '#FFFBEB',
      };
    }
  }, [darkModeEnabled]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const loadData = useCallback(async () => {
    try {
      console.log('Loading streak data...');
      const [streak, longest, total, settings] = await Promise.all([
        quitData.getCurrentStreak(),
        quitData.getLongestStreak(),
        quitData.getTotalDaysSinceStart(),
        quitData.getSettings(),
      ]);

      console.log('Loaded streak data:', { streak, longest, total, settings });
      setCurrentStreak(streak);
      setLongestStreak(longest);
      setTotalDays(total);
      
      if (settings) {
        setSmokingPreferences({
          cigarettesPerDay: settings.cigarettesPerDay || 20,
          pricePerPack: settings.pricePerPack || 6.50,
          cigarettesPerPack: 20, // Feste Anzahl pro Schachtel
        });
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  }, []);

  // Berechnungsfunktionen
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
    
    return moneySaved.toFixed(2);
  }, [currentStreak, smokingPreferences]);

  // Settings sofort laden
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await AsyncStorage.getItem('settings');
        if (settings) {
          const parsedSettings = JSON.parse(settings);
          setDarkModeEnabled(parsedSettings.darkModeEnabled !== false);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const fadeIn = useCallback(() => {
    fadeAnimation.setValue(0);
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fadeAnimation]);


  useFocusEffect(
    useCallback(() => {
      fadeIn();
      loadData();
    }, [fadeIn, loadData]),
  );

  // Daten sofort beim Start laden
  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return 'Starte deine Serie mit dem ersten Check-in.';
    }
    if (currentStreak === 1) {
      return 'Erster Tag geschafft! Weiter so!';
    }
    if (currentStreak < 7) {
      return 'Du machst das großartig. Halte durch!';
    }
    if (currentStreak < 30) {
      return 'Fantastisch! Du bist auf dem richtigen Weg.';
    }
    if (currentStreak < 90) {
      return 'Unglaublich! Du hast eine starke Serie.';
    }
    return 'Du bist ein Vorbild! Weiter so!';
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background[0] }}>
      <LinearGradient
        colors={colors.background}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar style={darkModeEnabled ? "light" : "dark"} />

        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 110,
            paddingHorizontal: 20,
          }}
        >
          <Animated.View
            style={{
              opacity: fadeAnimation,
              transform: [
                {
                  translateY: fadeAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            {/* Haupt-Serie Karte */}
            <View
              style={{
                backgroundColor: colors.cardBackground,
                borderRadius: 24,
                padding: 24,
                marginBottom: 20,
                borderWidth: 2,
                borderColor: colors.cardBorder,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 15,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.textPrimary,
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                Aktuelle Serie
              </Text>

              <Text
                style={{
                  fontSize: 64,
                  fontFamily: 'Inter_700Bold',
                  color: colors.streakNumber,
                  textAlign: 'center',
                  lineHeight: 70,
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                }}
              >
                {currentStreak}
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.streakText,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                {currentStreak === 1 ? 'Tag' : 'Tage'} rauchfrei
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 12,
                  fontStyle: 'italic',
                }}
              >
                {getStreakMessage()}
              </Text>
            </View>

            {/* Statistiken */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 20,
                gap: 12,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: 'Inter_700Bold',
                    color: colors.streakNumber,
                    textAlign: 'center',
                  }}
                >
                  {longestStreak}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins_400Regular',
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  Längste Serie
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: 'Inter_700Bold',
                    color: colors.streakNumber,
                    textAlign: 'center',
                  }}
                >
                  {totalDays}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins_400Regular',
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  Gesamt Tage
                </Text>
              </View>
            </View>

            {/* Fortschritte */}
            <View
              style={{
                backgroundColor: colors.cardBackground,
                borderRadius: 20,
                padding: 20,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 5 },
                elevation: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Dein Fortschritt
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: colors.successBg,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 24, color: colors.success }}>🚭</Text>
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
                      fontSize: 14,
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
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: colors.moneyBg || colors.successBg,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 24, color: colors.money || colors.success }}>💰</Text>
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
                      fontSize: 14,
                      fontFamily: 'Poppins_600SemiBold',
                      color: colors.textPrimary,
                    }}
                  >
                    €{calculateMoneySaved()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Meilensteine */}
            <View
              style={{
                backgroundColor: colors.cardBackground,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 5 },
                elevation: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Meilensteine
              </Text>

              {milestoneList.map((milestone, index) => {
                const isCompleted = currentStreak >= milestone.days;
                const isNext = currentStreak < milestone.days && 
                  (index === 0 || currentStreak >= milestoneList[index - 1].days);
                const progress = Math.min(100, (currentStreak / milestone.days) * 100);

                let backgroundColor = colors.milestoneInactiveBg;
                let borderColor = colors.milestoneInactive;
                let textColor = colors.milestoneInactive;
                let opacity = 0.6;

                if (isCompleted) {
                  backgroundColor = colors.milestoneCompletedBg;
                  borderColor = colors.milestoneCompleted;
                  textColor = colors.milestoneCompleted;
                  opacity = 1;
                } else if (isNext) {
                  backgroundColor = colors.milestoneNextBg;
                  borderColor = colors.milestoneNext;
                  textColor = colors.milestoneNext;
                  opacity = 1;
                }

                return (
                  <View
                    key={milestone.days}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor,
                      opacity,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: isCompleted ? 0 : 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: 'Poppins_600SemiBold',
                          color: textColor,
                        }}
                      >
                        {milestone.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: 'Inter_700Bold',
                          color: textColor,
                        }}
                      >
                        {isCompleted ? '✓' : `${milestone.days} Tage`}
                      </Text>
                    </View>
                    
                    {!isCompleted && (
                      <View>
                        <View
                          style={{
                            height: 6,
                            backgroundColor: colors.progressBar,
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <View
                            style={{
                              height: '100%',
                              width: `${progress}%`,
                              backgroundColor: colors.progressFill,
                              borderRadius: 3,
                            }}
                          />
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Poppins_400Regular',
                            color: colors.textSecondary,
                            marginTop: 4,
                            textAlign: 'center',
                          }}
                        >
                          {Math.round(progress)}% - {milestone.days - currentStreak} Tage verbleibend
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
      
    </View>
  );
}