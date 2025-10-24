import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CHECK_INS: 'smoking_quit_checkins',
  START_DATE: 'smoking_quit_start_date',
  REMINDERS: 'smoking_quit_reminders',
  SETTINGS: 'smoking_quit_settings',
};


const normalizeDateInput = (date = new Date()) => {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString().split('T')[0];
};

const getDaysBetween = (from, to) => {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const normalizeCheckIns = async (raw) => {
  let parsed = {};
  let mutated = false;

  try {
    parsed = JSON.parse(raw || '{}') || {};
  } catch {
    parsed = {};
    mutated = true;
  }

  Object.entries(parsed).forEach(([key, value]) => {
    if (typeof value === 'string') {
      parsed[key] = {
        status: 'success',
        timestamp: value,
      };
      mutated = true;
    } else if (value && typeof value === 'object') {
      if (!value.status) {
        parsed[key] = {
          ...value,
          status: 'success',
        };
        mutated = true;
      } else if (value.status !== 'success' && value.status !== 'smoked') {
        parsed[key] = {
          ...value,
          status: 'success',
        };
        mutated = true;
      }
    } else {
      parsed[key] = {
        status: 'success',
        timestamp: new Date().toISOString(),
      };
      mutated = true;
    }
  });

  return { parsed, mutated };
};

export const quitData = {
  // Initialize app data
  async init() {
    try {
      const startDate = await AsyncStorage.getItem(STORAGE_KEYS.START_DATE);
      if (!startDate) {
        const today = normalizeDateInput();
        await AsyncStorage.setItem(STORAGE_KEYS.START_DATE, today);
        await AsyncStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify({}));
        await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify([]));
        await AsyncStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify({
            motivationalQuotes: true,
            dailyNotification: true,
          }),
        );
      }
    } catch (error) {
      console.error('Error initializing quit data:', error);
    }
  },

  async setCheckIns(checkIns) {
    await AsyncStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(checkIns));
  },

  async setDayStatus(date, status) {
    try {
      const dateKey = normalizeDateInput(date);
      const { parsed: checkIns } = await this.getCheckInsInternal();

      if (!status) {
        delete checkIns[dateKey];
      } else {
        const timestamp = new Date().toISOString();
        checkIns[dateKey] = {
          ...(checkIns[dateKey] || {}),
          status,
          timestamp,
        };
      }

      await this.setCheckIns(checkIns);
      return true;
    } catch (error) {
      console.error('Error setting day status:', error);
      return false;
    }
  },

  async getCheckInsInternal() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.CHECK_INS);
      const { parsed, mutated } = await normalizeCheckIns(raw);
      if (mutated) {
        await this.setCheckIns(parsed);
      }
      return { parsed };
    } catch (error) {
      console.error('Error normalizing check-ins:', error);
      return { parsed: {} };
    }
  },


  // Record today's check-in
  async checkInToday() {
    try {
      const today = normalizeDateInput();
      await this.setDayStatus(today, 'success');
      
      return true;
    } catch (error) {
      console.error('Error checking in:', error);
      return false;
    }
  },

  async markDayAsSmoked(date = new Date()) {
    try {
      const dayKey = normalizeDateInput(date);
      await this.setDayStatus(dayKey, 'smoked');
      
      return true;
    } catch (error) {
      console.error('Error marking day as smoked:', error);
      return false;
    }
  },

  async getDayStatus(date = new Date()) {
    try {
      const dayKey = normalizeDateInput(date);
      const { parsed } = await this.getCheckInsInternal();
      return parsed[dayKey]?.status || null;
    } catch (error) {
      console.error('Error getting day status:', error);
      return null;
    }
  },

  // Get all check-ins
  async getCheckIns() {
    const { parsed } = await this.getCheckInsInternal();
    return parsed;
  },

  // Check if already checked in today
  async isCheckedInToday() {
    try {
      const status = await this.getDayStatus();
      return status === 'success';
    } catch (error) {
      console.error('Error checking today status:', error);
      return false;
    }
  },

  // Get start date
  async getStartDate() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.START_DATE);
    } catch (error) {
      console.error('Error getting start date:', error);
      return null;
    }
  },

  // Calculate current streak
  async getCurrentStreak() {
    try {
      const startDate = await this.getStartDate();
      const checkIns = await this.getCheckIns();
      
      if (!startDate) return 0;

      let streak = 0;
      let currentDate = new Date();

      while (true) {
        const dateStr = normalizeDateInput(currentDate);
        const status = checkIns[dateStr]?.status;
        if (status === 'success') {
          streak += 1;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  },

  // Calculate longest streak
  async getLongestStreak() {
    try {
      const checkIns = await this.getCheckIns();
      const dates = Object.keys(checkIns).sort();

      if (dates.length === 0) return 0;

      let longestStreak = 0;
      let currentStreak = 0;
      let previousDate = null;

      dates.forEach((dateStr) => {
        const status = checkIns[dateStr]?.status;
        if (status !== 'success') {
          currentStreak = 0;
          previousDate = null;
          return;
        }

        const currentDate = new Date(dateStr);
        if (previousDate) {
          const diffTime = currentDate - previousDate;
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }

        longestStreak = Math.max(longestStreak, currentStreak);
        previousDate = currentDate;
      });

      return longestStreak;
    } catch (error) {
      console.error('Error calculating longest streak:', error);
      return 0;
    }
  },

  // Get total days since start
  async getTotalDaysSinceStart() {
    try {
      const checkIns = await this.getCheckIns();
      
      // Zähle alle Tage mit Check-ins (egal ob success oder smoked)
      const totalDays = Object.keys(checkIns).length;
      
      return totalDays;
    } catch (error) {
      console.error('Error calculating total days:', error);
      return 0;
    }
  },

  // Get check-ins for a specific month
  async getMonthCheckIns(date = new Date()) {
    try {
      const checkIns = await this.getCheckIns();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');

      const monthCheckIns = {};
      Object.keys(checkIns).forEach((dateStr) => {
        if (dateStr.startsWith(`${year}-${month}`)) {
          const day = parseInt(dateStr.split('-')[2], 10);
          if (Number.isFinite(day)) {
            monthCheckIns[day] = checkIns[dateStr]?.status || null;
          }
        }
      });

      return monthCheckIns;
    } catch (error) {
      console.error('Error getting month check-ins:', error);
      return {};
    }
  },

  // Add reminder
  async addReminder(time) {
    try {
      const reminders = await this.getReminders();
      if (!reminders.includes(time)) {
        reminders.push(time);
        reminders.sort();
        await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
      }
      return reminders;
    } catch (error) {
      console.error('Error adding reminder:', error);
      return [];
    }
  },

  // Remove reminder
  async removeReminder(time) {
    try {
      const reminders = await this.getReminders();
      const filtered = reminders.filter((r) => r !== time);
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
      return filtered;
    } catch (error) {
      console.error('Error removing reminder:', error);
      return [];
    }
  },

  // Get all reminders
  async getReminders() {
    try {
      const reminders = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      return JSON.parse(reminders || '[]');
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  },

  // Get settings
  async getSettings() {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return JSON.parse(settings || '{}');
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  },

  // Update settings
  async updateSettings(updates) {
    try {
      const settings = await this.getSettings();
      const updated = { ...settings, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error updating settings:', error);
      return {};
    }
  },

  // Set settings (alias for updateSettings)
  async setSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return settings;
    } catch (error) {
      console.error('Error setting settings:', error);
      return {};
    }
  },

  // Reset all data
  async resetAllData() {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      await this.init();
      return true;
    } catch (error) {
      console.error('Error resetting data:', error);
      return false;
    }
  },
};
