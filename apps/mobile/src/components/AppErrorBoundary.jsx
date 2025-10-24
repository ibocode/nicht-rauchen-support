import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Aktualisiere state, damit der nächste Render die Fallback-UI zeigt
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logge den Fehler
    const errorId = Date.now().toString();
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Speichere Fehler für Debugging
    this.logError(error, errorInfo, errorId);
    
    // Haptisches Feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  logError = async (error, errorInfo, errorId) => {
    try {
      const errorLog = {
        id: errorId,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'React Native',
        platform: typeof Platform !== 'undefined' ? Platform.OS : 'unknown'
      };

      // Speichere in AsyncStorage für Debugging
      const existingErrors = await AsyncStorage.getItem('app_errors');
      const errors = existingErrors ? JSON.parse(existingErrors) : [];
      errors.push(errorLog);
      
      // Behalte nur die letzten 10 Fehler
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      
      await AsyncStorage.setItem('app_errors', JSON.stringify(errors));
      
      // In Production: Sende an Crash Reporting Service
      if (!__DEV__) {
        // Hier würde man z.B. Sentry, Crashlytics oder ähnliches verwenden
        console.log('Error would be sent to crash reporting service:', errorLog);
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  handleReportError = () => {
    const { error, errorId } = this.state;
    
    Alert.alert(
      'Fehler melden',
      'Möchten Sie diesen Fehler an das Entwicklungsteam melden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Melden', 
          onPress: () => {
            // Hier würde man den Fehler an den Support senden
            Alert.alert(
              'Danke!', 
              'Der Fehler wurde gemeldet. Wir arbeiten daran, das Problem zu beheben.'
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😵</Text>
            <Text style={styles.title}>Oops! Etwas ist schiefgelaufen</Text>
            <Text style={styles.message}>
              Die App ist auf ein unerwartetes Problem gestoßen. 
              Keine Sorge - deine Daten sind sicher!
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.message}
                </Text>
                <Text style={styles.debugText}>
                  Error ID: {this.state.errorId}
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={this.handleRetry}
              >
                <Text style={styles.primaryButtonText}>Erneut versuchen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={this.handleReportError}
              >
                <Text style={styles.secondaryButtonText}>Fehler melden</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081023',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  debugInfo: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3BFF91',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3BFF91',
  },
  secondaryButtonText: {
    color: '#3BFF91',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppErrorBoundary;
