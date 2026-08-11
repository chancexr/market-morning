import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { alarmSoundOptions, saveAlarmSound, type AlarmSound } from './alarmSettings';
import { testAlarmSound } from './notificationService';
import { settingsStyles as styles } from './settingsStyles';

export function SettingsScreen({ sound, onSoundChange }: { sound: AlarmSound; onSoundChange: (sound: AlarmSound) => void }) {
  const chooseSound = async (nextSound: AlarmSound) => {
    onSoundChange(nextSound);
    await saveAlarmSound(nextSound);
  };

  const testSound = async () => {
    const scheduled = await testAlarmSound(sound);
    if (!scheduled) {
      Alert.alert('Sound permission is off', 'Enable Sounds for Market Morning in your phone notification settings.');
      return;
    }
    Alert.alert('Test scheduled', 'Lock your phone or leave the app. The test notification will arrive in two seconds.');
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SETTINGS</Text>
        <Text style={styles.title}>Choose your sound.</Text>
        <Text style={styles.subtitle}>Pick how Market Morning should get your attention.</Text>
      </View>

      <Text style={styles.sectionLabel}>ALARM SOUND</Text>
      {alarmSoundOptions.map((option) => {
        const active = option.id === sound;
        return (
          <Pressable key={option.id} onPress={() => void chooseSound(option.id)} style={[styles.option, active && styles.optionActive]}>
            <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{option.label}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
          </Pressable>
        );
      })}

      <Pressable onPress={() => void testSound()} style={styles.testButton}>
        <Text style={styles.testButtonText}>Test sound in 2 seconds</Text>
      </Pressable>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>If you still hear nothing</Text>
        <Text style={styles.infoText}>After choosing a sound, return to Morning and tap Save my schedule again. Turn off Silent Mode and Focus, raise the alert volume, and make sure Sounds are enabled under Settings → Notifications → Expo Go. Custom sounds require the installed Market Morning build; use System default while testing in Expo Go.</Text>
      </View>
    </ScrollView>
  );
}
