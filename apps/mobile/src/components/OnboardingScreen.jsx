import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quitData } from '@/utils/quitData';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Dein neues Leben beginnt heute',
    subtitle: 'Du hast den wichtigsten Schritt bereits gemacht',
    description: 'Jeder Tag ohne Zigarette ist ein Sieg. Lass uns gemeinsam deine Erfolge feiern.',
    image: '🎉',
    backgroundColor: ['#0A0F0A', '#0F1A0F', '#0A0F0A'],
    primaryColor: '#10B981',
    gradient: ['#0A0F0A', '#0F1A0F', '#0A0F0A'],
  },
  {
    id: 2,
    title: 'Sieh deine Fortschritte',
    subtitle: 'Jeder Tag zählt',
    description: 'Verfolge deine Serie, sieh deine Erfolge und bleib motiviert.',
    image: '📊',
    backgroundColor: ['#0F1A0F', '#0A0F0A', '#0F1A0F'],
    primaryColor: '#059669',
    gradient: ['#0F1A0F', '#0A0F0A', '#0F1A0F'],
  },
  {
    id: 3,
    title: 'Lass uns starten',
    subtitle: 'Nur 2 kurze Fragen',
    description: 'Damit wir deine Erfolge richtig berechnen können.',
    image: '⚡',
    backgroundColor: ['#0A0F0A', '#0F1A0F', '#0A0F0A'],
    primaryColor: '#047857',
    gradient: ['#0A0F0A', '#0F1A0F', '#0A0F0A'],
  },
];

export default function OnboardingScreen({ onComplete }) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [cigarettesPerDay, setCigarettesPerDay] = useState(20);
  const [pricePerWeek, setPricePerWeek] = useState(45.50);
  
  // Animation Refs
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const iconAnimation = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const colors = {
    background: onboardingData[currentStep].backgroundColor,
    primary: onboardingData[currentStep].primaryColor,
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    cardBackground: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    buttonBg: 'rgba(255, 255, 255, 0.1)',
    buttonBorder: 'rgba(255, 255, 255, 0.2)',
  };

  // Smooth animations on step change
  useEffect(() => {
    // Icon bounce animation
    Animated.sequence([
      Animated.timing(iconAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(iconAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress animation
    Animated.timing(progressAnimation, {
      toValue: (currentStep + 1) / onboardingData.length,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentStep < onboardingData.length - 1) {
      // Smooth slide transition without fade
      Animated.timing(slideAnimation, {
        toValue: -(currentStep + 1) * width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
      });
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Smooth slide transition without fade
      Animated.timing(slideAnimation, {
        toValue: -(currentStep - 1) * width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
      });
    }
  };

  const handleComplete = async () => {
    try {
      const settings = {
        cigarettesPerDay,
        pricePerWeek,
        motivationalQuotes: true,
        dailyNotification: true,
        darkModeEnabled: true,
      };
      
      await quitData.setSettings(settings);
      await AsyncStorage.setItem('app_onboarded', 'true');
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete();
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={{
        position: 'absolute',
        top: insets.top + 20,
        left: 20,
        right: 20,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <Animated.View
          style={{
            height: '100%',
            width: progressAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: colors.primary,
            borderRadius: 2,
          }}
        />
      </View>
    );
  };

  const renderStepContent = (step) => {
    const data = onboardingData[step];
    
    if (step === 2) {
      // Final screen with inputs
      return (
        <ScrollView 
          contentContainerStyle={{ 
            alignItems: 'center', 
            paddingHorizontal: 20,
            paddingTop: height * 0.15,
            paddingBottom: 200, // Extra space for buttons
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Icon */}
          <Animated.View
            style={{
              transform: [
                {
                  scale: iconAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            }}
          >
            <Text style={{ fontSize: 80, marginBottom: 30 }}>{data.image}</Text>
          </Animated.View>
          
          <Text style={{
            fontSize: 32,
            fontFamily: 'Poppins_700Bold',
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: 12,
            lineHeight: 38,
          }}>
            {data.title}
          </Text>
          
          <Text style={{
            fontSize: 18,
            fontFamily: 'Poppins_600SemiBold',
            color: colors.primary,
            textAlign: 'center',
            marginBottom: 16,
          }}>
            {data.subtitle}
          </Text>
          
          <Text style={{
            fontSize: 16,
            fontFamily: 'Poppins_400Regular',
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 50,
            maxWidth: 280,
          }}>
            {data.description}
          </Text>

          {/* Input Cards */}
          <View style={{ width: '100%', gap: 20 }}>
            {/* Zigaretten pro Tag */}
            <View style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              backdropFilter: 'blur(10px)',
            }}>
              <Text style={{
                fontSize: 18,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.textPrimary,
                marginBottom: 20,
                textAlign: 'center',
              }}>
                Wie viele Zigaretten rauchst du täglich?
              </Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
              }}>
                <TouchableOpacity
                  onPress={() => {
                    const newValue = Math.max(1, cigarettesPerDay - 1);
                    setCigarettesPerDay(newValue);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.buttonBg,
                    borderWidth: 1,
                    borderColor: colors.buttonBorder,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>-</Text>
                </TouchableOpacity>
                
                <Text style={{
                  fontSize: 48,
                  fontFamily: 'Inter_700Bold',
                  color: colors.primary,
                  minWidth: 80,
                  textAlign: 'center',
                }}>
                  {cigarettesPerDay}
                </Text>
                
                <TouchableOpacity
                  onPress={() => {
                    const newValue = Math.min(100, cigarettesPerDay + 1);
                    setCigarettesPerDay(newValue);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.buttonBg,
                    borderWidth: 1,
                    borderColor: colors.buttonBorder,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preis pro Woche */}
            <View style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              backdropFilter: 'blur(10px)',
            }}>
              <Text style={{
                fontSize: 18,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.textPrimary,
                marginBottom: 20,
                textAlign: 'center',
              }}>
                Wie viel gibst du pro Woche aus?
              </Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
              }}>
                <TouchableOpacity
                  onPress={() => {
                    const newValue = Math.max(5, pricePerWeek - 5);
                    setPricePerWeek(newValue);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.buttonBg,
                    borderWidth: 1,
                    borderColor: colors.buttonBorder,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>-</Text>
                </TouchableOpacity>
                
                <Text style={{
                  fontSize: 48,
                  fontFamily: 'Inter_700Bold',
                  color: colors.primary,
                  minWidth: 100,
                  textAlign: 'center',
                }}>
                  €{pricePerWeek}
                </Text>
                
                <TouchableOpacity
                  onPress={() => {
                    const newValue = Math.min(500, pricePerWeek + 5);
                    setPricePerWeek(newValue);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.buttonBg,
                    borderWidth: 1,
                    borderColor: colors.buttonBorder,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      );
    }
    
    // Standard screens
    return (
      <View style={{ 
        alignItems: 'center', 
        paddingHorizontal: 20,
        paddingTop: height * 0.2,
      }}>
        {/* Animated Icon */}
        <Animated.View
          style={{
            transform: [
              {
                scale: iconAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              },
            ],
          }}
        >
          <Text style={{ fontSize: 100, marginBottom: 40 }}>{data.image}</Text>
        </Animated.View>
        
        <Text style={{
          fontSize: 36,
          fontFamily: 'Poppins_700Bold',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 16,
          lineHeight: 42,
        }}>
          {data.title}
        </Text>
        
        <Text style={{
          fontSize: 20,
          fontFamily: 'Poppins_600SemiBold',
          color: colors.primary,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          {data.subtitle}
        </Text>
        
        <Text style={{
          fontSize: 18,
          fontFamily: 'Poppins_400Regular',
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 28,
          maxWidth: 320,
        }}>
          {data.description}
        </Text>
      </View>
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={onboardingData[currentStep].gradient}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar style="light" />
        
        {/* Progress Bar */}
        {renderProgressBar()}
        
        {/* Content */}
        <View style={{ flex: 1 }}>
          <Animated.View
            style={{
              flexDirection: 'row',
              transform: [{ translateX: slideAnimation }],
            }}
          >
            {onboardingData.map((_, index) => (
              <View key={index} style={{ width, alignItems: 'center' }}>
                {renderStepContent(index)}
              </View>
            ))}
          </Animated.View>
        </View>
        
        {/* Navigation */}
        <View style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
          gap: 16,
        }}>
          {currentStep > 0 && (
            <TouchableOpacity
              onPress={handlePrevious}
              style={{
                backgroundColor: 'transparent',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.buttonBorder,
              }}
            >
              <Text style={{
                fontSize: 16,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.textSecondary,
              }}>
                Zurück
              </Text>
            </TouchableOpacity>
          )}
          
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              onPress={handleNext}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                shadowColor: colors.primary,
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
                {currentStep === onboardingData.length - 1 ? 'Los geht\'s! 🚀' : 'Weiter'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}