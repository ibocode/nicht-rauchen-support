import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quitData } from './quitData';

const STORAGE_KEY = 'app_store_review_asked';

/**
 * Prüft, ob der Nutzer bereits nach einer Bewertung gefragt wurde
 */
async function hasAskedForReview() {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking review status:', error);
    return false;
  }
}

/**
 * Markiert, dass der Nutzer bereits nach einer Bewertung gefragt wurde
 */
async function markReviewAsAsked() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  } catch (error) {
    console.error('Error marking review as asked:', error);
  }
}

/**
 * Prüft, ob dies der erste erfolgreiche Check-in ist
 */
async function isFirstSuccessfulCheckIn() {
  try {
    const checkIns = await quitData.getCheckIns();
    const successCheckIns = Object.values(checkIns).filter(
      (checkIn) => checkIn.status === 'success'
    );
    
    // Wenn genau 1 erfolgreicher Check-in existiert, ist es der erste
    return successCheckIns.length === 1;
  } catch (error) {
    console.error('Error checking first check-in:', error);
    return false;
  }
}

/**
 * Zeigt die App Store Bewertungsaufforderung an (nur wenn verfügbar)
 */
async function requestReview() {
  try {
    // Prüfe, ob Store Review verfügbar ist
    const isAvailable = await StoreReview.isAvailableAsync();
    
    if (isAvailable) {
      await StoreReview.requestReview();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting review:', error);
    return false;
  }
}

/**
 * Prüft, ob die Bewertungsaufforderung angezeigt werden soll
 * - Nur beim ersten erfolgreichen Check-in
 * - Nur wenn noch nicht gefragt wurde
 */
export async function shouldShowAppReview() {
  try {
    // 1. Prüfe, ob bereits gefragt wurde
    const alreadyAsked = await hasAskedForReview();
    if (alreadyAsked) {
      return false;
    }

    // 2. Prüfe, ob dies der erste erfolgreiche Check-in ist
    const isFirstCheckIn = await isFirstSuccessfulCheckIn();
    if (!isFirstCheckIn) {
      return false;
    }

    // 3. Markiere als gefragt (BEVOR wir fragen, damit es auch bei Fehlern nicht wiederholt wird)
    await markReviewAsAsked();

    return true;
  } catch (error) {
    console.error('Error in shouldShowAppReview:', error);
    return false;
  }
}

/**
 * Hauptfunktion: Prüft alle Bedingungen und zeigt die Bewertung an
 * - Nur beim ersten erfolgreichen Check-in
 * - Nur wenn noch nicht gefragt wurde
 * - Mit Verzögerung nach dem Check-in
 * @deprecated Verwende shouldShowAppReview() und zeige AppReviewModal stattdessen
 */
export async function maybeRequestAppStoreReview() {
  try {
    const shouldShow = await shouldShowAppReview();
    if (!shouldShow) {
      return false;
    }

    // Zeige die native Bewertung an (Fallback)
    const success = await requestReview();
    return success;
  } catch (error) {
    console.error('Error in maybeRequestAppStoreReview:', error);
    return false;
  }
}

