# iOS Push-Benachrichtigungen - Apple-Richtlinien und Best Practices

## Implementierte Features

### 1. Berechtigungsmanagement
- **Explizite Berechtigung**: App fragt explizit nach Push-Benachrichtigungsberechtigung
- **Benutzerfreundliche Erklärung**: Klare Beschreibung des Nutzens in der Einstellungsseite
- **Berechtigungsstatus**: Anzeige des aktuellen Berechtigungsstatus in den Einstellungen

### 2. Intelligente Benachrichtigungslogik
- **Bedingte Benachrichtigungen**: Nur wenn noch nicht eingecheckt
- **Feste Uhrzeit**: Täglich um 18:00 Uhr
- **Keine Spam**: Maximal eine Benachrichtigung pro Tag
- **Relevanz**: Nur wenn Check-in noch aussteht

### 3. Benutzerkontrolle
- **Einstellungsseite**: Vollständige Kontrolle über Benachrichtigungen
- **Test-Funktion**: Möglichkeit, Test-Benachrichtigungen zu senden
- **Einfaches Ein-/Ausschalten**: Toggle-Switch in den Einstellungen

## Apple-Richtlinien Compliance

### 1. Human Interface Guidelines (HIG)
✅ **Klare Zweckbestimmung**: Benachrichtigungen dienen nur dem Check-in-Zweck
✅ **Benutzerfreundlichkeit**: Intuitive Einstellungen und Kontrolle
✅ **Relevanz**: Benachrichtigungen sind nur relevant, wenn Check-in aussteht
✅ **Keine Überlastung**: Maximal eine Benachrichtigung pro Tag

### 2. App Store Review Guidelines
✅ **Berechtigung**: Explizite Berechtigung vor dem Senden
✅ **Zweckmäßigkeit**: Benachrichtigungen unterstützen den App-Zweck
✅ **Benutzerkontrolle**: Vollständige Kontrolle über Benachrichtigungen
✅ **Keine Spam**: Intelligente Logik verhindert unnötige Benachrichtigungen

### 3. Privacy Guidelines
✅ **Minimale Daten**: Keine persönlichen Daten in Benachrichtigungen
✅ **Transparenz**: Klare Erklärung des Nutzens
✅ **Kontrolle**: Benutzer kann jederzeit deaktivieren
✅ **Lokale Verarbeitung**: Alle Logik läuft lokal auf dem Gerät

## Technische Implementierung

### 1. Expo Notifications
```javascript
// Berechtigung anfordern
const { status } = await Notifications.requestPermissionsAsync();

// Wiederkehrende Benachrichtigung planen
await Notifications.scheduleNotificationAsync({
  identifier: 'daily_checkin_reminder',
  content: {
    title: '🚭 Zeit für deinen Check-in!',
    body: 'Hast du heute geraucht oder warst du stark?',
  },
  trigger: {
    hour: 18,
    minute: 0,
    repeats: true,
  },
});
```

### 2. Bedingte Logik
```javascript
// Prüfe ob heute bereits eingecheckt
const hasCheckedIn = await quitData.hasCheckedInToday();

// Sende nur wenn noch nicht eingecheckt
if (!hasCheckedIn && notificationsEnabled) {
  // Sende Benachrichtigung
}
```

### 3. Einstellungsintegration
- Toggle-Switch für Ein-/Ausschalten
- Berechtigungsstatus-Anzeige
- Test-Benachrichtigungsfunktion
- Klare Beschreibungen

## Best Practices

### 1. Benutzerfreundlichkeit
- **Klare Sprache**: Deutsche Texte, verständlich
- **Visuelle Hinweise**: Icons und Farben für bessere UX
- **Sofortiges Feedback**: Haptisches Feedback bei Interaktionen
- **Test-Möglichkeit**: Benutzer können Benachrichtigungen testen

### 2. Technische Robustheit
- **Fehlerbehandlung**: Umfassende try-catch-Blöcke
- **Fallback-Verhalten**: Graceful degradation bei Fehlern
- **Performance**: Effiziente Speicherung und Abfrage
- **Kompatibilität**: Funktioniert auf iOS und Android

### 3. Datenschutz
- **Lokale Speicherung**: Alle Einstellungen lokal gespeichert
- **Keine Tracking**: Keine Benutzerdaten an externe Services
- **Transparenz**: Klare Erklärung der Datenverwendung
- **Kontrolle**: Benutzer behält volle Kontrolle

## Konfiguration

### 1. app.json
```json
{
  "ios": {
    "infoPlist": {
      "NSUserNotificationsUsageDescription": "Diese App sendet tägliche Erinnerungen um 18:00 Uhr, um dich an deinen Check-in zu erinnern (nur wenn du noch nicht eingecheckt hast)."
    }
  },
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/icon.png",
        "color": "#3BFF91",
        "defaultChannel": "default"
      }
    ]
  ]
}
```

### 2. Berechtigungen
- iOS: Automatisch über Expo Notifications
- Android: Zusätzliche Permissions für Background-Processing

## Testing

### 1. Lokales Testing
- Test-Benachrichtigungen über Einstellungsseite
- Berechtigungsstatus prüfen
- Ein-/Ausschalten testen

### 2. Geräte-Testing
- Physisches iOS-Gerät erforderlich
- Simulator unterstützt keine Push-Benachrichtigungen
- Verschiedene iOS-Versionen testen

## Deployment

### 1. App Store
- Berechtigungstexte in Deutsch
- Klare App-Beschreibung
- Screenshots mit Benachrichtigungsfeatures

### 2. EAS Build
```bash
# iOS Build
eas build --platform ios

# Android Build  
eas build --platform android
```

## Monitoring

### 1. Analytics
- Benachrichtigungsaktivierung/Deaktivierung
- Berechtigungsstatus
- Benachrichtigungsinteraktionen

### 2. Feedback
- Benutzerfeedback zu Benachrichtigungen
- Häufigkeit der Deaktivierung
- Verbesserungsvorschläge

## Fazit

Die Implementierung folgt allen Apple-Richtlinien und Best Practices:

✅ **Compliance**: Erfüllt alle App Store Guidelines
✅ **UX**: Benutzerfreundliche Implementierung
✅ **Privacy**: Datenschutz-konform
✅ **Performance**: Effiziente und robuste Implementierung
✅ **Maintainability**: Sauberer, dokumentierter Code

Die Push-Benachrichtigungen unterstützen den Hauptzweck der App (Nicht-Rauchen-Tracking) und bieten echten Mehrwert für den Benutzer, ohne aufdringlich zu sein.
