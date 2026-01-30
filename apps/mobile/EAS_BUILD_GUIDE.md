# 🚀 EAS Build - Schritt für Schritt Anleitung

## 📍 Wichtiger Hinweis: Ordner

**Du musst im `apps/mobile` Ordner sein!**

```bash
cd "C:\Users\iteps\Desktop\Apps\Nicht rauchen\apps\mobile"
```

---

## 🔧 Schritt 1: EAS CLI installieren

Falls noch nicht installiert:

```bash
npm install -g @expo/eas-cli
```

**Prüfen ob installiert:**
```bash
eas --version
```

---

## 🔐 Schritt 2: Bei EAS einloggen

```bash
eas login
```

Du wirst nach deinem Expo Account gefragt. Falls du noch keinen hast:
- Gehe zu [expo.dev](https://expo.dev) und erstelle einen Account
- Oder nutze: `eas register` um einen neuen Account zu erstellen

---

## ⚙️ Schritt 3: Apple Credentials konfigurieren (nur für iOS)

**WICHTIG:** Du brauchst:
- ✅ Apple Developer Account ($99/Jahr)
- ✅ App Store Connect Zugang
- ✅ Bundle ID: `com.nichtrauchen.app` muss in Apple Developer Portal registriert sein

```bash
eas credentials
```

Wähle:
1. **Platform:** iOS
2. **What would you like to do?** → "Set up credentials for a new app"
3. Folgen den Anweisungen

EAS wird automatisch:
- Provisioning Profile erstellen
- Distribution Certificate erstellen
- Alles in App Store Connect konfigurieren

---

## 🏗️ Schritt 4: Build erstellen

### Option A: Production Build (für App Store)

```bash
eas build --platform ios --profile production
```

**Was passiert:**
- ✅ Build wird in der Cloud erstellt
- ✅ Dauert ca. 15-30 Minuten
- ✅ Du bekommst einen Download-Link
- ✅ Build kann direkt zu App Store Connect hochgeladen werden

### Option B: Preview Build (für TestFlight)

```bash
eas build --platform ios --profile preview
```

**Was passiert:**
- ✅ Build für interne Tests
- ✅ Kann zu TestFlight hochgeladen werden
- ✅ Schneller als Production Build

### Option C: Development Build (für lokales Testen)

```bash
eas build --platform ios --profile development
```

**Was passiert:**
- ✅ Development Client Build
- ✅ Für lokales Testen mit Expo Go
- ✅ Schnellster Build

---

## 📱 Build-Status prüfen

Während der Build läuft:

```bash
eas build:list
```

Oder im Browser:
- Gehe zu [expo.dev](https://expo.dev)
- Klicke auf dein Projekt
- Sieh dir die Builds an

---

## 📥 Build herunterladen

Nach erfolgreichem Build:

1. **Automatisch:** EAS zeigt dir einen Download-Link
2. **Manuell:** 
   ```bash
   eas build:list
   ```
   Dann den Build-ID kopieren und:
   ```bash
   eas build:download [BUILD_ID]
   ```

---

## 🚢 Build zu App Store Connect hochladen

### Option 1: Automatisch mit EAS Submit

```bash
eas submit --platform ios --profile production
```

**Was passiert:**
- ✅ Build wird automatisch zu App Store Connect hochgeladen
- ✅ Du musst nur noch in App Store Connect die Metadaten eingeben
- ✅ Dann für Review einreichen

### Option 2: Manuell hochladen

1. Lade die `.ipa` Datei herunter
2. Gehe zu [App Store Connect](https://appstoreconnect.apple.com)
3. Wähle deine App
4. Gehe zu "TestFlight" oder "App Store"
5. Klicke auf "+" um einen neuen Build hochzuladen
6. Lade die `.ipa` Datei hoch (kann 10-30 Minuten dauern)

---

## 🔍 Build-Profile erklärt

### Production Profile
```json
{
  "production": {
    "autoIncrement": true,
    "ios": {
      "buildConfiguration": "Release"
    }
  }
}
```

**Verwendung:**
- ✅ Für App Store Veröffentlichung
- ✅ Optimiert für Performance
- ✅ Keine Debug-Informationen
- ✅ Auto-Increment Build-Nummer

### Preview Profile
```json
{
  "preview": {
    "distribution": "internal",
    "ios": {
      "simulator": true
    }
  }
}
```

**Verwendung:**
- ✅ Für TestFlight
- ✅ Interne Tests
- ✅ Kann auch für Simulator sein

### Development Profile
```json
{
  "development": {
    "developmentClient": true,
    "distribution": "internal"
  }
}
```

**Verwendung:**
- ✅ Für lokale Entwicklung
- ✅ Mit Expo Dev Client
- ✅ Hot Reload aktiv

---

## ⚠️ Häufige Probleme & Lösungen

### Problem: "No credentials found"
**Lösung:**
```bash
eas credentials
```
Dann "Set up credentials for a new app" wählen

### Problem: "Bundle ID already exists"
**Lösung:**
- Bundle ID muss in Apple Developer Portal registriert sein
- Oder ändere Bundle ID in `app.json`

### Problem: "Apple Team ID not found"
**Lösung:**
- Prüfe `eas.json` → `submit.production.ios.appleTeamId`
- Muss mit deinem Apple Developer Account übereinstimmen

### Problem: Build schlägt fehl
**Lösung:**
```bash
eas build:list
```
Dann den fehlgeschlagenen Build anschauen:
```bash
eas build:view [BUILD_ID]
```

---

## 📋 Checkliste vor dem Build

- [ ] Im richtigen Ordner: `apps/mobile`
- [ ] `app.json` ist korrekt konfiguriert
- [ ] `eas.json` ist vorhanden
- [ ] Apple Developer Account aktiv
- [ ] Bundle ID in Apple Developer Portal registriert
- [ ] Bei EAS eingeloggt: `eas login`
- [ ] Credentials konfiguriert: `eas credentials`

---

## 🎯 Schnellstart (Copy & Paste)

```bash
# 1. In den richtigen Ordner wechseln
cd "C:\Users\iteps\Desktop\Apps\Nicht rauchen\apps\mobile"

# 2. Bei EAS einloggen (falls noch nicht)
eas login

# 3. Credentials konfigurieren (nur beim ersten Mal)
eas credentials

# 4. Production Build erstellen
eas build --platform ios --profile production

# 5. Warten (15-30 Minuten)

# 6. Build zu App Store Connect hochladen
eas submit --platform ios --profile production
```

---

## 📊 Build-Status Codes

- 🟡 **in_progress** - Build läuft
- 🟢 **finished** - Build erfolgreich
- 🔴 **errored** - Build fehlgeschlagen
- ⚪ **canceled** - Build abgebrochen

---

## 💡 Tipps

1. **Erster Build dauert länger** - EAS muss alles einrichten
2. **Builds kosten nichts** - EAS Free Tier ist ausreichend
3. **Parallel bauen** - Du kannst iOS und Android gleichzeitig bauen
4. **Build-Cache** - Nachfolgende Builds sind schneller
5. **Logs anschauen** - Bei Fehlern: `eas build:view [BUILD_ID]`

---

## 🔗 Nützliche Links

- [EAS Build Dokumentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Dokumentation](https://docs.expo.dev/submit/introduction/)
- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Expo Dashboard](https://expo.dev)

---

**Viel Erfolg mit deinem Build! 🚀**

