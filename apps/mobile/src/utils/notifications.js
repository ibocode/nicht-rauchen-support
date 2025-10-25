import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quitData } from './quitData';

// Konfiguration für Benachrichtigungen
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_STORAGE_KEY = 'notification_settings';
const NOTIFICATION_ID = 'daily_checkin_reminder';

export const notificationService = {
  // Initialisierung der Benachrichtigungen
  async initialize() {
    try {
      // Prüfe ob es ein physisches Gerät ist
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return false;
      }

      // Prüfe Berechtigungen
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Fordere Berechtigung an, falls noch nicht erteilt
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return false;
      }

      // Konfiguriere Expo Push Token (für Remote-Benachrichtigungen)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      console.log('Notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  },

  // Prüfe ob Benachrichtigungen aktiviert sind
  async areNotificationsEnabled() {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (!settings) return true; // Standard: aktiviert
      
      const parsedSettings = JSON.parse(settings);
      return parsedSettings.enabled !== false;
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return true;
    }
  },

  // Aktiviere/Deaktiviere Benachrichtigungen
  async setNotificationsEnabled(enabled) {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      const parsedSettings = settings ? JSON.parse(settings) : {};
      
      parsedSettings.enabled = enabled;
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(parsedSettings));

      if (enabled) {
        await this.scheduleDailyNotification();
      } else {
        await this.cancelDailyNotification();
      }

      return true;
    } catch (error) {
      console.error('Error setting notification preferences:', error);
      return false;
    }
  },

  // Prüfe ob heute bereits ein Check-in gemacht wurde
  async hasCheckedInToday() {
    try {
      const todayStatus = await quitData.getDayStatus();
      return todayStatus === 'success' || todayStatus === 'smoked';
    } catch (error) {
      console.error('Error checking today status:', error);
      return false;
    }
  },

  // Hole Benachrichtigungszeit aus Einstellungen
  async getNotificationTime() {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      const parsedSettings = settings ? JSON.parse(settings) : {};
      return parsedSettings.time || { hour: 18, minute: 0 }; // Standard: 18:00
    } catch (error) {
      console.error('Error getting notification time:', error);
      return { hour: 18, minute: 0 };
    }
  },

  // Setze Benachrichtigungszeit
  async setNotificationTime(hour, minute) {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      const parsedSettings = settings ? JSON.parse(settings) : {};
      
      parsedSettings.time = { hour, minute };
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(parsedSettings));
      
      // Plane Benachrichtigung neu, falls aktiviert (nur für morgen, nicht heute)
      const enabled = await this.areNotificationsEnabled();
      if (enabled) {
        await this.scheduleDailyNotificationForTomorrow();
      }
      
      return true;
    } catch (error) {
      console.error('Error setting notification time:', error);
      return false;
    }
  },

  // Plane tägliche Benachrichtigung zur gewünschten Zeit
  async scheduleDailyNotification() {
    try {
      // Lösche vorherige Benachrichtigung
      await this.cancelDailyNotification();

      // Prüfe ob Benachrichtigungen aktiviert sind
      const enabled = await this.areNotificationsEnabled();
      if (!enabled) return false;

      // Hole gewünschte Zeit aus Einstellungen
      const { hour, minute } = await this.getNotificationTime();

      // Erstelle wiederkehrende Benachrichtigung (nur für die Zukunft)
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title: '🚭 Zeit für deinen Check-in!',
          body: 'Hast du heute geraucht oder warst du stark? Teile es mit uns!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'checkin_reminder',
          data: {
            action: 'open_app',
            screen: 'today',
          },
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`Daily notification scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
      return true;
    } catch (error) {
      console.error('Error scheduling daily notification:', error);
      return false;
    }
  },

  // Lösche tägliche Benachrichtigung
  async cancelDailyNotification() {
    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
      console.log('Daily notification cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling daily notification:', error);
      return false;
    }
  },

  // Plane Benachrichtigung nur für morgen (nicht heute)
  async scheduleDailyNotificationForTomorrow() {
    try {
      // Lösche vorherige Benachrichtigung
      await this.cancelDailyNotification();

      // Prüfe ob Benachrichtigungen aktiviert sind
      const enabled = await this.areNotificationsEnabled();
      if (!enabled) return false;

      // Hole gewünschte Zeit aus Einstellungen
      const { hour, minute } = await this.getNotificationTime();

      // Erstelle Zeit für morgen
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(hour, minute, 0, 0);

      // Erstelle einmalige Benachrichtigung für morgen
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title: '🚭 Zeit für deinen Check-in!',
          body: 'Hast du heute geraucht oder warst du stark? Teile es mit uns!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'checkin_reminder',
          data: {
            action: 'open_app',
            screen: 'today',
          },
        },
        trigger: {
          type: 'date',
          date: tomorrow,
        },
      });

      console.log(`Daily notification scheduled for tomorrow at ${hour}:${minute.toString().padStart(2, '0')}`);
      return true;
    } catch (error) {
      console.error('Error scheduling daily notification for tomorrow:', error);
      return false;
    }
  },

  // Hole alle geplanten Benachrichtigungen
  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },


  // Hole Benachrichtigungseinstellungen
  async getNotificationSettings() {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      return settings ? JSON.parse(settings) : { enabled: true };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return { enabled: true };
    }
  },

  // Aktualisiere Benachrichtigungseinstellungen
  async updateNotificationSettings(updates) {
    try {
      const currentSettings = await this.getNotificationSettings();
      const newSettings = { ...currentSettings, ...updates };
      
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newSettings));
      
      // Plane Benachrichtigung neu, falls aktiviert
      if (newSettings.enabled) {
        await this.scheduleDailyNotification();
      } else {
        await this.cancelDailyNotification();
      }
      
      return newSettings;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return currentSettings;
    }
  },

  // Prüfe Berechtigungsstatus
  async getPermissionStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error getting permission status:', error);
      return 'undetermined';
    }
  },

  // Fordere Berechtigung an
  async requestPermission() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  },

  // Initialisiere Benachrichtigungen beim App-Start
  async initializeOnAppStart() {
    try {
      const initialized = await this.initialize();
      if (initialized) {
        // Lösche alle bestehenden Benachrichtigungen zuerst
        await this.cancelDailyNotification();
        
        // Plane tägliche Benachrichtigung, falls aktiviert (nur planen, nicht sofort senden)
        const enabled = await this.areNotificationsEnabled();
        if (enabled) {
          // Plane Benachrichtigung nur für morgen, nicht für heute
          await this.scheduleDailyNotificationForTomorrow();
        }
      }
      return initialized;
    } catch (error) {
      console.error('Error initializing notifications on app start:', error);
      return false;
    }
  },

  // Plane Benachrichtigung nur für morgen (nicht heute)
  async scheduleDailyNotificationForTomorrow() {
    try {
      // Lösche vorherige Benachrichtigung
      await this.cancelDailyNotification();

      // Prüfe ob Benachrichtigungen aktiviert sind
      const enabled = await this.areNotificationsEnabled();
      if (!enabled) return false;

      // Hole gewünschte Zeit aus Einstellungen
      const { hour, minute } = await this.getNotificationTime();

      // Erstelle Zeit für morgen
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(hour, minute, 0, 0);

      // Erstelle einmalige Benachrichtigung für morgen
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title: '🚭 Zeit für deinen Check-in!',
          body: 'Hast du heute geraucht oder warst du stark? Teile es mit uns!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'checkin_reminder',
          data: {
            action: 'open_app',
            screen: 'today',
          },
        },
        trigger: {
          type: 'date',
          date: tomorrow,
        },
      });

      console.log(`Daily notification scheduled for tomorrow at ${hour}:${minute.toString().padStart(2, '0')}`);
      return true;
    } catch (error) {
      console.error('Error scheduling daily notification for tomorrow:', error);
      return false;
    }
  },
};
