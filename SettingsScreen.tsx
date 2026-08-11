import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { alarmSoundOptions, saveAlarmSound, type AlarmSound } from './alarmSettings';
import { testAlarmSound } from './notificationService';
import { settingsStyles as styles } from './settingsStyles';

const previewSources: Record<AlarmSound, number> = {
  default: require('./assets/sounds/market-bell.wav'),
  'market-bell.wav': require('./assets/sounds/market-bell.wav'),
  'gentle-chime.wav': require('./assets/sounds/gentle-chime.wav'),
};

export function SettingsScreen({ sound, onSoundChange }: { sound: AlarmSound; onSoundChange: (sound: AlarmSound) => void }) {
  const previewPlayer = useAudioPlayer(null);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const chooseAndPreviewSound = async (nextSound: AlarmSound) => {
    onSoundChange(nextSound);
    await saveAlarmSound(nextSound);
    previewPlayer.replace(previewSources[nextSound]);
    await previewPlayer.seekTo(0);
    previewPlayer.play();
  };

  const testNotification = async () => {
    const scheduled = await testAlarmSound(sound);
    if (!scheduled) {
      Alert.alert('Sound permission is off', 'Enable Sounds for Market Morning in your phone notification settings.');
      return;
    }
    Alert.alert('Notification scheduled', 'Lock your phone or leave the app. It will arrive in seven seconds.');
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ALARM SETTINGS</Text>
        <Text style={styles.title}>How should it sound?</Text>
        <Text style={styles.subtitle}>Tap a sound to select it and hear it immediately.</Text>
      </View>

      <View style={styles.soundCard}>
        {alarmSoundOptions.map((option, index) => {
          const active = option.id === sound;
          return (
            <Pressable
              key={option.id}
              onPress={() => void chooseAndPreviewSound(option.id)}
              style={[styles.soundRow, index > 0 && styles.soundDivider, active && styles.soundRowActive]}
            >
              <View style={styles.soundIcon}><Text style={styles.soundIconText}>♪</Text></View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.label}</Text>
                <Text style={styles.optionDescription}>{active ? 'Selected · tap to replay' : 'Tap to hear'}</Text>
              </View>
              <View style={[styles.selectionBadge, active && styles.selectionBadgeActive]}>
                <Text style={[styles.selectionText, active && styles.selectionTextActive]}>{active ? '✓' : '›'}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.previewNote}>System Default uses a preview tone here; the installed app will use your phone’s normal notification sound.</Text>

      <Text style={styles.sectionLabel}>OPTIONAL NOTIFICATION CHECK</Text>
      <Pressable onPress={() => void testNotification()} style={styles.testButton}>
        <Text style={styles.testButtonText}>Send a test notification</Text>
      </Pressable>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Make sure tomorrow’s alarm uses it</Text>
        <Text style={styles.infoText}>Return to Morning and tap Save my schedule again. If the notification stays quiet, turn off Silent Mode and Focus and enable Sounds in your phone’s notification settings.</Text>
      </View>
    </ScrollView>
  );
}
