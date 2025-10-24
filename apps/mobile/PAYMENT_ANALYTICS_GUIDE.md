# 💳 Payment & Analytics Setup - Komplette Anleitung

## 🎯 Übersicht

Diese Anleitung zeigt dir, wie du ein professionelles Payment-System mit Analytics für deine "Nicht Rauchen" App einrichtest.

## 📊 Was du tracken kannst

### **App-Metriken**
- App-Starts und Sessions
- Check-ins (erfolgreich/gescheitert)
- Widget-Nutzung
- Push-Benachrichtigungs-Interaktionen
- Einstellungsänderungen
- User-Engagement

### **Revenue-Metriken**
- Subscription-Käufe
- Revenue-Tracking
- Churn-Rate
- Conversion-Rate
- User-Lifetime-Value

## 🛠 Setup-Schritte

### 1. **RevenueCat Setup**

#### **RevenueCat Account erstellen**
1. Gehe zu [revenuecat.com](https://revenuecat.com)
2. Erstelle einen kostenlosen Account
3. Erstelle ein neues Projekt für deine App

#### **App Store Connect konfigurieren**
1. Gehe zu [App Store Connect](https://appstoreconnect.apple.com)
2. Erstelle In-App-Purchase Produkte:
   - **Produkt-ID**: `premium_monthly`
   - **Typ**: Auto-Renewable Subscription
   - **Preis**: 6,99€/Monat
   - **Beschreibung**: Premium-Features für Nicht-Rauchen App

3. Erstelle jährliches Abo:
   - **Produkt-ID**: `premium_yearly`
   - **Typ**: Auto-Renewable Subscription
   - **Preis**: 59,99€/Jahr (2 Monate gratis)

#### **RevenueCat konfigurieren**
1. In RevenueCat Dashboard:
   - Füge deine App hinzu
   - Konfiguriere App Store Connect Integration
   - Erstelle Entitlements:
     - `premium` (für beide Produkte)

2. Hole deine API Keys:
   - iOS API Key: `appl_xxxxxxxxxx`
   - Android API Key: `goog_xxxxxxxxxx`

3. Aktualisiere `subscriptionService.js`:
```javascript
const REVENUECAT_API_KEY = {
  ios: 'appl_YOUR_ACTUAL_IOS_API_KEY',
  android: 'goog_YOUR_ACTUAL_ANDROID_API_KEY',
};
```

### 2. **Analytics Setup**

#### **Firebase Analytics (Optional)**
1. Gehe zu [Firebase Console](https://console.firebase.google.com)
2. Erstelle ein neues Projekt
3. Füge iOS-App hinzu mit Bundle ID: `com.nichtrauchen.app`
4. Lade `GoogleService-Info.plist` herunter
5. Füge es zu `apps/mobile/` hinzu

#### **Alternative Analytics Services**
- **Mixpanel**: Für erweiterte User-Analytics
- **Amplitude**: Für Product Analytics
- **Custom Analytics**: Lokale Speicherung (bereits implementiert)

### 3. **App-Konfiguration**

#### **app.json aktualisieren**
```json
{
  "expo": {
    "plugins": [
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

#### **EAS Build konfigurieren**
```bash
# EAS Build mit RevenueCat
eas build --platform ios --profile production
```

## 💰 Payment-Flow

### **1. Subscription kaufen**
```javascript
import { useSubscription } from '@/utils/subscriptionService';

const { purchaseSubscription, availableProducts } = useSubscription();

const handlePurchase = async () => {
  const result = await purchaseSubscription(availableProducts[0]);
  if (result.success) {
    // Subscription aktiviert
    console.log('Kauf erfolgreich!');
  }
};
```

### **2. Subscription Status prüfen**
```javascript
const { subscriptionStatus } = useSubscription();

if (subscriptionStatus.isActive) {
  // Premium Features freischalten
  console.log('Premium aktiv!');
}
```

### **3. Restore Purchases**
```javascript
const { restorePurchases } = useSubscription();

const handleRestore = async () => {
  const result = await restorePurchases();
  if (result.success) {
    console.log('Purchases wiederhergestellt!');
  }
};
```

## 📈 Analytics-Integration

### **1. Events tracken**
```javascript
import { analyticsService } from '@/utils/analyticsService';

// App-Start tracken
await analyticsService.trackAppOpen();

// Check-in tracken
await analyticsService.trackCheckIn('success');

// Subscription-Kauf tracken
await analyticsService.trackSubscriptionPurchase(
  'premium_monthly', 
  6.99, 
  'EUR'
);
```

### **2. User Properties setzen**
```javascript
await analyticsService.setUserProperties({
  streak_count: 15,
  subscription_status: 'active',
  app_version: '1.0.0',
});
```

### **3. Metriken abrufen**
```javascript
const metrics = await analyticsService.getAppMetrics();
console.log('App Metriken:', metrics);
```

## 🎛 Dashboard verwenden

### **Analytics Dashboard öffnen**
1. Füge Analytics-Tab zur App hinzu
2. Öffne das Dashboard
3. Sieh dir alle Metriken an:
   - App-Starts
   - Check-ins
   - Revenue
   - Engagement

### **Daten exportieren**
```javascript
const exportData = await analyticsService.exportEvents();
// Daten für externe Analyse verwenden
```

## 📊 Wichtige Metriken

### **App Performance**
- **DAU (Daily Active Users)**: Tägliche aktive Nutzer
- **MAU (Monthly Active Users)**: Monatliche aktive Nutzer
- **Session Duration**: Durchschnittliche Session-Länge
- **Retention Rate**: Nutzer-Rückkehr-Rate

### **Revenue Metriken**
- **ARPU (Average Revenue Per User)**: Durchschnittlicher Revenue pro Nutzer
- **ARPPU (Average Revenue Per Paying User)**: Revenue pro zahlendem Nutzer
- **Conversion Rate**: Freemium zu Premium Conversion
- **Churn Rate**: Abonnement-Kündigungsrate

### **Engagement Metriken**
- **Check-in Success Rate**: Erfolgsrate der Check-ins
- **Widget Usage**: Widget-Nutzung
- **Notification CTR**: Click-Through-Rate von Benachrichtigungen
- **Feature Adoption**: Feature-Nutzung

## 🔧 Troubleshooting

### **RevenueCat Probleme**
```bash
# Credentials neu konfigurieren
eas credentials

# Build-Logs prüfen
eas build:list
eas build:view [BUILD_ID]
```

### **Analytics Probleme**
- Prüfe, ob Events korrekt getrackt werden
- Überprüfe lokale Speicherung
- Teste auf verschiedenen Geräten

### **Payment-Probleme**
- Teste mit Sandbox-Accounts
- Prüfe App Store Connect Konfiguration
- Überprüfe RevenueCat Dashboard

## 📱 Testing

### **Sandbox Testing**
1. Erstelle Sandbox-Tester in App Store Connect
2. Verwende Test-Accounts für In-App-Purchases
3. Teste alle Payment-Flows

### **Analytics Testing**
1. Teste alle Events
2. Prüfe Dashboard-Funktionalität
3. Teste Datenexport

## 🚀 Production Deployment

### **1. RevenueCat Production**
- Aktiviere Production-Modus
- Konfiguriere echte Produkte
- Teste mit echten Käufen

### **2. Analytics Production**
- Aktiviere Production-Tracking
- Konfiguriere externe Services
- Überwache Metriken

### **3. Monitoring**
- Überwache Revenue-Dashboard
- Prüfe Analytics-Metriken
- Reagiere auf Anomalien

## 💡 Best Practices

### **Payment**
- Biete kostenlose Testphase
- Klare Preisgestaltung
- Einfacher Kaufprozess
- Restore-Funktionalität

### **Analytics**
- Tracke nur relevante Events
- Respektiere Datenschutz
- Verwende anonymisierte Daten
- Regelmäßige Datenbereinigung

### **User Experience**
- Transparente Pricing
- Klare Feature-Unterscheidung
- Einfache Kündigung
- Guter Support

## 📞 Support

### **RevenueCat Support**
- [RevenueCat Dokumentation](https://docs.revenuecat.com/)
- [RevenueCat Community](https://community.revenuecat.com/)

### **Apple Developer Support**
- [App Store Connect Hilfe](https://developer.apple.com/help/app-store-connect/)
- [In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)

### **Firebase Support**
- [Firebase Dokumentation](https://firebase.google.com/docs)
- [Firebase Community](https://firebase.google.com/community/)

## 🎯 Nächste Schritte

1. **RevenueCat Account** erstellen
2. **App Store Connect** Produkte konfigurieren
3. **API Keys** in Code einfügen
4. **Payment-Flow** testen
5. **Analytics** implementieren
6. **Dashboard** verwenden
7. **Production** deployen

---

**Mit diesem Setup hast du ein professionelles Payment- und Analytics-System! 🚀**
