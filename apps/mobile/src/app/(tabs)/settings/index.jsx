import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import { useFocusEffect } from '@react-navigation/native';
import { quitData } from '@/utils/quitData';
import { notificationService } from '@/utils/notifications';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState('undetermined');
  const [notificationTime, setNotificationTime] = useState({ hour: 18, minute: 0 });
  const [cigarettesPerDay, setCigarettesPerDay] = useState(20);
  const [pricePerWeek, setPricePerWeek] = useState(45.50);
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const loadSettings = useCallback(async () => {
    try {
      const settings = await quitData.getSettings();
      
      if (settings) {
        setCigarettesPerDay(settings.cigarettesPerDay || 20);
        setPricePerWeek(settings.pricePerWeek || 45.50);
      }

      // Lade Benachrichtigungseinstellungen
      const enabled = await notificationService.areNotificationsEnabled();
      setPushNotificationsEnabled(enabled);
      
      const permission = await notificationService.getPermissionStatus();
      setNotificationPermission(permission);
      
      const time = await notificationService.getNotificationTime();
      setNotificationTime(time);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      const settings = {
        cigarettesPerDay,
        pricePerWeek,
        motivationalQuotes: true,
        dailyNotification: true,
        darkModeEnabled: true,
      };
      await quitData.setSettings(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [cigarettesPerDay, pricePerWeek]);

  const handleTogglePushNotifications = useCallback(async (value) => {
    if (value) {
      const success = await notificationService.requestPermissions();
      if (success) {
        setPushNotificationsEnabled(true);
        await notificationService.scheduleDailyNotificationForTomorrow();
      } else {
        Alert.alert(
          'Berechtigung erforderlich',
          'Um Push-Benachrichtigungen zu aktivieren, müssen Sie die Berechtigung in den Einstellungen erteilen.',
          [{ text: 'OK' }]
        );
      }
    } else {
      await notificationService.cancelDailyNotification();
      setPushNotificationsEnabled(false);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleTimeChange = useCallback(async (hour, minute) => {
    await notificationService.setNotificationTime(hour, minute);
    setNotificationTime({ hour, minute });
    
    // Plane Benachrichtigung für morgen mit neuer Zeit
    if (pushNotificationsEnabled) {
      await notificationService.scheduleDailyNotificationForTomorrow();
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [pushNotificationsEnabled]);

  const handleResetOnboarding = useCallback(() => {
    Alert.alert(
      'Onboarding zurücksetzen',
      'Möchten Sie das Onboarding erneut durchlaufen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zurücksetzen',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('app_onboarded', 'false');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              Alert.alert('Erfolgreich', 'Das Onboarding wurde zurückgesetzt. Starten Sie die App neu.');
            } catch (error) {
              console.error('Error resetting onboarding:', error);
              Alert.alert('Fehler', 'Beim Zurücksetzen des Onboardings ist ein Fehler aufgetreten.');
            }
          },
        },
      ]
    );
  }, []);

  const handleResetData = useCallback(() => {
    Alert.alert(
      'Daten zurücksetzen',
      'Möchten Sie wirklich alle Daten zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zurücksetzen',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'smoking_quit_checkins',
                'smoking_quit_start_date',
                'smoking_quit_reminders',
                'smoking_quit_settings',
                'app_onboarded',
              ]);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              Alert.alert('Erfolgreich', 'Alle Daten wurden zurückgesetzt.');
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Fehler', 'Beim Zurücksetzen der Daten ist ein Fehler aufgetreten.');
            }
          },
        },
      ]
    );
  }, []);

  const fadeIn = useCallback(() => {
    fadeAnimation.setValue(0);
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnimation]);

  useFocusEffect(
    useCallback(() => {
      fadeIn();
      loadSettings();
    }, [fadeIn, loadSettings]),
  );

  useEffect(() => {
    saveSettings();
  }, [saveSettings]);

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

  const colors = {
    background: ['#0A0F0A', '#0F1A0F', '#0A0F0A'],
    cardBackground: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.1)',
    buttonBg: 'rgba(255, 255, 255, 0.1)',
    buttonBorder: 'rgba(255, 255, 255, 0.2)',
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background[0] }}>
      <LinearGradient
        colors={colors.background}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar style="light" />

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
            {/* Benachrichtigungen */}
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
                Benachrichtigungen
              </Text>

              <View style={{ gap: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins_600SemiBold',
                        color: colors.textPrimary,
                      }}
                    >
                      Push-Benachrichtigungen
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      Tägliche Erinnerungen um {notificationTime.hour}:{notificationTime.minute.toString().padStart(2, '0')} Uhr
                    </Text>
                    {notificationPermission === 'denied' && (
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Poppins_400Regular',
                          color: '#FF6C6C',
                          marginTop: 2,
                        }}
                      >
                        Berechtigung verweigert - bitte in den Einstellungen aktivieren
                      </Text>
                    )}
                  </View>
                  <Switch
                    value={pushNotificationsEnabled}
                    onValueChange={handleTogglePushNotifications}
                    trackColor={{ false: '#767577', true: colors.success }}
                    thumbColor={pushNotificationsEnabled ? '#FFFFFF' : '#f4f3f4'}
                  />
                </View>

                {pushNotificationsEnabled && (
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins_600SemiBold',
                        color: colors.textPrimary,
                        marginBottom: 12,
                      }}
                    >
                      Benachrichtigungszeit
                    </Text>
                    
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 20,
                      }}
                    >
                      {/* Stunden */}
                      <View style={{ alignItems: 'center', gap: 8 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Poppins_400Regular',
                            color: colors.textSecondary,
                          }}
                        >
                          Stunde
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              const newHour = notificationTime.hour - 1;
                              handleTimeChange(newHour < 0 ? 23 : newHour, notificationTime.minute);
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: colors.buttonBg,
                              borderWidth: 1,
                              borderColor: colors.buttonBorder,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>-</Text>
                          </TouchableOpacity>
                          
                          <Text
                            style={{
                              fontSize: 24,
                              fontFamily: 'Poppins_600SemiBold',
                              color: colors.textPrimary,
                              minWidth: 40,
                              textAlign: 'center',
                            }}
                          >
                            {notificationTime.hour.toString().padStart(2, '0')}
                          </Text>
                          
                          <TouchableOpacity
                            onPress={() => {
                              const newHour = notificationTime.hour + 1;
                              handleTimeChange(newHour > 23 ? 0 : newHour, notificationTime.minute);
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: colors.buttonBg,
                              borderWidth: 1,
                              borderColor: colors.buttonBorder,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text
                        style={{
                          fontSize: 24,
                          fontFamily: 'Poppins_600SemiBold',
                          color: colors.textPrimary,
                        }}
                      >
                        :
                      </Text>

                      {/* Minuten */}
                      <View style={{ alignItems: 'center', gap: 8 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Poppins_400Regular',
                            color: colors.textSecondary,
                          }}
                        >
                          Minute
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              const newMinute = notificationTime.minute - 15;
                              handleTimeChange(notificationTime.hour, newMinute < 0 ? 45 : newMinute);
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: colors.buttonBg,
                              borderWidth: 1,
                              borderColor: colors.buttonBorder,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>-</Text>
                          </TouchableOpacity>
                          
                          <Text
                            style={{
                              fontSize: 24,
                              fontFamily: 'Poppins_600SemiBold',
                              color: colors.textPrimary,
                              minWidth: 40,
                              textAlign: 'center',
                            }}
                          >
                            {notificationTime.minute.toString().padStart(2, '0')}
                          </Text>
                          
                          <TouchableOpacity
                            onPress={() => {
                              const newMinute = notificationTime.minute + 15;
                              handleTimeChange(notificationTime.hour, newMinute > 45 ? 0 : newMinute);
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: colors.buttonBg,
                              borderWidth: 1,
                              borderColor: colors.buttonBorder,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Rauchgewohnheiten */}
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
                Rauchgewohnheiten
              </Text>

              <View style={{ gap: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins_600SemiBold',
                        color: colors.textPrimary,
                      }}
                    >
                      Zigaretten pro Tag
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      Für Berechnungen verwendet
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        const newValue = Math.max(1, cigarettesPerDay - 1);
                        setCigarettesPerDay(newValue);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.buttonBg,
                        borderWidth: 1,
                        borderColor: colors.buttonBorder,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>-</Text>
                    </TouchableOpacity>
                    
                    <Text
                      style={{
                        fontSize: 18,
                        fontFamily: 'Poppins_600SemiBold',
                        color: colors.textPrimary,
                        minWidth: 30,
                        textAlign: 'center',
                      }}
                    >
                      {cigarettesPerDay}
                    </Text>
                    
                    <TouchableOpacity
                      onPress={() => {
                        const newValue = Math.min(100, cigarettesPerDay + 1);
                        setCigarettesPerDay(newValue);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.buttonBg,
                        borderWidth: 1,
                        borderColor: colors.buttonBorder,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins_600SemiBold',
                        color: colors.textPrimary,
                      }}
                    >
                      Preis pro Woche (€)
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins_400Regular',
                        color: colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      Für Sparberechnungen verwendet
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        const newValue = Math.max(5, pricePerWeek - 5);
                        setPricePerWeek(newValue);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.buttonBg,
                        borderWidth: 1,
                        borderColor: colors.buttonBorder,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>-</Text>
                    </TouchableOpacity>
                    
                    <Text
                      style={{
                        fontSize: 18,
                        fontFamily: 'Poppins_600SemiBold',
                        color: colors.textPrimary,
                        minWidth: 50,
                        textAlign: 'center',
                      }}
                    >
                      {pricePerWeek.toFixed(2)}
                    </Text>
                    
                    <TouchableOpacity
                      onPress={() => {
                        const newValue = Math.min(500, pricePerWeek + 5);
                        setPricePerWeek(newValue);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.buttonBg,
                        borderWidth: 1,
                        borderColor: colors.buttonBorder,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Datenverwaltung */}
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
                Datenverwaltung
              </Text>

              <TouchableOpacity
                onPress={handleResetData}
                style={{
                  backgroundColor: '#FF6C6C',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins_600SemiBold',
                    color: '#FFFFFF',
                  }}
                >
                  Alle Daten zurücksetzen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResetOnboarding}
                style={{
                  backgroundColor: colors.buttonBg,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.buttonBorder,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.textPrimary,
                  }}
                >
                  Onboarding erneut durchlaufen
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}