import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StyleSheet,
  Easing
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
} from '@expo-google-fonts/inter';
import { quitData } from '@/utils/quitData';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, SPACING, RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

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
      <FloatingParticle startX="15%" startY="10%" size={25} color={theme.primary} delay={0} duration={8000} />
      <FloatingParticle startX="80%" startY="60%" size={30} color={theme.success} delay={2000} duration={9000} />
      <FloatingParticle startX="40%" startY="85%" size={20} color={theme.money} delay={4000} duration={7000} />
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="20%" rx="60%" ry="40%" fx="50%" fy="20%" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={theme.primary} stopOpacity="0.1" />
            <Stop offset="1" stopColor={theme.background[0]} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="20%" r="600" fill="url(#grad)" />
      </Svg>
    </View>
  );
};

import { FadeInView } from '@/components/FadeInView';

const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const getFirstDayOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = firstDay.getDay();
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
};

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

const getMonthName = (date) => date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthCheckIns, setMonthCheckIns] = useState({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  const calendarFadeAnimation = useRef(new Animated.Value(1)).current;
  // const fadeAnimation = useRef(new Animated.Value(0)).current; // Removed to prevent fast-switching glitches

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Inter_400Regular,
  });

  const theme = useMemo(() => darkModeEnabled ? PALETTE.dark : PALETTE.light, [darkModeEnabled]);

  const loadData = useCallback(async () => {
    try {
      const [checkIns, streak] = await Promise.all([
        quitData.getMonthCheckIns(currentDate),
        quitData.getCurrentStreak(),
      ]);
      setMonthCheckIns(checkIns);
      setCurrentStreak(streak);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  }, [currentDate]);

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

  const fadeInCalendar = useCallback(() => {
    calendarFadeAnimation.setValue(0);
    Animated.timing(calendarFadeAnimation, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [calendarFadeAnimation]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  useEffect(() => { loadData(); }, [loadData]);

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
    const cellWidth = (width - SPACING.l * 2 - SPACING.l * 2) / 7; // Adjust for padding
    const rows = [];
    const allDays = [];
    
    for (let i = 0; i < firstDay; i++) allDays.push(null);
    for (let day = 1; day <= daysInCurrentMonth; day++) allDays.push(day);

    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7);
      while (weekDays.length < 7) weekDays.push(null);

      rows.push(
        <View key={`week-${i / 7}`} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          {weekDays.map((day, dayIndex) => {
            if (day === null) return <View key={`empty-${i + dayIndex}`} style={{ width: cellWidth, height: cellWidth }} />;

            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isCurrentDay = isToday(dayDate);
            const dayStatus = monthCheckIns[day];

            let backgroundColor = 'transparent';
            let textColor = theme.textSecondary;
            let borderColor = 'transparent';
            let borderWidth = 0;

            if (dayStatus === 'success') {
              backgroundColor = theme.successGlow;
              textColor = theme.success;
            } else if (dayStatus === 'smoked') {
              backgroundColor = theme.errorGlow;
              textColor = theme.error;
            } 
            
            if (isCurrentDay) {
               borderColor = theme.primary;
               borderWidth = 1;
               textColor = theme.primary;
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
                  borderRadius: cellWidth / 2,
                  borderWidth,
                  borderColor,
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: textColor }}>
                  {day}
                </Text>
                {/* Kleiner Punkt für Status wenn kein Background */}
                {!dayStatus && !isCurrentDay && (
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.surfaceHighlight, marginTop: 4 }} />
                )}
              </View>
            );
          })}
        </View>
      );
    }
    return rows;
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.background[0] }} />;

  return (
    <FadeInView style={{ flex: 1, backgroundColor: theme.background[0] }}>
      <LinearGradient colors={theme.background} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <BackgroundArt theme={theme} />
      <StatusBar style={darkModeEnabled ? "light" : "dark"} />

      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + 100, paddingHorizontal: SPACING.l }}>
          
          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 28, color: theme.text, marginBottom: SPACING.m }}>Kalender</Text>

          <View style={{ 
            backgroundColor: theme.surface, 
            borderRadius: RADIUS.m, 
            padding: SPACING.l, 
            marginBottom: SPACING.l,
            borderWidth: 1,
            borderColor: theme.border 
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl }}>
               <TouchableOpacity onPress={handlePreviousMonth} style={{ padding: SPACING.s }}>
                  <Ionicons name="chevron-back" size={24} color={theme.textSecondary} />
               </TouchableOpacity>
               
               <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: theme.text }}>{getMonthName(currentDate)}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: theme.primary, letterSpacing: 1 }}>SERIE: {currentStreak} TAGE</Text>
               </View>

               <TouchableOpacity onPress={handleNextMonth} style={{ padding: SPACING.s }}>
                  <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
               </TouchableOpacity>
            </View>

            {/* Week Days Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.m, paddingHorizontal: 0 }}>
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, index) => (
                <Text key={index} style={{ 
                   fontSize: 12, fontFamily: 'Inter_400Regular', color: theme.textMuted, 
                   width: (width - SPACING.l * 4) / 7, textAlign: 'center' 
                }}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Grid */}
            <Animated.View style={{ opacity: calendarFadeAnimation }}>
              {generateCalendarGrid()}
            </Animated.View>

          </View>

          <TouchableOpacity
            onPress={handleGoToday}
            style={{
              alignSelf: 'center',
              paddingVertical: SPACING.s,
              paddingHorizontal: SPACING.l,
              borderRadius: RADIUS.full,
              backgroundColor: theme.surfaceHighlight,
              borderWidth: 1,
              borderColor: theme.border
            }}
          >
            <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular', fontSize: 12 }}>Zurück zu Heute</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </FadeInView>
  );
}