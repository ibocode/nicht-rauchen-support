import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Image, Dimensions, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Animation Timing Constants
const TIMING = {
  MINIMUM_DISPLAY: 1500, // Etwas länger für Branding-Effekt
  FADE_OUT: 800,         // Langsames, smoothes Ausblenden
};

const { width, height } = Dimensions.get('window');

const SplashScreenComponent = ({ isReady, onFinish }) => {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  
  const mountTimeRef = useRef(Date.now());
  const timeoutRef = useRef(null);
  const fadeOutAnimationRef = useRef(null);
  const hasHiddenNativeSplash = useRef(false);
  const onFinishRef = useRef(onFinish);
  
  // Halte onFinish Ref aktuell
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // Fade-out Animation when ready
  useEffect(() => {
    if (!isReady) return;

    const hideSplash = async () => {
      // Verhindere mehrfache Aufrufe
      if (hasHiddenNativeSplash.current) return;
      hasHiddenNativeSplash.current = true;

      try {
        // Verstecke den nativen Splash Screen SOFORT, damit unser (identischer) Screen übernimmt
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('Error hiding splash screen:', error);
      }
      
      // Berechne Restzeit
      const elapsedTime = Date.now() - mountTimeRef.current;
      const remainingTime = Math.max(0, TIMING.MINIMUM_DISPLAY - elapsedTime);
      
      // Warte die Restzeit, dann starte Fade-out Transition
      timeoutRef.current = setTimeout(() => {
        const fadeOutAnimation = Animated.parallel([
          // Container wird transparent -> Homescreen kommt zum Vorschein
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: TIMING.FADE_OUT,
            useNativeDriver: true,
          }),
          // Logo zoomt leicht rein beim Verschwinden (moderner Effekt)
          Animated.timing(logoScale, {
            toValue: 1.1,
            duration: TIMING.FADE_OUT,
            useNativeDriver: true,
          }),
        ]);
        
        fadeOutAnimation.start(({ finished }) => {
          if (finished) {
            onFinishRef.current();
          }
        });
        
        fadeOutAnimationRef.current = fadeOutAnimation;
      }, remainingTime);
    };

    hideSplash();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (fadeOutAnimationRef.current) {
        fadeOutAnimationRef.current.stop();
      }
    };
  }, [isReady]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: containerOpacity },
      ]}
      pointerEvents="none" // Klicks gehen durch während Fade-Out (optional, aber gut für UX)
    >
      <Animated.View
        style={{
          transform: [{ scale: logoScale }],
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}
      >
        <Image
          // WICHTIG: Exakt das gleiche Bild wie im nativen Splash (app.json)
          source={require('../../assets/images/splash-icon.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121217', // Exakte Brand Color aus app.json
    zIndex: 99999, // Immer ganz oben
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    // Versuchen, die native Größe zu matchen. 
    // 'contain' mit 100% Breite/Höhe ist oft am sichersten für Full-Screen Splash Images,
    // aber app.json sagt "imageWidth": 200. Wir nehmen hier einen vernünftigen Wert.
    width: '100%', 
    height: '100%',
    maxWidth: 400, // Begrenzung damit es auf Tablets nicht riesig wird
    maxHeight: 400,
  },
});

export default SplashScreenComponent;

