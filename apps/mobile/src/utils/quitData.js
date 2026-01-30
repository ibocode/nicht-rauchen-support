import AsyncStorage from '@react-native-async-storage/async-storage';
import { purchaseService } from './purchases';

const STORAGE_KEYS = {
  CHECK_INS: 'smoking_quit_checkins',
  START_DATE: 'smoking_quit_start_date',
  REMINDERS: 'smoking_quit_reminders',
  SETTINGS: 'smoking_quit_settings',
  ONBOARDING: 'smoking_quit_onboarding',
  GOLDEN_WEEK: 'smoking_quit_golden_week', // NEU
};

// CRITICAL: Initialization lock to prevent race conditions
let isInitialized = false;
let initPromise = null;


const normalizeDateInput = (date = new Date()) => {
  if (typeof date === 'string') {
    return date;
  }
  // Use local date instead of UTC to avoid timezone bugs
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    // CRITICAL: Prevent multiple simultaneous init calls
    if (isInitialized) {
      return true; // Already initialized
    }
    
    if (initPromise) {
      // Init already in progress, wait for it
      return await initPromise;
    }
    
    initPromise = (async () => {
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
        isInitialized = true;
        return true;
      } catch (error) {
        console.error('Error initializing quit data:', error);
        return false;
      } finally {
        initPromise = null;
      }
    })();
    
    return await initPromise;
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
      
      // Self-healing: If setting to success and no start date exists, set it now.
      if (status === 'success') {
        const startDate = await this.getStartDate();
        if (!startDate) {
           await AsyncStorage.setItem(STORAGE_KEYS.START_DATE, dateKey);
        }
      }
      
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
      
      // Check if Golden Week is active and fail it
      const goldenWeek = await this.getGoldenWeek();
      if (goldenWeek.status === 'active') {
        await this.failGoldenWeek();
      }
      
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
      let checkDate = new Date();

      // 1. Prüfe Heute
      const todayKey = normalizeDateInput(checkDate);
      const todayStatus = checkIns[todayKey]?.status;

      if (todayStatus === 'success') {
        streak += 1;
      } else if (todayStatus === 'smoked') {
        // Wenn heute geraucht wurde, ist die Streak definitiv 0
        return 0;
      }
      // Wenn heute noch kein Status da ist (undefined), ist die Streak NICHT gebrochen.
      // Wir schauen einfach, was gestern war.

      // 2. Prüfe die Vergangenheit (ab Gestern)
      checkDate.setDate(checkDate.getDate() - 1);

      // Safety: Max 3650 days (10 years) to prevent infinite loop
      const maxIterations = 3650;
      let iterations = 0;
      
      const startDateObj = new Date(startDate);
      
      while (iterations < maxIterations) {
        // Stop if we've reached the start date
        if (checkDate < startDateObj) {
          break;
        }
        
        const dateStr = normalizeDateInput(checkDate);
        const status = checkIns[dateStr]?.status;
        
        if (status === 'success') {
          streak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // Sobald ein Tag in der Vergangenheit fehlt oder 'smoked' ist, endet die Streak
          break;
        }
        
        iterations++;
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
      let previousDateStr = null;

      dates.forEach((dateStr) => {
        const status = checkIns[dateStr]?.status;
        if (status !== 'success') {
          currentStreak = 0;
          previousDateStr = null;
          return;
        }

        if (previousDateStr) {
          // Compare date strings directly to avoid timezone issues
          // dateStr format: "YYYY-MM-DD"
          const prev = new Date(previousDateStr + 'T00:00:00'); // Local midnight
          const curr = new Date(dateStr + 'T00:00:00'); // Local midnight
          const diffTime = curr - prev;
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
        previousDateStr = dateStr;
      });

      return longestStreak;
    } catch (error) {
      console.error('Error calculating longest streak:', error);
      return 0;
    }
  },

  // Calculate lifetime stats (independent of streak)
  async getLifetimeStats() {
    try {
      const checkIns = await this.getCheckIns();
      const settings = await this.getSettings();
      
      const cigarettesPerDay = settings.cigarettesPerDay || 20;
      const pricePerPack = settings.pricePerPack || 7.00;
      const cigarettesPerPack = settings.cigarettesPerPack || 20;

      // Count all successful days
      let totalDays = 0;
      Object.values(checkIns).forEach(day => {
        if (day.status === 'success') {
          totalDays++;
        }
      });

      const totalCigarettes = totalDays * cigarettesPerDay;
      const totalPacks = totalCigarettes / cigarettesPerPack;
      const totalMoney = totalPacks * pricePerPack;
      const lifeRegainedHours = Math.floor((totalCigarettes * 11) / 60); // 11 mins per cig

      return {
        totalDays,
        totalCigarettes,
        totalPacks: Math.floor(totalPacks * 10) / 10, // 1 decimal
        totalMoney: Math.floor(totalMoney),
        lifeRegainedHours,
      };
    } catch (error) {
      console.error('Error calculating lifetime stats:', error);
      return { totalDays: 0, totalCigarettes: 0, totalPacks: 0, totalMoney: 0, lifeRegainedHours: 0 };
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

  // Get onboarding data
  async getOnboardingData() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
      return JSON.parse(data || '{}');
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return {};
    }
  },

  // Set onboarding data
  async setOnboardingData(data) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(data));
      
      // Sync specific fields to settings for legacy compatibility if needed
      if (data.cigarettesPerDay || data.pricePerPack || data.cigarettesPerPack || data.yearsSmoked) {
        await this.updateSettings({
          cigarettesPerDay: data.cigarettesPerDay,
          pricePerPack: data.pricePerPack,
          cigarettesPerPack: data.cigarettesPerPack || 20, // Default to 20 if missing
          yearsSmoked: data.yearsSmoked,
          monthsSmoked: data.monthsSmoked || 0,
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error setting onboarding data:', error);
      return {};
    }
  },

  // Check if user has completed onboarding/paid
  async isProUser() {
    try {
      // Get local flag first (for offline scenarios)
      const data = await this.getOnboardingData();
      const localHasPaid = !!data.hasPaid;
      const onboardingDate = data.onboardingDate;
      
      // CRITICAL: Try to verify with RevenueCat for security
      // If this fails (offline/network), we fall back to local flag
      try {
        const hasActiveSubscription = await purchaseService.checkProStatus();
        
        if (hasActiveSubscription) {
          // User has active subscription - ensure local flag is set
          if (!localHasPaid) {
            // Fix inconsistency: RevenueCat says paid but local flag not set
            await this.setOnboardingData({ ...data, hasPaid: true });
          }
          return true;
        }
        
        // RevenueCat says NOT paid
        if (localHasPaid) {
          // SUSPICIOUS: Local flag says paid but RevenueCat says no
          // Could be: refund, subscription expired, or manipulation
          
          // Grace period: If user just onboarded (within last 5 minutes), give benefit of doubt
          // RevenueCat sync can take a moment
          if (onboardingDate) {
            const onboardedTime = new Date(onboardingDate).getTime();
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            
            if (now - onboardedTime < fiveMinutes) {
              console.warn('User just onboarded, giving 5min grace period for RevenueCat sync');
              return true; // Trust local flag during grace period
            }
          }
          
          // After grace period, trust RevenueCat (online) over local flag
          console.warn('RevenueCat reports no active subscription, blocking access (possible refund)');
          return false;
        }
        
        return false;
      } catch (networkError) {
        // RevenueCat check failed (network issue, init failed, etc.)
        console.warn('RevenueCat check failed, using local fallback:', networkError.message);
        
        // OFFLINE FALLBACK: Trust local flag if network is down
        // This allows legitimate users to use app offline
        return localHasPaid;
      }
    } catch (error) {
      console.error('Critical error in isProUser:', error);
      return false;
    }
  },

  // --- GOLDEN WEEK CHALLENGE (NEW) ---

  async getGoldenWeek() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.GOLDEN_WEEK);
      if (!raw) {
        return { 
          status: 'not_started',
          startDate: null,
          progress: 0,
          lastCompletionDate: null,
          introSeen: false
        };
      }
      // CRITICAL: Wrap JSON.parse in try-catch to prevent crash on corrupted data
      try {
        return JSON.parse(raw) || { 
          status: 'not_started',
          startDate: null,
          progress: 0,
          lastCompletionDate: null,
          introSeen: false
        };
      } catch (parseError) {
        console.error('Failed to parse Golden Week data, resetting:', parseError);
        return { 
          status: 'not_started',
          startDate: null,
          progress: 0,
          lastCompletionDate: null,
          introSeen: false
        };
      }
    } catch (e) {
      return { status: 'not_started', startDate: null, progress: 0, lastCompletionDate: null, introSeen: false };
    }
  },

  async setGoldenWeekIntroSeen() {
    const current = await this.getGoldenWeek();
    const newState = { ...current, introSeen: true };
    await AsyncStorage.setItem(STORAGE_KEYS.GOLDEN_WEEK, JSON.stringify(newState));
    return newState;
  },

  async startGoldenWeek() {
    const state = {
      status: 'active',
      startDate: new Date().toISOString(),
      progress: 0,
      lastCompletionDate: null,
      introSeen: false // Start with false, will be set to true by modal
    };
    await AsyncStorage.setItem(STORAGE_KEYS.GOLDEN_WEEK, JSON.stringify(state));
    return state;
  },

  async completeGoldenDay() {
    // Always read fresh state to avoid race conditions
    const current = await this.getGoldenWeek();
    if (current.status !== 'active') return current;

    const today = normalizeDateInput();
    
    // Check if already completed today (idempotent)
    // lastCompletionDate is stored as date string (YYYY-MM-DD)
    if (current.lastCompletionDate === today) {
        return current; // Already done today
    }

    // IMPORTANT: Verify user was actually smoke-free today
    const todayStatus = await this.getDayStatus(today);
    if (todayStatus !== 'success') {
        // User hasn't checked in as smoke-free today, don't allow completion
        return current;
    }

    const newProgress = current.progress + 1;
    const newState = {
      ...current,
      progress: newProgress,
      lastCompletionDate: normalizeDateInput(), // Store as date string, not ISO
      status: newProgress >= 7 ? 'completed' : 'active'
    };

    await AsyncStorage.setItem(STORAGE_KEYS.GOLDEN_WEEK, JSON.stringify(newState));
    return newState;
  },
  
  async failGoldenWeek() {
      const current = await this.getGoldenWeek();
      const newState = { ...current, status: 'failed' };
      await AsyncStorage.setItem(STORAGE_KEYS.GOLDEN_WEEK, JSON.stringify(newState));
      return newState;
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
