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
let initPromise: Promise<boolean> | null = null;

interface CheckInStatus {
  status: 'success' | 'smoked';
  timestamp: string;
}

interface CheckIns {
  [date: string]: CheckInStatus;
}

interface Settings {
  motivationalQuotes?: boolean;
  dailyNotification?: boolean;
  cigarettesPerDay?: number;
  pricePerPack?: number;
  cigarettesPerPack?: number;
  yearsSmoked?: number;
  monthsSmoked?: number;
}

interface OnboardingData {
  hasPaid?: boolean;
  onboardingDate?: string;
  cigarettesPerDay?: number;
  pricePerPack?: number;
  cigarettesPerPack?: number;
  yearsSmoked?: number;
  monthsSmoked?: number;
}

interface GoldenWeekData {
  status: 'not_started' | 'active' | 'completed' | 'failed';
  startDate: string | null;
  progress: number;
  lastCompletionDate: string | null;
  introSeen: boolean;
}

const normalizeDateInput = (date: Date | string = new Date()) => {
  if (typeof date === 'string') {
    return date;
  }
  // Use local date instead of UTC to avoid timezone bugs
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysBetween = (from: string | Date, to: string | Date) => {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const normalizeCheckIns = async (raw: string | null) => {
  let parsed: CheckIns = {};
  let mutated = false;

  try {
    parsed = JSON.parse(raw || '{}') || {};
  } catch {
    parsed = {};
    mutated = true;
  }

  // Type assertion for raw object iteration
  const rawObj = parsed as any;
  const newParsed: CheckIns = {};

  Object.entries(rawObj).forEach(([key, value]: [string, any]) => {
    if (typeof value === 'string') {
      newParsed[key] = {
        status: 'success',
        timestamp: value,
      };
      mutated = true;
    } else if (value && typeof value === 'object') {
      if (!value.status) {
        newParsed[key] = {
          ...value,
          status: 'success',
        };
        mutated = true;
      } else if (value.status !== 'success' && value.status !== 'smoked') {
        newParsed[key] = {
          ...value,
          status: 'success',
        };
        mutated = true;
      } else {
        newParsed[key] = value;
      }
    } else {
      newParsed[key] = {
        status: 'success',
        timestamp: new Date().toISOString(),
      };
      mutated = true;
    }
  });

  return { parsed: newParsed, mutated };
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

  async setCheckIns(checkIns: CheckIns) {
    await AsyncStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(checkIns));
  },

  async setDayStatus(date: Date | string, status: 'success' | 'smoked' | null) {
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
      return { parsed: {} as CheckIns };
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

  async markDayAsSmoked(date: Date | string = new Date()) {
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

  async getDayStatus(date: Date | string = new Date()) {
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
      let previousDateStr: string | null = null;

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
          const diffTime = curr.getTime() - prev.getTime();
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
  async getMonthCheckIns(date = new Date()): Promise<{ [day: number]: string | null }> {
    try {
      const checkIns = await this.getCheckIns();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');

      const monthCheckIns: { [day: number]: string | null } = {};
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
  async addReminder(time: string) {
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
  async removeReminder(time: string) {
    try {
      const reminders = await this.getReminders();
      const filtered = reminders.filter((r: string) => r !== time);
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
  async getSettings(): Promise<Settings> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return JSON.parse(settings || '{}');
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  },

  // Update settings
  async updateSettings(updates: Settings) {
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
  async setSettings(settings: Settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return settings;
    } catch (error) {
      console.error('Error setting settings:', error);
      return {};
    }
  },

  // Get onboarding data
  async getOnboardingData(): Promise<OnboardingData> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
      return JSON.parse(data || '{}');
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return {};
    }
  },

  // Set onboarding data
  async setOnboardingData(data: OnboardingData) {
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
      } catch (networkError: any) {
        // RevenueCat check failed (network issue, init failed, etc.)
        console.warn('RevenueCat check failed, using local fallback:', networkError?.message);

        // OFFLINE FALLBACK: Trust local flag if network is down
        // This allows legitimate users to use app offline
        return localHasPaid;
      }
    } catch (error) {
      console.error('Critical error in isProUser:', error);
      return false;
    }
  },

  // Check if user has completed the onboarding flow (regardless of payment status).
  // Used to decide: show paywall (onboarded but not paid) vs. show full onboarding (never started).
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const data = await this.getOnboardingData();
      // onboardingDate is set at the END of the onboarding steps, just before the paywall.
      // If it exists, the user has been through onboarding.
      return !!data.onboardingDate;
    } catch (error) {
      console.error('Error checking onboarding completion:', error);
      return false;
    }
  },

  // --- GOLDEN WEEK CHALLENGE (NEW) ---

  async getGoldenWeek(): Promise<GoldenWeekData> {
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
    const newState: GoldenWeekData = { ...current, introSeen: true };
    await AsyncStorage.setItem(STORAGE_KEYS.GOLDEN_WEEK, JSON.stringify(newState));
    return newState;
  },

  async startGoldenWeek() {
    const state: GoldenWeekData = {
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
    const newState: GoldenWeekData = {
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
    const newState: GoldenWeekData = { ...current, status: 'failed' };
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

