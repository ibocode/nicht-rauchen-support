# APPLE IDS FINDEN - SCHRITT-FÜR-SCHRITT ANLEITUNG

## 🍎 APP STORE CONNECT (https://appstoreconnect.apple.com)

### 1. ASC APP ID FINDEN:
1. **Gehe zu App Store Connect**
2. **Klicke auf "My Apps"**
3. **Erstelle neue App** (falls noch nicht vorhanden):
   - App Name: "Nicht Rauchen"
   - Bundle ID: "com.nichtrauchen.app"
   - Primary Language: Deutsch
4. **Nach App-Erstellung:**
   - Gehe zur App-Detailseite
   - **ASC App ID** steht oben rechts (z.B. "1234567890")
   - Oder in der URL: `https://appstoreconnect.apple.com/apps/1234567890`

### 2. APPLE TEAM ID FINDEN:
1. **Gehe zu App Store Connect**
2. **Klicke auf deinen Namen** (oben rechts)
3. **Klicke auf "Membership"**
4. **Team ID** steht unter "Team ID" (z.B. "ABCD123456")

### 3. APPLE ID (E-MAIL):
- Das ist deine **Apple ID E-Mail-Adresse**
- Die gleiche, mit der du dich bei App Store Connect anmeldest

## 📱 ALTERNATIVE WEGE:

### ÜBER XCODE:
1. **Öffne Xcode**
2. **Gehe zu Preferences > Accounts**
3. **Wähle dein Apple ID**
4. **Klicke auf "Manage Certificates"**
5. **Team ID** wird angezeigt

### ÜBER DEVELOPER PORTAL:
1. **Gehe zu:** https://developer.apple.com/account
2. **Klicke auf "Membership"**
3. **Team ID** steht dort

## 🔧 IN EAS.JSON EINTRAGEN:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "deine-email@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

## ⚠️ WICHTIGE HINWEISE:

- **ASC App ID:** Nur verfügbar NACH App-Erstellung in App Store Connect
- **Team ID:** Immer verfügbar, auch ohne App
- **Apple ID:** Deine E-Mail-Adresse für Apple-Services

## 🚀 NÄCHSTE SCHRITTE:

1. **App Store Connect** App erstellen
2. **IDs notieren**
3. **In eas.json eintragen**
4. **Build submiten**
