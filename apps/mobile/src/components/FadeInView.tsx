import React, { useRef, useCallback } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PALETTE } from '@/constants/theme';

/**
 * Wrapper Component for Tab Screens to prevent White Flash
 * and provide a smooth fade-in animation on focus.
 */
export const FadeInView = ({ children, style, duration = 250 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      // Reset opacity to 0 immediately when screen comes into focus
      fadeAnim.setValue(0); 
      
      // Start animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }).start();
      
      return () => {
        // Optional: Cleanup if needed
      };
    }, [duration])
  );

  return (
    // Outer container has solid background color to cover navigation white flash
    <View style={styles.container}> 
       <Animated.View style={[styles.inner, style, { opacity: fadeAnim }]}>
         {children}
       </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Using strict dark background to prevent white flashes from navigation
    backgroundColor: '#121217', 
  },
  inner: {
    flex: 1,
  }
});

