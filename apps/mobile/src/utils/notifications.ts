import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quitData } from './quitData';
import { getRandomQuote } from './quotes';

// Konfiguration für Benachrichtigungen
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHECKIN_STORAGE_KEY = 'notification_settings_checkin';
const MOTIVATION_STORAGE_KEY = 'notification_settings_motivation';
const LAST_REFILL_KEY = 'notification_last_refill_date';

const CHECKIN_ID = 'daily_checkin_reminder';
const MOTIVATION_ID_PREFIX = 'daily_motivation_reminder_';
const LATE_REMINDER_ID = 'daily_late_check';
const MILESTONE_ID_PREFIX = 'milestone_hype_';

export const notificationService = {
  // Initialisierung der Benachrichtigungen
  async initialize() {
    try {
      if (!Device.isDevice) {
        // console.log('Push notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  },

  // --- LATE REMINDER (23:00 Uhr - Nur wenn noch nicht eingecheckt) ---

  async scheduleLateReminder() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      // Check if already handled today
      const todayStatus = await quitData.getDayStatus();
      if (todayStatus) {
        // Wenn heute schon Status gesetzt, planen wir den Reminder für MORGEN 23:00
        await this.resolveLateReminder();
        return;
      }

      await Notifications.cancelScheduledNotificationAsync(LATE_REMINDER_ID);

      // EXAKTES Datum für HEUTE 23:00 finden (um immediate fires zu verhindern)
      const triggerDate = new Date();
      triggerDate.setHours(23, 0, 0, 0);

      // Falls es schon NACH 23:00 Uhr ist, brauchen wir für heute keinen Reminder mehr planen.
      if (triggerDate.getTime() < Date.now()) {
        // Direkt für morgen planen
        await this.resolveLateReminder();
        return;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: LATE_REMINDER_ID,
        content: {
          title: 'Der Tag ist fast vorbei... 🌙',
          body: 'Vergiss nicht, deinen Erfolg heute einzutragen!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { screen: 'today' },
        },
        trigger: {
          date: triggerDate,
          type: Notifications.SchedulableTriggerInputTypes.DATE
        },
      });
    } catch (e) {
      console.log('Error scheduling late reminder:', e);
    }
  },

  async resolveLateReminder() {
    try {
      await Notifications.cancelScheduledNotificationAsync(LATE_REMINDER_ID);

      // Schedule for tomorrow 23:00 (specifically for tomorrow, avoiding immediate trigger bugs)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 0, 0, 0);

      await Notifications.scheduleNotificationAsync({
        identifier: LATE_REMINDER_ID,
        content: {
          title: 'Der Tag ist fast vorbei... 🌙',
          body: 'Vergiss nicht, deinen Erfolg heute einzutragen!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { screen: 'today' },
        },
        trigger: {
          date: tomorrow, // Einmalig morgen um 23:00
          type: Notifications.SchedulableTriggerInputTypes.DATE
        },
      });

    } catch (e) {
      console.log('Error resolving late reminder:', e);
    }
  },

  async scheduleMilestoneReminder(days) {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + 1);
      triggerDate.setHours(9, 0, 0, 0);

      let title = "Großer Tag voraus! 🚀";
      let body = `Morgen erreichst du ${days} Tage rauchfrei! Bleib stark!`;

      if (days === 7) {
        title = "Eine Woche fast geschafft! 🎉";
        body = "Morgen ist es soweit: 1 Woche rauchfrei! Du bist großartig.";
      } else if (days === 30) {
        title = "Fast 1 Monat! 🌟";
        body = "Nur noch 1 Tag bis zum 1-Monats-Meilenstein. Unglaublich!";
      } else if (days === 365) {
        title = "Das Jahr ist fast voll! 🏆";
        body = "Morgen bist du 1 Jahr rauchfrei. Eine Legende!";
      }

      await Notifications.scheduleNotificationAsync({
        identifier: `${MILESTONE_ID_PREFIX}${days}`,
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { screen: 'streak' },
        },
        trigger: {
          date: triggerDate,
          type: Notifications.SchedulableTriggerInputTypes.DATE
        },
      });

    } catch (e) {
      console.log('Error scheduling milestone:', e);
    }
  },

  // --- CHECK-IN (Abends) ---

  async getCheckinSettings() {
    try {
      const settings = await AsyncStorage.getItem(CHECKIN_STORAGE_KEY);
      // Standard: 18:00 Uhr, Aktiviert
      return settings ? JSON.parse(settings) : { enabled: true, time: { hour: 18, minute: 0 } };
    } catch (error) {
      return { enabled: true, time: { hour: 18, minute: 0 } };
    }
  },

  async setCheckinEnabled(enabled) {
    const settings = await this.getCheckinSettings();
    settings.enabled = enabled;
    await AsyncStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(settings));

    if (enabled) await this.scheduleCheckin(settings.time);
    else await Notifications.cancelScheduledNotificationAsync(CHECKIN_ID);

    return true;
  },

  async setCheckinTime(hour, minute) {
    const settings = await this.getCheckinSettings();
    settings.time = { hour, minute };
    await AsyncStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(settings));

    if (settings.enabled) await this.scheduleCheckin(settings.time);
    return true;
  },

  async scheduleCheckin({ hour, minute }) {
    await Notifications.cancelScheduledNotificationAsync(CHECKIN_ID);

    // Vermeide den (hour/minute, repeats: true) Bug von Expo/iOS, 
    // der sofort feuert, falls die Checkin-Notification beim Start neu geplant wird.
    // Wir berechnen den korrekten nächten Zeitpunkt.

    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);

    // Wenn die Zeit für heute bereits vorbei ist, plane für morgen
    if (triggerDate.getTime() <= Date.now()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      identifier: CHECKIN_ID,
      content: {
        title: 'Wie war dein Tag? 🌙',
        body: 'Nimm dir kurz Zeit für dich.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { screen: 'today' },
      },
      trigger: {
        date: triggerDate,
        type: Notifications.SchedulableTriggerInputTypes.DATE
      }, // Einmalig (wird beim täglichen App-Start "initializeOnAppStart" wiederholt)
    });
  },

  // --- MOTIVATION (Smart Random) ---

  async getMotivationSettings() {
    try {
      const settings = await AsyncStorage.getItem(MOTIVATION_STORAGE_KEY);
      // Enabled by default
      return settings ? JSON.parse(settings) : { enabled: true };
    } catch (error) {
      return { enabled: true };
    }
  },

  async setMotivationEnabled(enabled) {
    const settings = await this.getMotivationSettings();
    settings.enabled = enabled;
    await AsyncStorage.setItem(MOTIVATION_STORAGE_KEY, JSON.stringify(settings));

    if (enabled) {
      await this.refillNotifications();
    } else {
      await this.cancelAllMotivations();
    }

    return true;
  },

  // Helper: Cancel all planned motivation notifications
  async cancelAllMotivations() {
    try {
      // We cancel all notifications that start with our ID prefix
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduled) {
        if (notification.identifier.startsWith(MOTIVATION_ID_PREFIX)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (e) {
      console.log('Error cancelling motivations:', e);
    }
  },

  // Main Logic: Schedule random times for the next 7 days
  async refillNotifications() {
    try {
      // 1. Check if enabled
      const settings = await this.getMotivationSettings();
      if (!settings.enabled) return;

      // 2. Check frequency (Don't refill if done recently)
      const lastRefill = await AsyncStorage.getItem(LAST_REFILL_KEY);
      const now = new Date();

      if (lastRefill) {
        const lastRefillDate = new Date(lastRefill);
        const diffTime = Math.abs(now - lastRefillDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Wenn vor weniger als 4 Tagen aufgefüllt wurde, abbrechen.
        // Wir planen 7 Tage im Voraus, also ist Puffer da.
        if (diffDays < 4) {
          // console.log('Skipping notification refill, recently updated.');
          return;
        }
      }

      // 3. Cancel old ones to prevent duplicates
      await this.cancelAllMotivations();

      // 4. Schedule for next 7 days

      for (let i = 1; i <= 7; i++) {
        const day = new Date(now);
        day.setDate(day.getDate() + i); // Future days

        // Slot 1: 10:00 - 14:00
        const hour1 = 10 + Math.floor(Math.random() * 4); // 10, 11, 12, 13
        const min1 = Math.floor(Math.random() * 60);

        await this.scheduleSingleMotivation(day, hour1, min1, i * 2 - 1);

        // Slot 2: 16:00 - 20:00
        const hour2 = 16 + Math.floor(Math.random() * 4); // 16, 17, 18, 19
        const min2 = Math.floor(Math.random() * 60);

        await this.scheduleSingleMotivation(day, hour2, min2, i * 2);
      }

      // Update timestamp
      await AsyncStorage.setItem(LAST_REFILL_KEY, now.toISOString());

    } catch (e) {
      console.log('Error refilling notifications:', e);
    }
  },

  async scheduleSingleMotivation(dateObj, hour, minute, index) {
    const triggerDate = new Date(dateObj);
    triggerDate.setHours(hour, minute, 0, 0);

    const quote = getRandomQuote();

    await Notifications.scheduleNotificationAsync({
      identifier: `${MOTIVATION_ID_PREFIX}${index}`, // Unique ID per slot
      content: {
        title: '✨ Dein täglicher Impuls',
        body: quote,
        sound: 'default',
        data: { screen: 'today' },
      },
      trigger: {
        date: triggerDate,
        type: Notifications.SchedulableTriggerInputTypes.DATE
      }, // Trigger at specific date/time
    });
  },

  // --- GLOBAL ---

  async requestPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async getPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  },

  async initializeOnAppStart() {
    const success = await this.initialize();
    if (success) {
      // Stelle sicher, dass der Late Reminder läuft
      await this.scheduleLateReminder();
    }
    return success;
  },
};
