import { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StatusBar, Switch, Text, View } from 'react-native';
import { getMarketStatus, getNextMarketEvent } from './marketStatus';
import { saveNotificationSchedule } from './notificationService';
import { styles } from './styles';
import { colors } from './theme';
import { minutesToTime } from './time';
import type { MarketReminder } from './types';

const DEFAULT_WAKE_MINUTES = 7 * 60;
const TIME_ADJUSTMENT_MINUTES = 15;

const defaultReminders: MarketReminder[] = [
  { id: 'premarket', label: 'Pre-market', time: '4:00 AM', enabled: false },
  { id: 'open', label: 'Market open', time: '9:30 AM', enabled: true },
  { id: 'close', label: 'Market close', time: '4:00 PM', enabled: false },
];

export default function App() {
  const [wakeMinutes, setWakeMinutes] = useState(DEFAULT_WAKE_MINUTES);
  const [wakeEnabled, setWakeEnabled] = useState(true);
  const [reminders, setReminders] = useState(defaultReminders);
  const marketStatus = useMemo(() => getMarketStatus(), []);
  const nextMarketEvent = useMemo(() => getNextMarketEvent(), []);

  const updateWakeTime = (delta: number) => {
    setWakeMinutes((current) => (current + delta + 24 * 60) % (24 * 60));
  };

  const toggleReminder = (id: string) => {
    setReminders((current) => current.map((reminder) => (
      reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
    )));
  };

  const saveSchedule = async () => {
    const scheduledDays = await saveNotificationSchedule(wakeEnabled, wakeMinutes, reminders);
    if (!scheduledDays) {
      Alert.alert('Notifications are off', 'Allow notifications in Settings so Market Morning can alert you.');
      return;
    }
    Alert.alert('Schedule saved', `Your next ${scheduledDays} market days are scheduled. Open the app occasionally to refresh your schedule.`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MARKET MORNING</Text>
          <Text style={styles.title}>Wake up ready.</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{marketStatus}</Text>
          </View>
        </View>

        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>{nextMarketEvent.label}</Text>
          <View style={styles.nextRow}>
            <Text style={styles.nextTitle}>{nextMarketEvent.title}</Text>
            <Text style={styles.nextTime}>{nextMarketEvent.time}</Text>
          </View>
          <Text style={styles.nextDetail}>{nextMarketEvent.detail}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardLabel}>WEEKDAY WAKE-UP</Text>
              <Text style={styles.helper}>A gentle start before the bell.</Text>
            </View>
            <Switch value={wakeEnabled} onValueChange={setWakeEnabled} trackColor={{ false: colors.switchOff, true: colors.brand }} />
          </View>
          <View style={styles.timeControl}>
            <Pressable onPress={() => updateWakeTime(-TIME_ADJUSTMENT_MINUTES)} style={styles.timeButton}>
              <Text style={styles.timeButtonText}>−</Text>
            </Pressable>
            <Text style={styles.time}>{minutesToTime(wakeMinutes)}</Text>
            <Pressable onPress={() => updateWakeTime(TIME_ADJUSTMENT_MINUTES)} style={styles.timeButton}>
              <Text style={styles.timeButtonText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.timeHint}>Tap − or + to adjust by 15 minutes</Text>
        </View>

        <Text style={styles.sectionTitle}>MARKET REMINDERS</Text>
        <View style={styles.card}>
          {reminders.map((reminder, index) => (
            <View key={reminder.id} style={[styles.reminder, index > 0 && styles.divider]}>
              <View>
                <Text style={styles.reminderLabel}>{reminder.label}</Text>
                <Text style={styles.reminderTime}>{reminder.time} ET · Weekdays</Text>
              </View>
              <Switch value={reminder.enabled} onValueChange={() => toggleReminder(reminder.id)} trackColor={{ false: colors.switchOff, true: colors.brand }} />
            </View>
          ))}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Simple by design</Text>
          <Text style={styles.noteText}>No accounts or price feed. Weekend and major NYSE holiday reminders are skipped automatically.</Text>
        </View>
        <Pressable style={styles.saveButton} onPress={saveSchedule}>
          <Text style={styles.saveText}>Save my schedule</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
