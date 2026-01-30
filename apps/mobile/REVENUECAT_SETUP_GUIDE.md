# 🚀 RevenueCat Setup - Komplette Anleitung

Diese Anleitung führt dich Schritt für Schritt durch die Einrichtung von RevenueCat für deine "Nicht Rauchen" App.

## ⚠️ WICHTIG: Abos vs. In-App-Käufe

**Für deine App musst du "Abos" (Subscriptions) verwenden, nicht "In-App-Käufe"!**

- ✅ **Abos (Auto-Renewable Subscriptions):** Für wiederkehrende Zahlungen (wöchentlich/jährlich)
- ❌ **In-App-Käufe:** Nur für einmalige Käufe oder verbrauchbare Items

Deine App bietet Premium-Features mit wiederkehrenden Zahlungen → **Definitiv Abos!**

## 📋 Übersicht

RevenueCat ist bereits installiert (`react-native-purchases` v9.6.7) und teilweise integriert. Du musst nur noch:
1. RevenueCat Account erstellen & konfigurieren
2. Produkte in App Store Connect / Google Play Console erstellen
3. API Keys in die App einfügen
4. Plugin in app.json konfigurieren

---

## 🎯 Schritt 1: RevenueCat Account erstellen

1. **Gehe zu [revenuecat.com](https://app.revenuecat.com/signup)** und erstelle einen kostenlosen Account
2. **Erstelle ein neues Projekt:**
   - Klicke auf "New Project"
   - Name: "Nicht Rauchen App"
   - Wähle "React Native" als Plattform

3. **Füge deine App hinzu:**
   - **iOS App:**
     - Name: "Nicht Rauchen"
     - Bundle ID: `com.nichtrauchen.app` (aus app.json)
   - **Android App (optional):**
     - Name: "Nicht Rauchen"
     - Package Name: `com.nichtrauchen.app`

---

## 🍎 Schritt 2: App Store Connect - Abos erstellen

### ⚠️ WICHTIG: "Abos" verwenden, nicht "In-App-Käufe"!

**Warum Abos?**
- Deine App bietet **wiederkehrende Zahlungen** (wöchentlich/jährlich)
- Premium-Features mit kontinuierlichem Zugriff
- **Best Practice:** Für wiederkehrende Einnahmen immer **Auto-Renewable Subscriptions** verwenden

**In-App-Käufe** sind nur für:
- Einmalige Käufe (z.B. Werbung entfernen)
- Verbrauchbare Items (z.B. Spielwährung)

### 2.1 App Store Connect öffnen
1. Gehe zu [App Store Connect](https://appstoreconnect.apple.com)
2. Wähle deine App aus (oder erstelle sie, falls noch nicht vorhanden)

### 2.2 Abos erstellen

#### **Wöchentliches Abo (3 Tage kostenlos):**
1. Gehe zu **"Features" → "Abos" → "+"** (NICHT "In-App-Käufe"!)
2. Klicke auf **"Auto-Renewable Subscription"**
3. **Produkt-ID:** `premium_weekly`
4. **Referenzname:** "Premium Wöchentlich"
5. **Preis:** Wähle einen Preis (z.B. 1,99€/Woche)
6. **Subscription Group:** Erstelle eine neue Gruppe "Premium Subscriptions"
   - Wenn du noch keine Gruppe hast, wird sie automatisch erstellt
7. **Subscription Duration:** 1 Woche
8. **Free Trial:** 3 Tage kostenlos (optional, aber empfohlen)
9. **Beschreibung:** "Premium-Features für Nicht-Rauchen App - Wöchentlich"
10. **Review Information:** Beschreibe die Premium-Features für Apple Review

#### **Jährliches Abo:**
1. Gehe zu **"Features" → "Abos" → "+"**
2. Klicke auf **"Auto-Renewable Subscription"**
3. **Produkt-ID:** `premium_yearly`
4. **Referenzname:** "Premium Jährlich"
5. **Preis:** Wähle einen Preis (z.B. 49,99€/Jahr)
6. **Subscription Group:** Gleiche Gruppe wie wöchentlich ("Premium Subscriptions")
   - ⚠️ Wichtig: Beide Abos müssen in der **gleichen Subscription Group** sein!
7. **Subscription Duration:** 1 Jahr
8. **Beschreibung:** "Premium-Features für Nicht-Rauchen App - Jährlich"
9. **Review Information:** Beschreibe die Premium-Features für Apple Review

### 2.3 Subscription Group konfigurieren
1. Nach dem Erstellen der Abos, gehe zu **"Features" → "Abos" → "Premium Subscriptions"** (deine Gruppe)
2. **Setze das jährliche Abo als "Base Plan"** (wenn möglich)
3. **Wichtig:** Beide Abos müssen in der gleichen Gruppe sein, damit User zwischen ihnen wechseln können

### 2.4 Wichtig für Testing:
- **Sandbox Tester Account erstellen:**
  - Gehe zu **"Users and Access" → "Sandbox" → "Testers"**
  - Erstelle einen Test-Account (kann eine Fake-Email sein)
  - Verwende diesen Account zum Testen in der App
- **Test-Accounts können keine echten Käufe tätigen** - perfekt für Development!

---

## 🤖 Schritt 3: Google Play Console (Optional, nur für Android)

Falls du auch Android unterstützen willst:

1. Gehe zu [Google Play Console](https://play.google.com/console)
2. Wähle deine App aus
3. **"Monetize" → "Subscriptions" → "Create subscription"**
4. Erstelle die gleichen Produkte:
   - `premium_weekly`
   - `premium_yearly`

---

## ⚙️ Schritt 4: RevenueCat Dashboard konfigurieren

### 4.1 App Store Connect Integration
1. Im RevenueCat Dashboard: **"Integrations" → "App Store Connect"**
2. Klicke auf **"Connect"**
3. Folge den Anweisungen, um App Store Connect zu verbinden
4. Wähle deine App aus

### 4.2 Produkte hinzufügen
1. Gehe zu **"Products"** im RevenueCat Dashboard
2. Klicke auf **"+ Add Product"**
3. Füge beide Produkte hinzu:
   - `premium_weekly` (Store Product ID)
   - `premium_yearly` (Store Product ID)
4. RevenueCat erkennt automatisch die Produkte aus App Store Connect

### 4.3 Entitlement erstellen
1. Gehe zu **"Entitlements"** im Dashboard
2. Klicke auf **"+ Add Entitlement"**
3. **Entitlement ID:** `pro` (muss genau so heißen, wie in purchases.js)
4. **Display Name:** "Premium Features"
5. **Verknüpfe beide Produkte** (`premium_weekly` und `premium_yearly`) mit diesem Entitlement

### 4.4 Offering erstellen
1. Gehe zu **"Offerings"** im Dashboard
2. Klicke auf **"+ Add Offering"**
3. **Offering ID:** `default` (oder lass es auf "default")
4. **Display Name:** "Premium Subscription"
5. **Füge Packages hinzu:**
   - Package ID: `weekly` → Produkt: `premium_weekly`
   - Package ID: `annual` → Produkt: `premium_yearly`

### 4.5 API Keys holen
1. Gehe zu **"Project Settings" → "API Keys"**
2. Kopiere die **Public API Keys:**
   - **iOS API Key:** `appl_xxxxxxxxxx`
   - **Android API Key:** `goog_xxxxxxxxxx` (falls Android)

---

## 💻 Schritt 5: App konfigurieren

### 5.1 API Keys in purchases.js eintragen

Öffne `apps/mobile/src/utils/purchases.js` und ersetze die Platzhalter:

```javascript
const API_KEYS = {
  apple: 'appl_DEIN_APPLE_KEY_HIER_EINFÜGEN',  // ← Hier deinen iOS Key eintragen
  google: 'goog_DEIN_GOOGLE_KEY_HIER_EINFÜGEN', // ← Hier deinen Android Key eintragen (oder leer lassen)
};
```

### 5.2 Plugin in app.json hinzufügen

Öffne `apps/mobile/app.json` und füge das RevenueCat Plugin hinzu:

```json
{
  "expo": {
    "plugins": [
      // ... bestehende Plugins ...
      [
        "react-native-purchases",
        {
          "ios": {
            "usesStoreKit2": true
          }
        }
      ]
    ]
  }
}
```

**Wichtig:** Das Plugin muss in der `plugins`-Array sein, nicht in `ios.plugins`!

### 5.3 Package Names prüfen

Stelle sicher, dass die Package Names in `app.json` mit RevenueCat übereinstimmen:
- iOS: `com.nichtrauchen.app` ✅
- Android: `com.nichtrauchen.app` ✅

---

## 🧪 Schritt 6: Testen

### 6.1 Development Build erstellen

RevenueCat funktioniert **nicht** im Expo Go. Du musst einen Development Build erstellen:

```bash
# iOS Development Build
eas build --profile development --platform ios

# Oder lokal (wenn du Xcode hast)
npx expo run:ios
```

### 6.2 In der App testen

1. **Öffne die App** auf einem echten Gerät oder Simulator (mit Sandbox Account)
2. **Gehe zum Onboarding** (falls noch nicht abgeschlossen)
3. **Wähle ein Abo** aus
4. **Klicke auf "Kaufen"**
5. **Melde dich mit deinem Sandbox Test-Account** an
6. **Bestätige den Kauf**

### 6.3 Debugging

Falls etwas nicht funktioniert:

1. **Prüfe die Console-Logs:**
   - RevenueCat gibt Debug-Logs aus (wegen `setLogLevel(DEBUG)`)
   - Suche nach Fehlermeldungen

2. **RevenueCat Dashboard prüfen:**
   - Gehe zu **"Customers"** → Suche nach deiner User-ID
   - Prüfe, ob Käufe erkannt werden

3. **Häufige Probleme:**
   - ❌ **"No offerings available"** → Prüfe, ob Offering in RevenueCat erstellt wurde
   - ❌ **"Product not found"** → Prüfe, ob Produkt-IDs in App Store Connect und RevenueCat übereinstimmen
   - ❌ **"Invalid API Key"** → Prüfe, ob der API Key korrekt eingetragen ist

---

## 📱 Schritt 7: Production Build

Wenn alles funktioniert:

1. **Entferne Debug-Logs** (optional):
   ```javascript
   // In purchases.js, entferne oder kommentiere aus:
   // await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
   ```

2. **Production Build erstellen:**
   ```bash
   eas build --profile production --platform ios
   ```

3. **App Store Submission:**
   - Lade den Build zu App Store Connect hoch
   - Teste mit TestFlight
   - Submit für Review

---

## 🔍 Code-Übersicht

### Wo wird RevenueCat verwendet?

1. **`apps/mobile/src/utils/purchases.js`**
   - Initialisierung
   - Offerings abrufen
   - Käufe durchführen
   - Status prüfen

2. **`apps/mobile/src/app/_layout.jsx`**
   - Initialisiert RevenueCat beim App-Start

3. **`apps/mobile/src/app/onboarding.jsx`**
   - Zeigt Abos an
   - Verarbeitet Käufe
   - Restore Purchases

### Wichtige Funktionen:

- `purchaseService.init()` - Initialisiert RevenueCat
- `purchaseService.getOfferings()` - Holt verfügbare Abos
- `purchaseService.purchasePackage(pkg)` - Kauft ein Abo
- `purchaseService.checkProStatus()` - Prüft, ob Premium aktiv ist
- `purchaseService.restorePurchases()` - Stellt Käufe wieder her

---

## ✅ Checkliste

- [ ] RevenueCat Account erstellt
- [ ] App in RevenueCat hinzugefügt
- [ ] Produkte in App Store Connect erstellt (`premium_weekly`, `premium_yearly`)
- [ ] App Store Connect mit RevenueCat verbunden
- [ ] Entitlement `pro` erstellt
- [ ] Offering mit Packages erstellt
- [ ] API Keys kopiert
- [ ] API Keys in `purchases.js` eingetragen
- [ ] Plugin in `app.json` hinzugefügt
- [ ] Development Build erstellt
- [ ] Sandbox Account erstellt
- [ ] In-App-Kauf getestet
- [ ] Restore Purchases getestet
- [ ] Production Build erstellt

---

## 📚 Weitere Ressourcen

- [RevenueCat Dokumentation](https://docs.revenuecat.com/)
- [RevenueCat React Native Guide](https://www.revenuecat.com/docs/react-native)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [RevenueCat Community](https://community.revenuecat.com/)

---

## 🆘 Support

Falls du Probleme hast:
1. Prüfe die RevenueCat Dashboard Logs
2. Prüfe die Console-Logs in der App
3. Stelle sicher, dass alle IDs übereinstimmen
4. Teste mit einem Sandbox Account

**Viel Erfolg! 🚀**

