import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Analytics-Konstanten
const ANALYTICS_STORAGE_KEY = 'app_analytics';
const MAX_EVENTS_PER_SESSION = 100;
const MAX_SESSIONS = 50;

class AnalyticsService {
  constructor() {
    this.sessionId = null;
    this.sessionStartTime = null;
    this.events = [];
    this.isEnabled = true;
    this.userId = null;
  }

  // Initialisierung
  async initialize() {
    try {
      // Generiere Session ID
      this.sessionId = this.generateSessionId();
      this.sessionStartTime = new Date().toISOString();
      
      // Lade bestehende Analytics-Daten
      await this.loadAnalyticsData();
      
      // Track App-Start Event
      await this.trackEvent('app_start', {
        platform: Platform.OS,
        device_type: Device.deviceType,
        os_version: Device.osVersion,
        app_version: '1.0.0',
        session_id: this.sessionId
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
  async trackEvent(eventName, properties = {}) {
    if (!this.isEnabled) return;

    try {
      const event = {
        id: this.generateEventId(),
        name: eventName,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          session_id: this.sessionId,
          user_id: this.userId,
          platform: Platform.OS
        }
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
  async setUserId(userId) {
    this.userId = userId;
    await this.saveAnalyticsData();
    
    await this.trackEvent('user_identified', {
      user_id: userId
    });
  }

  // User ID entfernen
  async clearUserId() {
    this.userId = null;
    await this.saveAnalyticsData();
    
    await this.trackEvent('user_logged_out');
  }

  // Screen View tracken
  async trackScreenView(screenName, properties = {}) {
    return await this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties
    });
  }

  // User Action tracken
  async trackUserAction(action, properties = {}) {
    return await this.trackEvent('user_action', {
      action,
      ...properties
    });
  }

  // Error tracken
  async trackError(error, properties = {}) {
    return await this.trackEvent('error', {
      error_message: error.message || error,
      error_stack: error.stack || null,
      ...properties
    });
  }

  // Performance Metriken tracken
  async trackPerformance(metricName, value, properties = {}) {
    return await this.trackEvent('performance', {
      metric_name: metricName,
      metric_value: value,
      ...properties
    });
  }

  // App-spezifische Events
  async trackCheckIn(status, streak) {
    return await this.trackEvent('check_in', {
      status, // 'success' oder 'smoked'
      current_streak: streak,
      check_in_time: new Date().toISOString()
    });
  }

  async trackStreakMilestone(milestone) {
    return await this.trackEvent('streak_milestone', {
      milestone,
      achievement_time: new Date().toISOString()
    });
  }

  async trackNotificationReceived(notificationType) {
    return await this.trackEvent('notification_received', {
      notification_type: notificationType,
      received_time: new Date().toISOString()
    });
  }

  async trackNotificationOpened(notificationType) {
    return await this.trackEvent('notification_opened', {
      notification_type: notificationType,
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
      await this.trackEvent('session_end', {
        session_duration: Date.now() - new Date(this.sessionStartTime).getTime(),
        events_count: this.events.length
      });

      await this.flushEvents();
      await this.saveAnalyticsData();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // Analytics aktivieren/deaktivieren
  setEnabled(enabled) {
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
