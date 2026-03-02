import React from 'react';
import { Platform } from 'react-native';

// Accessibility-Konstanten
export const ACCESSIBILITY_LABELS = {
  // Navigation
  BACK_BUTTON: 'Zurück',
  HOME_BUTTON: 'Startseite',
  SETTINGS_BUTTON: 'Einstellungen',
  
  // Check-in
  CHECK_IN_SUCCESS: 'Erfolgreich eingecheckt',
  CHECK_IN_SMOKED: 'Geraucht markiert',
  CHECK_IN_BUTTON: 'Check-in durchführen',
  
  // Streak
  CURRENT_STREAK: 'Aktuelle Streak',
  LONGEST_STREAK: 'Längste Streak',
  TOTAL_DAYS: 'Gesamte Tage',
  
  // Notifications
  NOTIFICATION_TOGGLE: 'Benachrichtigungen ein-/ausschalten',
  NOTIFICATION_TIME_PICKER: 'Benachrichtigungszeit auswählen',
  
  // Settings
  CIGARETTES_PER_DAY: 'Zigaretten pro Tag',
  PRICE_PER_WEEK: 'Preis pro Woche',
  RESET_DATA: 'Alle Daten zurücksetzen',
  
  // Calendar
  CALENDAR_VIEW: 'Kalender-Ansicht',
  MONTH_NAVIGATION: 'Monat wechseln',
  DAY_STATUS: 'Tagesstatus',
  
  // Common
  LOADING: 'Lädt...',
  ERROR: 'Fehler',
  SUCCESS: 'Erfolg',
  SAVE: 'Speichern',
  CANCEL: 'Abbrechen',
  CONFIRM: 'Bestätigen',
  DELETE: 'Löschen',
  EDIT: 'Bearbeiten',
  CLOSE: 'Schließen'
};

// Accessibility-Hints
export const ACCESSIBILITY_HINTS = {
  CHECK_IN_SUCCESS: 'Markiert den heutigen Tag als erfolgreich rauchfrei',
  CHECK_IN_SMOKED: 'Markiert den heutigen Tag als geraucht',
  STREAK_COUNTER: 'Zeigt die Anzahl der aufeinanderfolgenden rauchfreien Tage',
  NOTIFICATION_TOGGLE: 'Aktiviert oder deaktiviert tägliche Erinnerungsbenachrichtigungen',
  CALENDAR_DAY: 'Tippen Sie doppelt, um den Status dieses Tages zu ändern',
  SETTINGS_RESET: 'Löscht alle App-Daten und startet neu. Diese Aktion kann nicht rückgängig gemacht werden.'
};

// Accessibility-Komponente für bessere Barrierefreiheit
export const AccessibilityWrapper = ({ 
  children, 
  accessible = true, 
  accessibilityLabel, 
  accessibilityHint, 
  accessibilityRole,
  accessibilityState,
  ...props 
}) => {
  return React.cloneElement(children, {
    accessible,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole,
    accessibilityState,
    ...props
  });
};

// Accessibility-Hook für dynamische Labels
export const useAccessibility = () => {
  const getAccessibilityLabel = (key, dynamicValues = {}) => {
    let label = ACCESSIBILITY_LABELS[key] || key;
    
    // Ersetze Platzhalter mit dynamischen Werten
    Object.entries(dynamicValues).forEach(([placeholder, value]) => {
      label = label.replace(`{${placeholder}}`, value);
    });
    
    return label;
  };

  const getAccessibilityHint = (key, dynamicValues = {}) => {
    let hint = ACCESSIBILITY_HINTS[key] || '';
    
    // Ersetze Platzhalter mit dynamischen Werten
    Object.entries(dynamicValues).forEach(([placeholder, value]) => {
      hint = hint.replace(`{${placeholder}}`, value);
    });
    
    return hint;
  };

  const announceScreenChange = (screenName) => {
    if (Platform.OS === 'ios') {
      // iOS: Verwende Accessibility-Announcement
      // Hier würde man eine native Funktion aufrufen
      console.log(`Screen changed to: ${screenName}`);
    } else {
      // Android: Verwende Accessibility-Event
      console.log(`Screen changed to: ${screenName}`);
    }
  };

  const announceAction = (action, result) => {
    const message = `${action}: ${result}`;
    console.log(`Accessibility announcement: ${message}`);
  };

  return {
    getAccessibilityLabel,
    getAccessibilityHint,
    announceScreenChange,
    announceAction
  };
};

// Accessibility-Utility-Funktionen
export const accessibilityUtils = {
  // Prüfe ob VoiceOver/TalkBack aktiviert ist
  isScreenReaderEnabled: () => {
    // Hier würde man die native API aufrufen
    return false; // Placeholder
  },

  // Setze Focus auf ein Element
  setFocus: (elementRef) => {
    if (elementRef && elementRef.current) {
      elementRef.current.focus();
    }
  },

  // Generiere eindeutige IDs für Accessibility
  generateAccessibilityId: (prefix, suffix) => {
    return `${prefix}_${suffix}_${Date.now()}`;
  },

  // Validiere Accessibility-Props
  validateAccessibilityProps: (props) => {
    const errors = [];
    
    if (props.accessible && !props.accessibilityLabel) {
      errors.push('accessible=true requires accessibilityLabel');
    }
    
    if (props.accessibilityRole === 'button' && !props.accessibilityLabel) {
      errors.push('Button role requires accessibilityLabel');
    }
    
    return errors;
  }
};

// Accessibility-Konstanten für verschiedene Rollen
export const ACCESSIBILITY_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  HEADER: 'header',
  TEXT: 'text',
  IMAGE: 'image',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SWITCH: 'switch',
  SLIDER: 'slider',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  LIST: 'list',
  LISTITEM: 'listitem',
  GRID: 'grid',
  GRIDITEM: 'griditem',
  ALERT: 'alert',
  DIALOG: 'dialog',
  LOG: 'log',
  MARQUEE: 'marquee',
  STATUS: 'status',
  TIMER: 'timer',
  PROGRESSBAR: 'progressbar',
  SEARCH: 'search',
  TEXTBOX: 'textbox',
  COMBOBOX: 'combobox',
  SPINBUTTON: 'spinbutton',
  SCROLLBAR: 'scrollbar',
  TOOLTIP: 'tooltip',
  TREE: 'tree',
  TREEITEM: 'treeitem'
};

// Accessibility-States
export const ACCESSIBILITY_STATES = {
  SELECTED: 'selected',
  DISABLED: 'disabled',
  CHECKED: 'checked',
  UNCHECKED: 'unchecked',
  BUSY: 'busy',
  EXPANDED: 'expanded',
  COLLAPSED: 'collapsed'
};

export default {
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_HINTS,
  ACCESSIBILITY_ROLES,
  ACCESSIBILITY_STATES,
  AccessibilityWrapper,
  useAccessibility,
  accessibilityUtils
};
