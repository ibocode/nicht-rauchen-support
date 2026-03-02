import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Analytics-Konstanten
const ANALYTICS_STORAGE_KEY = 'app_analytics';
const MAX_EVENTS_PER_SESSION = 100;
const MAX_SESSIONS = 50;

class AnalyticsService {
  private sessionId: string | null;
  private sessionStartTime: string | null;
  private events: Array<Record<string, any>>;
  private isEnabled: boolean;
  private userId: string | null;

  constructor() {
    this.sessionId = null;
    this.sessionStartTime = null;
    this.events = [];
    this.isEnabled = true;
    this.userId = null;
  }

  // Bereinigt Properties vor nativen Aufrufen:
  // null/undefined → 'unknown' (verhindert NSInvalidArgumentException in iOS NSDictionary)
  sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) {
        sanitized[key] = 'unknown';
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Rekursiv für verschachtelte Objekte
        sanitized[key] = this.sanitizeProperties(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // Initialisierung
  async initialize() {
    try {
      // Generiere Session ID
      this.sessionId = this.generateSessionId();
      this.sessionStartTime = new Date().toISOString();

      // Lade bestehende Analytics-Daten
      await this.loadAnalyticsData();

      // CRASH-FIX: Device.*-Werte können null sein (expo-device gibt null zurück
      // wenn das Gerät die Info nicht liefert). null in iOS NSDictionary → SIGABRT.
      // Alle Werte mit ?? 'unknown' absichern.
      await this.trackEvent('app_start', {
        platform: Platform.OS ?? 'unknown',
        device_type: Device.deviceType ?? 'unknown',
        os_version: Device.osVersion ?? 'unknown',
        app_version: '1.0.0',
        session_id: this.sessionId ?? 'unknown',
      });

      console.log('Analytics initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      return false;
    }
  }

  // Session ID generieren
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics-Daten laden
  async loadAnalyticsData() {
    try {
      const data = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          this.userId = parsed.userId || null;
        } catch (parseError) {
          console.error('Failed to parse analytics data, corrupted:', parseError);
          this.userId = null;
        }
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }

  // Analytics-Daten speichern
  async saveAnalyticsData() {
    try {
      const data = {
        userId: this.userId,
        lastSession: this.sessionId,
        lastSessionTime: this.sessionStartTime
      };
      await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save analytics data:', error);
    }
  }

  // Event tracken
  // CRASH-FIX: sanitizeProperties() wird auf ALLE Properties angewendet bevor
  // sie die native iOS-Bridge passieren. Verhindert NSInvalidArgumentException.
  async trackEvent(eventName: string, properties: Record<string, any> = {}) {
    if (!this.isEnabled) return;

    try {
      // Alle Properties sanitizen (null/undefined → 'unknown')
      const sanitizedProperties = this.sanitizeProperties({
        ...properties,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId ?? 'unknown',
        user_id: this.userId ?? 'unknown',
        platform: Platform.OS ?? 'unknown',
      });

      const event = {
        id: this.generateEventId(),
        name: eventName ?? 'unknown_event',
        properties: sanitizedProperties,
      };

      this.events.push(event);

      // Begrenze Events pro Session
      if (this.events.length > MAX_EVENTS_PER_SESSION) {
        this.events = this.events.slice(-MAX_EVENTS_PER_SESSION);
      }

      // Speichere Events periodisch
      if (this.events.length % 10 === 0) {
        await this.flushEvents();
      }

      // In Development: Logge Events
      if (__DEV__) {
        console.log('Analytics Event:', event);
      }

      return event.id;
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Event ID generieren
  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // User ID setzen
  async setUserId(userId: string | null) {
    this.userId = userId;
    await this.saveAnalyticsData();

    await this.trackEvent('user_identified', {
      user_id: userId ?? 'unknown'
    });
  }

  // User ID entfernen
  async clearUserId() {
    this.userId = null;
    await this.saveAnalyticsData();

    await this.trackEvent('user_logged_out');
  }

  // Screen View tracken
  async trackScreenView(screenName: string, properties: Record<string, any> = {}) {
    return await this.trackEvent('screen_view', {
      screen_name: screenName ?? 'unknown',
      ...properties
    });
  }

  // User Action tracken
  async trackUserAction(action: string, properties: Record<string, any> = {}) {
    return await this.trackEvent('user_action', {
      action: action ?? 'unknown',
      ...properties
    });
  }

  // Error tracken
  async trackError(error: Error | string, properties: Record<string, any> = {}) {
    const err = error as any;
    return await this.trackEvent('error', {
      error_message: err?.message || String(error) || 'unknown',
      // CRASH-FIX: error.stack kann null/undefined sein → 'unknown' statt null
      error_stack: err?.stack ?? 'unknown',
      ...properties
    });
  }

  // Performance Metriken tracken
  async trackPerformance(metricName: string, value: number, properties: Record<string, any> = {}) {
    return await this.trackEvent('performance', {
      metric_name: metricName ?? 'unknown',
      metric_value: value ?? 0,
      ...properties
    });
  }

  // App-spezifische Events
  async trackCheckIn(status: string, streak: number) {
    return await this.trackEvent('check_in', {
      status: status ?? 'unknown',
      current_streak: streak ?? 0,
      check_in_time: new Date().toISOString()
    });
  }

  async trackStreakMilestone(milestone: number | string) {
    return await this.trackEvent('streak_milestone', {
      milestone: milestone ?? 'unknown',
      achievement_time: new Date().toISOString()
    });
  }

  async trackNotificationReceived(notificationType: string) {
    return await this.trackEvent('notification_received', {
      notification_type: notificationType ?? 'unknown',
      received_time: new Date().toISOString()
    });
  }

  async trackNotificationOpened(notificationType: string) {
    return await this.trackEvent('notification_opened', {
      notification_type: notificationType ?? 'unknown',
      opened_time: new Date().toISOString()
    });
  }

  // Events zurücksenden (für Production)
  async flushEvents() {
    if (this.events.length === 0) return;

    try {
      // In Production: Hier würde man die Events an einen Analytics-Service senden
      if (!__DEV__) {
        // Beispiel: Send to analytics service
        console.log('Would send events to analytics service:', this.events);

        // Nach erfolgreichem Senden: Events löschen
        this.events = [];
      } else {
        // In Development: Speichere Events lokal für Debugging
        await AsyncStorage.setItem('debug_analytics_events', JSON.stringify(this.events));
      }
    } catch (error) {
      console.error('Failed to flush events:', error);
    }
  }

  // Session beenden
  async endSession() {
    try {
      // CRASH-FIX: this.sessionStartTime kann null sein → Date(null) wirft keinen Fehler
      // gibt aber 0 zurück → Fallback auf 0 wenn nicht gesetzt
      const sessionDuration = this.sessionStartTime
        ? Date.now() - new Date(this.sessionStartTime).getTime()
        : 0;
      await this.trackEvent('session_end', {
        session_duration: sessionDuration,
        events_count: this.events.length
      });

      await this.flushEvents();
      await this.saveAnalyticsData();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // Analytics aktivieren/deaktivieren
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Debug-Informationen abrufen
  async getDebugInfo() {
    return {
      sessionId: this.sessionId,
      sessionStartTime: this.sessionStartTime,
      eventsCount: this.events.length,
      userId: this.userId,
      isEnabled: this.isEnabled
    };
  }
}

// Singleton-Instanz
export const analyticsService = new AnalyticsService();

// Hook für einfache Verwendung
export const useAnalytics = () => {
  return {
    trackEvent: analyticsService.trackEvent.bind(analyticsService),
    trackScreenView: analyticsService.trackScreenView.bind(analyticsService),
    trackUserAction: analyticsService.trackUserAction.bind(analyticsService),
    trackError: analyticsService.trackError.bind(analyticsService),
    trackCheckIn: analyticsService.trackCheckIn.bind(analyticsService),
    trackStreakMilestone: analyticsService.trackStreakMilestone.bind(analyticsService),
    setUserId: analyticsService.setUserId.bind(analyticsService),
    clearUserId: analyticsService.clearUserId.bind(analyticsService)
  };
};

export default analyticsService;
