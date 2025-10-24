import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
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
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { quitData } from '@/utils/quitData';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const daysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = firstDay.getDay();
  // getDay() gibt 0=Sonntag, 1=Montag, ..., 6=Samstag zurück
  // Für deutschen Kalender: 0=Montag, 1=Dienstag, ..., 6=Sonntag
  // Sonntag (0) wird zu 6, Montag (1) wird zu 0, etc.
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
};

const isToday = (date) => {
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  
  const checkDate = date.getDate();
  const checkMonth = date.getMonth();
  const checkYear = date.getFullYear();
  
  return (
    checkDate === todayDate &&
    checkMonth === todayMonth &&
    checkYear === todayYear
  );
};

const getMonthName = (date) => {
  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
};

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthCheckIns, setMonthCheckIns] = useState({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  const calendarFadeAnimation = useRef(new Animated.Value(1)).current; // Startet mit 1

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
        neutral: '#71717A',
        neutralBg: 'rgba(255, 255, 255, 0.05)',
        today: '#10B981',
        todayBg: 'rgba(16, 185, 129, 0.1)',
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
        neutral: '#6B7280',
        neutralBg: '#F9FAFB',
        today: '#3B82F6',
        todayBg: '#EFF6FF',
        buttonBg: '#F8FAFC',
        buttonBorder: '#E2E8F0',
      };
    }
  }, [darkModeEnabled]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const loadData = useCallback(async () => {
    try {
      console.log('Loading calendar data for:', currentDate.toLocaleDateString('de-DE'));
      const [checkIns, streak] = await Promise.all([
        quitData.getMonthCheckIns(currentDate),
        quitData.getCurrentStreak(),
      ]);

      console.log('Loaded data:', { checkIns, streak });
      setMonthCheckIns(checkIns);
      setCurrentStreak(streak);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  }, [currentDate]);

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

  // Daten sofort beim Start laden
  useEffect(() => {
    loadData();
  }, [loadData]);

  const fadeInCalendar = useCallback(() => {
    calendarFadeAnimation.setValue(0);
    Animated.timing(calendarFadeAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [calendarFadeAnimation]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    fadeInCalendar();
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    fadeInCalendar();
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
    fadeInCalendar();
  };



  const generateCalendarGrid = () => {
    const daysInCurrentMonth = daysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const cellWidth = (width - 120) / 7; // Mehr Platz für bessere Darstellung
    const rows = [];

    console.log('Calendar Debug:', {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      daysInMonth: daysInCurrentMonth,
      firstDay: firstDay,
      firstDayName: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][firstDay]
    });

    // Erstelle alle Tage des Monats
    const allDays = [];
    
    // Leere Zellen für die ersten Tage des Monats
    for (let i = 0; i < firstDay; i++) {
      allDays.push(null);
    }

    // Tage des Monats
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      allDays.push(day);
    }

    // Teile die Tage in Reihen von 7 auf
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7);
      
      // Fülle die letzte Reihe mit null auf, falls sie nicht vollständig ist
      while (weekDays.length < 7) {
        weekDays.push(null);
      }

      rows.push(
        <View
          key={`week-${i / 7}`}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          {weekDays.map((day, dayIndex) => {
            if (day === null) {
              return (
                <View
                  key={`empty-${i + dayIndex}`}
                  style={{
                    width: cellWidth,
                    height: cellWidth,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                />
              );
            }

            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isCurrentDay = isToday(dayDate);
            const dayStatus = monthCheckIns[day];

            let backgroundColor = colors.neutralBg;
            let borderColor = colors.buttonBorder;
            let textColor = colors.textSecondary;

            if (dayStatus === 'success') {
              backgroundColor = colors.successBg;
              borderColor = colors.success;
              textColor = colors.success;
            } else if (dayStatus === 'smoked') {
              backgroundColor = colors.errorBg;
              borderColor = colors.error;
              textColor = colors.error;
            } else if (isCurrentDay) {
              backgroundColor = colors.todayBg;
              borderColor = colors.today;
              textColor = colors.today;
            }

            return (
              <View
                key={day}
                style={{
                  width: cellWidth,
                  height: cellWidth,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins_600SemiBold',
                    color: textColor,
                  }}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      );
    }

    return rows;
  };

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
          {/* Header */}
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
            {/* Monats-Navigation */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={handlePreviousMonth}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.buttonBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.buttonBorder,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 6,
                }}
              >
                <Text style={{ fontSize: 20, color: colors.textSecondary }}>‹</Text>
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.textPrimary,
                    textAlign: 'center',
                  }}
                >
                  {getMonthName(currentDate)}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins_400Regular',
                    color: colors.textSecondary,
                    marginTop: 4,
                  }}
                >
                  Aktuelle Serie: {currentStreak} Tage
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.buttonBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.buttonBorder,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 6,
                }}
              >
                <Text style={{ fontSize: 20, color: colors.textSecondary }}>›</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleGoToday}
              style={{
                backgroundColor: colors.todayBg,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderWidth: 1,
                borderColor: colors.today,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.today,
                }}
              >
                Heute
              </Text>
            </TouchableOpacity>
          </View>

          {/* Kalender */}
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
            {/* Wochentage */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 15,
                paddingHorizontal: 20,
              }}
            >
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, index) => (
                <Text
                  key={index}
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.textSecondary,
                    width: (width - 120) / 7,
                    textAlign: 'center',
                  }}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Kalender-Grid */}
            <Animated.View
              style={{
                opacity: calendarFadeAnimation,
                paddingHorizontal: 20,
              }}
            >
              {generateCalendarGrid()}
            </Animated.View>
          </View>

        </ScrollView>
      </LinearGradient>
      
    </View>
  );
}