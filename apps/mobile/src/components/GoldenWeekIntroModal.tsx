import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, ImageBackground, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { quitData } from '@/utils/quitData';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    title: "Die Goldene Woche",
    subtitle: "Dein kritisches Fenster zum Erfolg.",
    desc: "Wissenschaftliche Studien zeigen: Wer die ersten 7 Tage rauchfrei bleibt, erhöht seine langfristige Erfolgschance um 900%.",
    icon: "flame",
    color: "#FFD700"
  },
  {
    title: "Neuroplastizität",
    subtitle: "Dein Gehirn baut sich um.",
    desc: "In diesen 7 Tagen werden die stärksten neuronalen Verbindungen zur Sucht gekappt. Es ist der härteste Kampf, aber der wichtigste Sieg.",
    icon: "git-network", // Brain connection metaphor
    color: "#FFD700"
  },
  {
    title: "Einmalige Chance",
    subtitle: "Nur ein Versuch.",
    desc: "Diese Herausforderung ist einmalig. Wenn du sie brichst, verschwindet sie für immer. Zeig dir selbst, dass du es ernst meinst.",
    icon: "lock-closed",
    color: "#FF4500" // Red/Orange for urgency
  }
];

export const GoldenWeekIntroModal = ({ visible, onClose }) => {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Ref to track if we are already closing (to prevent double taps)
  const isClosing = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosing.current = false; // Reset on open
      animateIn();
    } else {
        // Reset state when closed, ready for next time
        setStep(0);
    }
  }, [visible]);

  // Handle step transitions smoothly
  // Instead of fading out whole card, we just want to update content?
  // User asked for smooth transition between slides, NOT "black out and in".
  // So we will animate the CONTENT opacity, not the whole card.
  
  const contentOpacity = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    contentOpacity.setValue(1);
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
    ]).start();
  };

  const handleNext = async () => {
    if (isClosing.current) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (step < SLIDES.length - 1) {
        // Smooth Transition: Fade content out slightly, change state, fade back in
        Animated.timing(contentOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true
        }).start(() => {
            setStep(prev => prev + 1);
            
            // Fade In
            Animated.timing(contentOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }).start();
        });
    } else {
      // Done
      isClosing.current = true;
      await quitData.setGoldenWeekIntroSeen();
      
      // Animate Out
      Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 50, duration: 300, useNativeDriver: true })
      ]).start(() => {
          onClose();
      });
    }
  };

  if (!visible) return null;

  const currentSlide = SLIDES[step];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none" // Wir machen unsere eigene Animation
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.container}>
          
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
                colors={['#1A1F2B', '#000000']}
                style={StyleSheet.absoluteFill}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            />
            
            <Animated.View style={{ width: '100%', alignItems: 'center', opacity: contentOpacity }}>
                {/* Top Icon Area */}
                <View style={styles.iconArea}>
                <View style={[styles.iconCircle, { borderColor: currentSlide.color }]}>
                    <Ionicons name={currentSlide.icon} size={40} color={currentSlide.color} />
                </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                <Text style={[styles.label, { color: currentSlide.color }]}>{currentSlide.title}</Text>
                <Text style={styles.headline}>{currentSlide.subtitle}</Text>
                <Text style={styles.text}>{currentSlide.desc}</Text>
                </View>
            </Animated.View>

            {/* Pagination dots (Static position, dynamic style) */}
            <View style={styles.dots}>
               {SLIDES.map((slide, i) => (
                   <View key={i} style={[styles.dot, i === step ? { backgroundColor: slide.color, width: 24 } : {}]} />
               ))}
            </View>

            {/* Button */}
            <TouchableOpacity onPress={handleNext} activeOpacity={0.8} style={styles.button}>
                <LinearGradient
                    colors={[currentSlide.color, step === 2 ? '#FF4500' : '#B8860B']}
                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                    style={styles.btnGradient}
                >
                    <Text style={styles.btnText}>
                        {step === SLIDES.length - 1 ? "Ich nehme an" : "Weiter"}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#121217" />
                </LinearGradient>
            </TouchableOpacity>

          </Animated.View>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#121217',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  iconArea: {
      marginBottom: 30,
      marginTop: 10
  },
  iconCircle: {
      width: 80, height: 80, borderRadius: 40,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  content: {
      alignItems: 'center',
      marginBottom: 30
  },
  label: {
      fontFamily: 'Inter_700Bold',
      fontSize: 12,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 10
  },
  headline: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 24,
      color: '#FFF',
      textAlign: 'center',
      marginBottom: 16
  },
  text: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: '#CCC',
      textAlign: 'center',
      lineHeight: 24
  },
  dots: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 30
  },
  dot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.2)'
  },
  button: {
      width: '100%'
  },
  btnGradient: {
      paddingVertical: 16,
      borderRadius: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10
  },
  btnText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 16,
      color: '#121217'
  }
});

