import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Animated, Dimensions, ImageBackground } from 'react-native';
import { Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { quitData } from '@/utils/quitData';
import { PALETTE, RADIUS, SPACING } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// --- TASKS CONTENT ---
const CHALLENGE_DAYS = [
  {
    day: 1,
    title: "Der Pakt",
    desc: "Der Anfang ist gemacht. Heute schwörst du dir selbst die Treue.",
    task: "Unterschreibe deinen inneren Vertrag.",
    icon: "document-text",
    action: "contract"
  },
  {
    day: 2,
    title: "Erkenne den Feind",
    desc: "Sucht versteckt sich in Gewohnheiten. Wann greifst du zur Zigarette?",
    task: "Identifiziere deine 3 stärksten Trigger.",
    icon: "eye",
    action: "journal"
  },
  {
    day: 3,
    title: "Die Welle reiten",
    desc: "Tag 3 ist physiologisch der Gipfel. Der Drang wird kommen. Sei bereit.",
    task: "Nutze die SOS-Funktion, wenn es brennt.",
    icon: "flame",
    action: "sos" // Special Link to SOS
  },
  {
    day: 4,
    title: "Neue Belohnungen",
    desc: "Dein Gehirn sucht Dopamin. Gib ihm etwas Besseres als Nikotin.",
    task: "Gönn dir heute bewusst etwas Kleines.",
    icon: "gift",
    action: "generic"
  },
  {
    day: 5,
    title: "Atme Freiheit",
    desc: "Deine Lunge beginnt sich zu reinigen. Spürst du es?",
    task: "Mache eine 2-minütige Atemübung.",
    icon: "leaf",
    action: "breathe" 
  },
  {
    day: 6,
    title: "Der neue Fokus",
    desc: "Du bist kein 'Raucher, der aufhört'. Du bist ein Nichtraucher.",
    task: "Schreibe einen Satz auf: 'Ich bin frei, weil...'",
    icon: "pencil",
    action: "journal"
  },
  {
    day: 7,
    title: "Gold Status",
    desc: "Eine Woche. Die Hölle durchquert. Der Sieg gehört dir.",
    task: "Hole dir dein Goldenes Abzeichen.",
    icon: "trophy",
    action: "claim"
  }
];

export const GoldenWeekCard = () => {
  const router = useRouter();
  const [challengeState, setChallengeState] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0); // 0-based index for viewing details

  useEffect(() => {
    checkStatus();
  }, []);

  // Refresh when component becomes visible (e.g., when navigating back to today tab)
  useEffect(() => {
    const refresh = () => checkStatus();
    // Refresh immediately and then on focus
    refresh();
    // Also refresh periodically while component is mounted (but less aggressive)
    const interval = setInterval(refresh, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);


  const checkStatus = async () => {
    let state = await quitData.getGoldenWeek();
    
    // Auto-Start only if not started AND user is verified as paid
    if (state.status === 'not_started') {
        try {
          // Check if user has completed onboarding (basic check)
          const isPro = await quitData.isProUser();
          if (isPro) {
            state = await quitData.startGoldenWeek();
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          // Don't auto-start if verification fails
        }
    }
    
    setChallengeState(state);
  };

  const handleCompleteTask = async () => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
     
     // Close detail modal
     setModalVisible(false);
     
     // Complete the day (no parameter needed - reads fresh state)
     const newState = await quitData.completeGoldenDay();
     
     // Update state
     setChallengeState(newState);
  };
  
  const handleCardPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Open detailed view logic here (Modal)
      setModalVisible(true);
  };

  // Hide completely if failed or not started
  if (!challengeState || challengeState.status === 'failed' || challengeState.status === 'not_started') {
      return null; 
  }

  // Hide completed card after 7 days (only show in Serie tab)
  if (challengeState.status === 'completed') {
      // Check if completed more than 7 days ago
      if (challengeState.lastCompletionDate) {
          // lastCompletionDate is stored as "YYYY-MM-DD"
          const completedDate = new Date(challengeState.lastCompletionDate + 'T00:00:00'); // Local midnight
          const daysSinceCompletion = Math.floor((new Date() - completedDate) / (1000 * 60 * 60 * 24));
          if (daysSinceCompletion > 7) {
              return null; // Hide after 7 days
          }
      }
      
      // Show for first 7 days after completion
      return (
        <View style={[styles.card, { borderColor: '#FFD700', borderWidth: 2 }]}>
             <LinearGradient
                colors={['rgba(255, 215, 0, 0.15)', 'transparent']}
                style={StyleSheet.absoluteFill}
             />
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                 <Ionicons name="trophy" size={32} color="#FFD700" />
                 <View style={{ flex: 1 }}>
                     <Text style={[styles.title, { color: '#FFD700' }]}>Goldene Woche gemeistert</Text>
                     <Text style={styles.sub}>Du bist eine Legende. Sieh dir deinen Erfolg in der Serie an.</Text>
                 </View>
             </View>
        </View>
      );
  }

  const currentDayIndex = Math.min(challengeState.progress, 6);
  const currentTask = CHALLENGE_DAYS[currentDayIndex];
  // lastCompletionDate is now stored as date string (YYYY-MM-DD) using local timezone
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isTodayDone = challengeState.lastCompletionDate === todayStr;

  return (
    <>
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.95}>
        <View style={styles.card}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#1A1F2B', '#000000']}
                style={StyleSheet.absoluteFill}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            />
            
            {/* Gold Accents */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#FFD700', opacity: 0.5 }} />
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 60, height: 60, backgroundColor: '#FFD700', opacity: 0.05, borderRadius: 30, transform: [{translateX: 20}, {translateY: 20}] }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.headerText}>DIE GOLDENE WOCHE</Text>
                    </View>
                    <Text style={styles.title}>Tag {currentDayIndex + 1}: {currentTask.title}</Text>
                </View>
                <View style={styles.iconContainer}>
                     <Ionicons name={currentTask.icon} size={20} color="#121217" />
                </View>
            </View>

            <Text style={styles.desc} numberOfLines={2}>{currentTask.desc}</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                {CHALLENGE_DAYS.map((_, idx) => (
                    <View 
                        key={idx} 
                        style={[
                            styles.progressSegment, 
                            idx < currentDayIndex ? styles.segmentDone : 
                            idx === currentDayIndex ? styles.segmentActive : styles.segmentPending
                        ]} 
                    />
                ))}
            </View>
            
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: '#FFD700', fontSize: 10, fontFamily: 'Inter_600SemiBold', opacity: 0.8 }}>
                    {isTodayDone ? "Für heute erledigt" : "Tippen zum Starten"}
                </Text>
                {!isTodayDone && <Ionicons name="arrow-forward" size={16} color="#FFD700" />}
            </View>
        </View>
    </TouchableOpacity>

    {/* --- DETAIL MODAL --- */}
    <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
    >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.modalContent}>
                <TouchableOpacity 
                    onPress={() => setModalVisible(false)} 
                    style={styles.closeBtn}
                >
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
                    <View style={{ alignItems: 'center', marginBottom: 30 }}>
                        <View style={{ 
                            width: 80, height: 80, borderRadius: 40, 
                            backgroundColor: 'rgba(255, 215, 0, 0.1)', 
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 1, borderColor: '#FFD700',
                            marginBottom: 20
                        }}>
                             <Ionicons name={currentTask.icon} size={40} color="#FFD700" />
                        </View>
                        <Text style={styles.modalTitle}>Tag {currentDayIndex + 1}</Text>
                        <Text style={styles.modalHeadline}>{currentTask.title}</Text>
                    </View>

                    <Text style={styles.modalBody}>
                        {currentTask.desc}
                    </Text>

                    <View style={styles.taskBox}>
                        <Text style={styles.taskLabel}>DEINE AUFGABE:</Text>
                        <Text style={styles.taskText}>{currentTask.task}</Text>
                    </View>
                    
                    {currentTask.action === 'sos' && (
                         <TouchableOpacity 
                            onPress={() => { setModalVisible(false); router.push('/(tabs)/streak'); }} 
                            style={styles.actionLink}
                        >
                            <Text style={styles.actionLinkText}>Zum SOS-Modus gehen</Text>
                            <Ionicons name="arrow-forward" size={14} color="#FFD700" />
                         </TouchableOpacity>
                    )}

                    <View style={{ height: 40 }} />

                    {!isTodayDone ? (
                        <TouchableOpacity 
                            onPress={async () => {
                                // First ensure user is checked in as success today
                                const today = new Date();
                                const todayStatus = await quitData.getDayStatus(today);
                                
                                if (todayStatus !== 'success') {
                                    // Auto-check in as success if not already done
                                    await quitData.setDayStatus(today, 'success');
                                }
                                
                                // Now complete the task
                                await handleCompleteTask();
                            }}
                            style={styles.completeBtn}
                        >
                            <LinearGradient
                                colors={['#FFD700', '#B8860B']}
                                style={StyleSheet.absoluteFill}
                                start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                            />
                            <Text style={styles.completeBtnText}>Herausforderung abschließen</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.completedBadge}>
                             <Ionicons name="checkmark-circle" size={20} color="#000" />
                             <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#000' }}>Erledigt</Text>
                        </View>
                    )}

                </ScrollView>
            </View>
        </BlurView>
    </Modal>

    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1F2B',
    borderRadius: RADIUS.l,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)', // Gold Border
    minHeight: 160,
    justifyContent: 'space-between'
  },
  headerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#FFD700',
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#FFF',
    marginTop: 4
  },
  sub: {
      fontFamily: 'Inter_400Regular',
      color: '#999',
      fontSize: 12
  },
  desc: {
      fontFamily: 'Inter_400Regular',
      color: '#CCC',
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 12
  },
  iconContainer: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: '#FFD700',
      alignItems: 'center', justifyContent: 'center'
  },
  progressContainer: {
      flexDirection: 'row',
      gap: 4,
      marginTop: 'auto'
  },
  progressSegment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
  },
  segmentDone: { backgroundColor: '#FFD700' },
  segmentActive: { backgroundColor: '#FFF' },
  segmentPending: { backgroundColor: 'rgba(255,255,255,0.1)' },
  
  // Modal
  modalContent: {
      flex: 1,
      marginTop: 60,
      backgroundColor: '#121217',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      overflow: 'hidden'
  },
  closeBtn: {
      position: 'absolute', top: 20, right: 20, zIndex: 10,
      width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20
  },
  modalTitle: {
      fontFamily: 'Inter_700Bold', color: '#FFD700', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8
  },
  modalHeadline: {
      fontFamily: 'Poppins_700Bold', color: '#FFF', fontSize: 28, textAlign: 'center'
  },
  modalBody: {
      fontFamily: 'Inter_400Regular', color: '#CCC', fontSize: 16, lineHeight: 26, textAlign: 'center', marginBottom: 40
  },
  taskBox: {
      backgroundColor: 'rgba(255, 215, 0, 0.05)',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      borderWidth: 1,
      borderRadius: RADIUS.m,
      padding: SPACING.l,
      alignItems: 'center'
  },
  taskLabel: {
      fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFD700', marginBottom: 8, letterSpacing: 1
  },
  taskText: {
      fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#FFF', textAlign: 'center'
  },
  completeBtn: {
      height: 56, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 20
  },
  completeBtnText: {
      fontFamily: 'Poppins_600SemiBold', color: '#121217', fontSize: 16
  },
  completedBadge: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: '#FFD700', paddingVertical: 12, borderRadius: RADIUS.full, marginTop: 20
  },
  actionLink: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16,
      padding: 10
  },
  actionLinkText: {
      color: '#FFD700', fontFamily: 'Inter_600SemiBold', fontSize: 14
  }
});

