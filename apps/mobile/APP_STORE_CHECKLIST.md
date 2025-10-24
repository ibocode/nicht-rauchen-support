# App Store Release Checkliste - Nicht Rauchen App

## ✅ Vorbereitung abgeschlossen

### 1. App-Konfiguration
- [x] **app.json** aktualisiert mit korrekten Metadaten
- [x] **App-Name** geändert zu "Nicht Rauchen"
- [x] **Bundle ID** gesetzt: com.nichtrauchen.app
- [x] **Version** gesetzt: 1.0.0
- [x] **Beschreibung** hinzugefügt
- [x] **Keywords** definiert
- [x] **iOS-spezifische Einstellungen** konfiguriert

### 2. App Store Metadaten
- [x] **App Store Beschreibung** erstellt (APP_STORE_DESCRIPTION.md)
- [x] **Privacy Policy** erstellt (PRIVACY_POLICY.md)
- [x] **EAS-Konfiguration** aktualisiert (eas.json)

## 🔄 Noch zu erledigen

### 3. Assets und Screenshots
- [ ] **App-Icon** überprüfen (1024x1024px für App Store)
- [ ] **Screenshots** erstellen für alle iPhone-Größen:
  - iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)
  - iPhone 6.5" (iPhone 11 Pro Max, 12 Pro Max, 13 Pro Max)
  - iPhone 5.5" (iPhone 8 Plus)
- [ ] **App Preview Videos** (optional, aber empfohlen)

### 4. Apple Developer Account Setup
- [ ] **Apple Developer Account** aktivieren ($99/Jahr)
- [ ] **App Store Connect** Account einrichten
- [ ] **Bundle ID** in Apple Developer Portal registrieren
- [ ] **App Store Connect** App erstellen
- [ ] **App Store Connect** Metadaten eingeben

### 5. EAS Build Konfiguration
- [ ] **EAS CLI** installieren: `npm install -g @expo/eas-cli`
- [ ] **EAS Login**: `eas login`
- [ ] **Apple Credentials** konfigurieren
- [ ] **Production Build** testen: `eas build --platform ios --profile production`

### 6. App Store Connect Konfiguration
- [ ] **App-Informationen** eingeben:
  - Name: "Nicht Rauchen"
  - Untertitel: "Dein Weg zum Nichtraucher"
  - Beschreibung: Aus APP_STORE_DESCRIPTION.md
  - Keywords: rauchstopp, nicht rauchen, gesundheit, tracking, streak
  - Kategorie: Gesundheit & Fitness
  - Altersfreigabe: 4+
- [ ] **Screenshots** hochladen
- [ ] **App-Icon** hochladen
- [ ] **Privacy Policy URL** eingeben
- [ ] **Support URL** eingeben

### 7. App Store Review Vorbereitung
- [ ] **TestFlight** Build hochladen
- [ ] **Interne Tests** durchführen
- [ ] **Beta-Tests** mit externen Testern
- [ ] **App Store Review** Guidelines prüfen
- [ ] **Review-Informationen** für Apple vorbereiten

## 📋 Detaillierte Schritte

### Schritt 1: Apple Developer Account
1. Gehe zu [developer.apple.com](https://developer.apple.com)
2. Melde dich mit deiner Apple ID an
3. Bezahle die $99 Jahresgebühr
4. Aktiviere dein Developer Account

### Schritt 2: App Store Connect
1. Gehe zu [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Melde dich mit deiner Apple ID an
3. Erstelle eine neue App:
   - Name: "Nicht Rauchen"
   - Bundle ID: com.nichtrauchen.app
   - Sprache: Deutsch
   - SKU: nicht-rauchen-app

### Schritt 3: EAS Build
```bash
# EAS CLI installieren
npm install -g @expo/eas-cli

# Login
eas login

# Apple Credentials konfigurieren
eas credentials

# Production Build erstellen
eas build --platform ios --profile production
```

### Schritt 4: App Store Connect Metadaten
1. **App-Informationen**:
   - Name: Nicht Rauchen
   - Untertitel: Dein Weg zum Nichtraucher
   - Beschreibung: Aus APP_STORE_DESCRIPTION.md kopieren
   - Keywords: rauchstopp, nicht rauchen, gesundheit, tracking, streak
   - Kategorie: Gesundheit & Fitness
   - Altersfreigabe: 4+

2. **Preis und Verfügbarkeit**:
   - Preis: Kostenlos
   - Verfügbarkeit: Deutschland, Österreich, Schweiz
   - Verfügbarkeitsdatum: Sofort

3. **App Store Optimierung**:
   - Screenshots für alle iPhone-Größen
   - App Preview Video (optional)
   - App-Icon (1024x1024px)

### Schritt 5: Build und Upload
```bash
# Production Build
eas build --platform ios --profile production

# Nach erfolgreichem Build:
eas submit --platform ios --profile production
```

### Schritt 6: App Store Review
1. **Review-Informationen** für Apple:
   - App-Funktionen erklären
   - Test-Accounts bereitstellen (falls nötig)
   - Besondere Features hervorheben

2. **Review-Zeit**: 24-48 Stunden

## 🚨 Wichtige Hinweise

### Bundle ID
- **Aktuell**: com.nichtrauchen.app
- **Prüfen**: Ob diese ID verfügbar ist
- **Alternative**: com.deinname.nichtrauchen

### App Store Connect Credentials
Du musst folgende Informationen in `eas.json` aktualisieren:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "deine-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

### Screenshots benötigt
- **iPhone 6.7"**: 1290 x 2796 Pixel
- **iPhone 6.5"**: 1242 x 2688 Pixel  
- **iPhone 5.5"**: 1242 x 2208 Pixel

### App-Icon
- **Größe**: 1024 x 1024 Pixel
- **Format**: PNG
- **Hintergrund**: Transparent oder einfarbig

## 📞 Support und Hilfe

### EAS Build Probleme
- [EAS Build Dokumentation](https://docs.expo.dev/build/introduction/)
- [EAS Build Troubleshooting](https://docs.expo.dev/build/troubleshooting/)

### App Store Connect Hilfe
- [App Store Connect Hilfe](https://developer.apple.com/help/app-store-connect/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Apple Developer Support
- [Apple Developer Support](https://developer.apple.com/support/)

## 🎯 Nächste Schritte

1. **Apple Developer Account** einrichten
2. **App Store Connect** App erstellen
3. **Screenshots** erstellen
4. **EAS Build** konfigurieren
5. **Production Build** erstellen
6. **App Store** Upload
7. **Review** abwarten
8. **Veröffentlichung** 🎉

---

**Geschätzte Zeit bis zur Veröffentlichung**: 1-2 Wochen
**Kosten**: $99 Apple Developer Account + Zeit für Screenshots
