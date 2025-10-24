# 🚭 Nicht Rauchen App

Die ultimative App zum Rauchstopp! Verfolge deine Fortschritte, erhalte tägliche Erinnerungen und erreiche deine Ziele mit unserem intelligenten Tracking-System.

## ✨ Features

- 📊 **Streak-Tracking**: Verfolge deine rauchfreien Tage
- 📅 **Kalender-Ansicht**: Übersichtliche Darstellung deiner Fortschritte
- 🔔 **Push-Benachrichtigungen**: Tägliche Erinnerungen an Check-ins
- 📈 **Statistiken**: Detaillierte Auswertungen deiner Erfolge
- 🎯 **Motivation**: Personalisierte Motivationsinhalte
- 📱 **Widgets**: iOS-Widgets für schnellen Überblick
- 🔒 **Datenschutz**: Alle Daten werden lokal gespeichert

## 🛠️ Technologie-Stack

- **Framework**: React Native mit Expo
- **Navigation**: Expo Router
- **State Management**: Zustand
- **Styling**: React Native StyleSheet
- **Storage**: AsyncStorage
- **Notifications**: Expo Notifications
- **Analytics**: Custom Analytics Service
- **Performance**: Custom Performance Monitoring

## 🚀 Installation & Setup

### Voraussetzungen

- Node.js (v18 oder höher)
- npm oder yarn
- Expo CLI
- iOS Simulator oder Android Emulator (optional)

### Installation

```bash
# Repository klonen
git clone https://github.com/yourusername/nicht-rauchen-app.git
cd nicht-rauchen-app

# Dependencies installieren
cd apps/mobile
npm install

# App starten
npm start
```

### Entwicklung

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web-Version
npm run web
```

## 📱 App Store Bereitschaft

Die App ist vollständig für den App Store optimiert:

- ✅ **Sicherheit**: DSGVO-konform, sichere Datenverarbeitung
- ✅ **Performance**: Optimiert für alle Gerätegrößen
- ✅ **Accessibility**: Vollständig barrierefrei
- ✅ **Stabilität**: Robuste Fehlerbehandlung
- ✅ **Analytics**: Umfassendes Monitoring-System

## 🏗️ Projektstruktur

```
apps/
├── mobile/                 # React Native App
│   ├── src/
│   │   ├── app/           # App-Router Seiten
│   │   ├── components/    # Wiederverwendbare Komponenten
│   │   └── utils/         # Utilities und Services
│   ├── assets/           # Bilder und Icons
│   └── app.json          # Expo-Konfiguration
└── web/                   # Web-Version (optional)
```

## 🔧 Konfiguration

### Umgebungsvariablen

Erstelle eine `.env`-Datei im `apps/mobile/` Verzeichnis:

```env
EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY=your_uploadcare_key
EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL=your_content_url
EXPO_PUBLIC_PROJECT_GROUP_ID=your_project_id
EXPO_PUBLIC_HOST=your_host
EXPO_PUBLIC_PROXY_BASE_URL=your_proxy_url
```

### EAS Build

```bash
# EAS CLI installieren
npm install -g @expo/eas-cli

# Build konfigurieren
eas build:configure

# Build erstellen
eas build --platform all
```

## 📊 Analytics & Monitoring

Die App enthält ein umfassendes Analytics-System:

- **Event Tracking**: Benutzeraktionen und App-Nutzung
- **Performance Monitoring**: Memory, Network, Render-Zeiten
- **Crash Reporting**: Automatische Fehler-Erfassung
- **User Journey**: Screen-Views und Navigation

## 🔒 Datenschutz

- **Lokale Speicherung**: Alle Daten werden nur lokal gespeichert
- **Anonymisierte Analytics**: Keine personenbezogenen Daten
- **DSGVO-konform**: Vollständige Compliance mit europäischen Datenschutzgesetzen
- **Transparent**: Detaillierte Datenschutzerklärung

## 🧪 Testing

```bash
# Unit Tests
npm test

# E2E Tests
npm run test:e2e

# Linting
npm run lint
```

## 📈 Performance

- **Memory Monitoring**: Automatische Überwachung des Speicherverbrauchs
- **Network Optimization**: Intelligente Netzwerk-Nutzung
- **Bundle Optimization**: Minimierte App-Größe
- **Lazy Loading**: Optimierte Komponenten-Ladung

## 🎨 Design System

- **Farben**: Primärfarbe #3BFF91, Hintergrund #081023
- **Typografie**: System-Fonts mit optimierter Lesbarkeit
- **Icons**: Lucide React Native Icons
- **Layout**: Responsive Design für alle Gerätegrößen

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) für Details.

## 📞 Support

Bei Fragen oder Problemen:

- 📧 E-Mail: support@nichtrauchen.app
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/nicht-rauchen-app/issues)
- 📖 Dokumentation: [Wiki](https://github.com/yourusername/nicht-rauchen-app/wiki)

## 🙏 Danksagungen

- Expo Team für das großartige Framework
- React Native Community für die Unterstützung
- Alle Beta-Tester für das wertvolle Feedback

---

**Entwickelt mit ❤️ für eine rauchfreie Zukunft**
