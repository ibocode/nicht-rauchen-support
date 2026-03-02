import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { BlurView } from 'expo-blur';
import { PALETTE, SPACING, RADIUS } from '@/constants/theme';

// App Store URL - wird nach Veröffentlichung aktualisiert
// Aktuell: Platzhalter aus app.json (wird nach App Store Veröffentlichung durch echte URL ersetzt)
const APP_STORE_URL = 'https://apps.apple.com/app/nicht-rauchen/id1234567890';

export const AppReviewModal = ({ visible, onClose, onReview }) => {
  const handleReview = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Versuche zuerst die native Store Review API
    try {
      const StoreReview = require('expo-store-review');
      const isAvailable = await StoreReview.isAvailableAsync();
      
      if (isAvailable) {
        await StoreReview.requestReview();
        onReview?.();
        onClose();
        return;
      }
    } catch (error) {
      console.log('Native review not available, opening App Store');
    }
    
    // Fallback: Öffne App Store direkt
    try {
      await Linking.openURL(APP_STORE_URL);
      onReview?.();
      onClose();
    } catch (error) {
      console.error('Error opening App Store:', error);
    }
  };

  const handleLater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/icon.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              Gefällt dir "Nicht Rauchen"?
            </Text>

            {/* Message */}
            <Text style={styles.message}>
              Wir würden uns sehr über eine Bewertung im App Store freuen! Dein Feedback hilft uns, die App weiter zu verbessern.
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleReview}
                activeOpacity={0.8}
                style={styles.reviewButton}
              >
                <LinearGradient
                  colors={[PALETTE.dark.primary, '#2DD4BF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.reviewButtonGradient}
                >
                  <Ionicons name="star" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.reviewButtonText}>Jetzt bewerten</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLater}
                style={styles.laterButton}
              >
                <Text style={styles.laterButtonText}>Vielleicht später</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  content: {
    backgroundColor: PALETTE.dark.background[1],
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: PALETTE.dark.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: PALETTE.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: PALETTE.dark.border,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: PALETTE.dark.text,
    textAlign: 'center',
    marginBottom: SPACING.m,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: PALETTE.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.m,
  },
  reviewButton: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    shadowColor: PALETTE.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  reviewButtonGradient: {
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFF',
  },
  laterButton: {
    paddingVertical: SPACING.m,
    alignItems: 'center',
  },
  laterButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: PALETTE.dark.textMuted,
  },
});

